import type { LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { getChocoBalance } from "~/lib/near/token.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/token/balance
 * 사용자의 실시간 온체인 CHOCO 잔액을 조회하고 DB와 동기화합니다.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { nearAccountId: true, chocoBalance: true },
    });

    if (!user?.nearAccountId) {
        return Response.json({
            chocoBalance: user?.chocoBalance || "0",
            nearAccountId: null,
            isSynced: false,
            message: "NEAR wallet not linked"
        });
    }

    // 1. 온체인 잔액 조회
    const onChainBalance = await getChocoBalance(user.nearAccountId);

    // 2. DB 동기화 (값이 다를 경우만)
    if (onChainBalance !== user.chocoBalance) {
        await db.update(schema.user)
            .set({
                chocoBalance: onChainBalance,
                chocoLastSyncAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));
    }

    return Response.json({
        chocoBalance: onChainBalance,
        nearAccountId: user.nearAccountId,
        isSynced: true,
        lastSyncAt: new Date().toISOString()
    });
}
