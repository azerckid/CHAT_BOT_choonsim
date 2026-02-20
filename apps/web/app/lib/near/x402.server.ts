import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { BigNumber } from "bignumber.js";
import { NEAR_CONFIG } from "./client.server";
import { verifyTokenTransfer } from "./token.server";
import { nanoid } from "nanoid";

/**
 * X402 결제를 위한 인보이스를 생성합니다.
 * @param userId 결제할 사용자 ID
 * @param amountUSD 결제할 금액 (USD)
 * @returns { token: 인증토큰, invoice: 결제정보 }
 */
export async function createX402Invoice(
    userId: string,
    amountUSD: number
) {
    // 1. CHOCO 환율 계산 (1 CHOCO = $0.001, 즉 $1 = 1,000 CHOCO)
    const chocoPriceUSD = 0.001;
    const chocoAmount = new BigNumber(amountUSD).dividedBy(chocoPriceUSD);
    const amountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toString();

    // 2. 고유 결제 토큰 생성
    const token = crypto.randomBytes(32).toString("hex");

    // 3. DB 저장
    const invoiceId = nanoid();
    await db.insert(schema.x402Invoice).values({
        id: invoiceId,
        token,
        userId,
        amount: amountUSD,
        currency: "USD",
        chocoAmount: amountRaw,
        recipientAddress: NEAR_CONFIG.serviceAccountId,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 유효
        createdAt: new Date(),
    });

    return {
        token,
        invoice: {
            recipient: NEAR_CONFIG.serviceAccountId,
            amount: chocoAmount.toString(),
            currency: "CHOCO",
            tokenContract: NEAR_CONFIG.chocoTokenContract,
        },
    };
}

/**
 * 402 Payment Required 응답 객체를 생성합니다.
 */
export function createX402Response(token: string, invoice: any): Response {
    return Response.json(
        {
            error: "Payment Required",
            code: "X402_PAYMENT_REQUIRED",
            message: "이 자원을 이용하려면 CHOCO 결제가 필요합니다."
        },
        {
            status: 402,
            headers: {
                "X-x402-Token": token,
                "X-x402-Invoice": JSON.stringify(invoice),
                "Access-Control-Expose-Headers": "X-x402-Token, X-x402-Invoice",
            },
        }
    );
}

/**
 * 클라이언트가 제출한 트랜잭션 해시를 검증하고 인보이스를 완료 처리합니다.
 */
export async function verifyX402Payment(token: string, txHash: string) {
    // 1. 인보이스 조회
    const invoice = await db.query.x402Invoice.findFirst({
        where: eq(schema.x402Invoice.token, token),
    });

    if (!invoice || invoice.status !== "PENDING") {
        throw new Error("Invalid or already processed invoice");
    }

    // 2. 온체인 트랜잭션 검증 (ft_transfer 확인)
    const transfer = await verifyTokenTransfer(txHash, invoice.recipientAddress);

    if (!transfer.isValid) {
        throw new Error("Invalid transaction");
    }

    // 금액 대조 (최소 인보이스 금액 이상이어야 함)
    const paidAmount = new BigNumber(transfer.amount);
    const requiredAmount = new BigNumber(invoice.chocoAmount);

    if (paidAmount.isLessThan(requiredAmount)) {
        throw new Error("Insufficient payment amount");
    }

    // 3. DB 업데이트: 인보이스 완료 및 유저 CHOCO 잔액 차감 (결제이므로 감소)
    const chocoToDeduct = new BigNumber(transfer.amount).dividedBy(new BigNumber(10).pow(18)).toString();

    await db.transaction(async (tx) => {
        // 인보이스 상태 변경
        await tx.update(schema.x402Invoice)
            .set({
                status: "PAID",
                txHash,
                paidAt: new Date(),
            })
            .where(eq(schema.x402Invoice.id, invoice.id));

        // 토큰 전송 기록 추가
        await tx.insert(schema.tokenTransfer).values({
            id: nanoid(),
            userId: invoice.userId,
            txHash,
            amount: transfer.amount,
            tokenContract: NEAR_CONFIG.chocoTokenContract,
            status: "COMPLETED",
            purpose: "PAYMENT",
            createdAt: new Date(),
        });

        // 유저 CHOCO 잔액 업데이트 (결제이므로 감소)
        // CHOCO는 온체인에서 이미 지출되었으므로 DB도 동기화하여 감소
        const user = await tx.query.user.findFirst({
            where: eq(schema.user.id, invoice.userId),
            columns: { chocoBalance: true },
        });

        const currentChocoBalance = user?.chocoBalance ? parseFloat(user.chocoBalance) : 0;
        const newChocoBalance = new BigNumber(currentChocoBalance).minus(chocoToDeduct).toString();

        await tx.update(schema.user)
            .set({
                chocoBalance: newChocoBalance,
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, invoice.userId));
    });

    // 4. (보고서 권장사항) 온체인 잔액과 최종 동기화 (정합성 보장 가드레일)
    try {
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, invoice.userId),
            columns: { nearAccountId: true }
        });

        if (user?.nearAccountId) {
            const { getChocoBalance } = await import("./token.server");
            const onChainBalanceRaw = await getChocoBalance(user.nearAccountId);
            const onChainBalanceBN = new BigNumber(onChainBalanceRaw).dividedBy(new BigNumber(10).pow(18));

            await db.update(schema.user).set({
                chocoBalance: onChainBalanceBN.toString(),
                chocoLastSyncAt: new Date(),
            }).where(eq(schema.user.id, invoice.userId));

            console.log(`[X402] On-chain balance sync completed for ${user.nearAccountId}: ${onChainBalanceBN.toString()} CHOCO`);
        }
    } catch (syncError) {
        console.error("[X402] Final balance sync failed, but payment was already processed:", syncError);
    }

    return { success: true, chocoDeducted: chocoToDeduct };
}
