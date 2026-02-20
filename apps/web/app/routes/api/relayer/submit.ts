import type { ActionFunctionArgs } from "react-router";
import { submitMetaTransaction, logRelayerAction, getRelayerBalance } from "~/lib/near/relayer.server";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { relayerLog } from "~/db/schema";
import { sql, and, eq, gte } from "drizzle-orm";
import { z } from "zod";

const submitSchema = z.object({
    signedDelegate: z.string().min(1, "SignedDelegate is required"),
});

const RATE_LIMIT_PER_HOUR = 10;
const LOW_BALANCE_THRESHOLD = 0.5; // NEAR

/**
 * 클라이언트로부터 받은 Meta Transaction(SignedDelegate)을 Relayer를 통해 제출합니다.
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    // 1. 인증 및 사용자 식별
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";

    try {
        const body = await request.json();
        const { signedDelegate } = submitSchema.parse(body);

        // 2. Rate Limiting 체크 (최근 1시간 내 요청 횟수)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentLogs = await db.query.relayerLog.findMany({
            where: and(
                eq(relayerLog.userId, userId),
                gte(relayerLog.createdAt, oneHourAgo),
                eq(relayerLog.status, "SUCCESS")
            )
        });

        if (recentLogs.length >= RATE_LIMIT_PER_HOUR) {
            return Response.json({
                error: "Rate limit exceeded. Please try again later.",
                limit: RATE_LIMIT_PER_HOUR,
                current: recentLogs.length
            }, { status: 429 });
        }

        // 3. 서비스 계정 잔액 모니터링 (선택적 체크)
        const balance = await getRelayerBalance();
        if (parseFloat(balance.available) < LOW_BALANCE_THRESHOLD) {
            console.warn(`[RELAYER WARNING] Low balance: ${balance.available} NEAR`);
            // 잔액이 너무 낮으면 관리자 알림 등이 필요함
        }

        // 4. 트랜잭션 제출
        const result = await submitMetaTransaction(signedDelegate);

        // 5. 결과 로깅
        await logRelayerAction({
            userId,
            requestIp: clientIp,
            txHash: result.success ? result.txHash : undefined,
            error: result.success ? undefined : result.error,
            status: result.success ? "SUCCESS" : "FAILED",
        });

        if (!result.success) {
            return Response.json({ error: result.error }, { status: 400 });
        }

        return Response.json({
            ...result,
            remainingQuota: RATE_LIMIT_PER_HOUR - recentLogs.length - 1
        });
    } catch (error) {
        console.error("Relayer API Error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Failed to process relayer request" },
            { status: 500 }
        );
    }
}
