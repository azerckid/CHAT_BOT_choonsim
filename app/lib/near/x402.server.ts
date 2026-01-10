import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { BigNumber } from "bignumber.js";
import { NEAR_CONFIG } from "./client.server";
import { verifyTokenTransfer } from "./token.server";
import { calculateCreditsFromChoco } from "../credit-policy";
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
    // 1. CHOCO 환율 계산 (현재 1 Credit = $0.0001, 1 CHOCO = 1 Credit 가정)
    // $1 = 10,000 Credits = 10,000 CHOCO
    const chocoPriceUSD = 0.0001;
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

    // 3. DB 업데이트: 인보이스 완료 및 유저 크레딧 충전
    const creditsToAdd = calculateCreditsFromChoco(
        new BigNumber(transfer.amount).dividedBy(new BigNumber(10).pow(18)).toNumber()
    );

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

        // 유저 자산 업데이트 (동기화)
        await tx.update(schema.user)
            .set({
                credits: sql`${schema.user.credits} + ${creditsToAdd}`,
                chocoBalance: sql`${schema.user.chocoBalance} + ${transfer.amount}`, // 입금 개념이므로 증가
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, invoice.userId));
    });

    return { success: true, creditsAdded: creditsToAdd };
}
