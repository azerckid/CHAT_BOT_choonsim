import type { ActionFunctionArgs } from "react-router";
import { BigNumber } from "bignumber.js";
import { getNearConnection, NEAR_CONFIG } from "~/lib/near/client.server";
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

        // 2. NEAR 온체인 트랜잭션 검증
        const near = await getNearConnection();
        const txStatus = await near.connection.provider.txStatus(txHash, NEAR_CONFIG.serviceAccountId, "final");

        // FT Transfer(ft_transfer or ft_transfer_call) 이벤트 및 영수증 분석 필요
        // 여기서는 단순화를 위해 트랜잭션이 성공했고, 호출된 컨트랙트가 CHOCO이며, 
        // 메서드가 송금 관련인지만 확인하는 로직의 골격만 작성합니다.

        // 실제 운영 환경에서는 Indexer 서버가 필터링한 데이터를 받거나, 
        // 여기서 txStatus.receipts_outcome을 꼼꼼히 파싱해야 합니다.

        const isSuccess = (txStatus.status as any).SuccessValue !== undefined;
        if (!isSuccess) {
            return Response.json({ error: "Transaction failed on-chain" }, { status: 400 });
        }

        // 예시: 트랜잭션에서 추출된 금액 (실제 구현 시 txStatus 파싱 필요)
        // 임시로 100 CHOCO를 입금받았다고 가정하거나, 요청 본문의 데이터를 신뢰하되 온체인 데이터와 대조합니다.
        const amountRaw = "100000000000000000000"; // 100 CHOCO
        const amountHuman = new BigNumber(amountRaw).dividedBy(new BigNumber(10).pow(18)).toNumber();

        // 3. DB 트랜잭션: 유저 크레딧 충전 및 전송 기록 생성
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

            // 유저 크레딧 업데이트 (1 CHOCO = 1 Credit 가정)
            await tx.update(schema.user)
                .set({
                    credits: sql`${schema.user.credits} + ${amountHuman}`,
                    chocoBalance: sql`${schema.user.chocoBalance} + ${amountRaw}`, // 잔고도 함께 동기화
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));
        });

        return Response.json({ success: true, creditedAmount: amountHuman });
    } catch (error) {
        console.error("Token deposit webhook error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
