import type { LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { getRelayerBalance } from "~/lib/near/relayer.server";
import { getNearConnection } from "~/lib/near/client.server";
import { getNearPriceUSD } from "~/lib/near/exchange-rate.server";
import { logger } from "~/lib/logger.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, sql, desc } from "drizzle-orm";

/**
 * GET /api/admin/monitoring/near
 * NEAR 시스템 모니터링 정보를 조회합니다.
 * 관리자 권한 필요.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 관리자 권한 확인
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: { role: true }
    });

    if (user?.role !== "ADMIN") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // 1. Relayer 잔액 조회
        const relayerBalance = await getRelayerBalance();

        // 2. NEAR 가격 조회
        const nearPriceUSD = await getNearPriceUSD();

        // 3. 최근 ExchangeLog 통계
        const recentExchanges = await db.query.exchangeLog.findMany({
            orderBy: [desc(schema.exchangeLog.createdAt)],
            limit: 10,
            columns: {
                id: true,
                userId: true,
                fromChain: true,
                fromAmount: true,
                toToken: true,
                toAmount: true,
                rate: true,
                status: true,
                createdAt: true,
            }
        });

        // 4. 동기화 상태 통계
        const syncStats = await db.select({
            totalUsers: sql<number>`COUNT(*)`,
            usersWithNearAccount: sql<number>`COUNT(${schema.user.nearAccountId})`,
            totalChocoBalance: sql<string>`SUM(CAST(${schema.user.chocoBalance} AS REAL))`,
        }).from(schema.user);

        // 5. 최근 Relayer 활동
        const recentRelayerLogs = await db.query.relayerLog.findMany({
            orderBy: [desc(schema.relayerLog.createdAt)],
            limit: 10,
            columns: {
                id: true,
                userId: true,
                txHash: true,
                status: true,
                error: true,
                createdAt: true,
            }
        });

        return Response.json({
            relayerBalance,
            nearPriceUSD,
            recentExchanges,
            syncStats: syncStats[0] || { totalUsers: 0, usersWithNearAccount: 0, totalChocoBalance: "0" },
            recentRelayerLogs,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({
            category: "API",
            message: "Monitoring API error",
            stackTrace: (error as Error).stack
        });
        return Response.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
