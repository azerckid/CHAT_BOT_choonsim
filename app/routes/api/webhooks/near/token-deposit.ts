import type { ActionFunctionArgs } from "react-router";
import { BigNumber } from "bignumber.js";
import { verifyTokenTransfer } from "~/lib/near/token.server";
import { calculateCreditsFromChoco } from "~/lib/credit-policy";
import { NEAR_CONFIG } from "~/lib/near/client.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/webhooks/near/token-deposit
 * 온체인 토큰 입금이 확인되었을 때 호출되어 사용자의 크레딧을 업데이트합니다.
 * (주로 직접 송금이나 지갑 동기화 시 사용)
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { txHash, userId } = await request.json();

    if (!txHash || !userId) {
        return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
        // 1. 중복 처리 방지 (txHash 중복 체크)
        const existingTx = await db.query.tokenTransfer.findFirst({
            where: eq(schema.tokenTransfer.txHash, txHash),
        });

        if (existingTx) {
            return Response.json({ error: "Transaction already processed" }, { status: 409 });
        }

        // 2. 사용자 정보 조회 (NEAR 계정 ID 확인)
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { nearAccountId: true },
        });

        if (!user?.nearAccountId) {
            return Response.json(
                { error: "User NEAR account not found" },
                { status: 400 }
            );
        }

        // 3. 온체인 트랜잭션 검증 및 금액 파싱
        const transferInfo = await verifyTokenTransfer(txHash, user.nearAccountId);

        if (!transferInfo.isValid) {
            return Response.json(
                { error: "Invalid transaction or no CHOCO transfer found" },
                { status: 400 }
            );
        }

        // 4. 금액 변환 (raw amount → human-readable)
        const amountRaw = transferInfo.amount; // Raw amount (18 decimals)
        const amountHuman = new BigNumber(amountRaw)
            .dividedBy(new BigNumber(10).pow(18))
            .toNumber();

        // 5. 크레딧 환산
        const creditsToAdd = calculateCreditsFromChoco(amountHuman);

        if (creditsToAdd <= 0) {
            return Response.json(
                { error: "Invalid transfer amount" },
                { status: 400 }
            );
        }

        // 6. DB 트랜잭션: 유저 크레딧 충전 및 전송 기록 생성
        await db.transaction(async (tx) => {
            // 전송 기록 저장
            await tx.insert(schema.tokenTransfer).values({
                id: nanoid(),
                userId,
                txHash,
                amount: amountRaw,
                tokenContract: NEAR_CONFIG.chocoTokenContract,
                status: "COMPLETED",
                purpose: "TOPUP",
                createdAt: new Date(),
            });

            // 유저 크레딧 및 CHOCO 잔액 업데이트
            await tx.update(schema.user)
                .set({
                    credits: sql`${schema.user.credits} + ${creditsToAdd}`,
                    chocoBalance: sql`${schema.user.chocoBalance} + ${amountRaw}`,
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));
        });

        return Response.json({
            success: true,
            creditedAmount: creditsToAdd,
            chocoAmount: amountHuman,
            transferInfo: {
                from: transferInfo.from,
                to: transferInfo.to,
            },
        });
    } catch (error) {
        console.error("Token deposit webhook error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
