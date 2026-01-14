import type { ActionFunctionArgs } from "react-router";
import { runDepositMonitoring } from "~/lib/near/deposit-engine.server";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/monitoring/test-deposit
 * NEAR 입금 모니터링을 수동으로 트리거합니다. (관리자 전용)
 */
export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: { role: true }
    });

    if (user?.role !== "ADMIN") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        console.log("[Admin] Manually triggering NEAR deposit monitoring...");
        await runDepositMonitoring();
        return Response.json({ success: true, message: "NEAR deposit monitoring completed" });
    } catch (error: any) {
        console.error("Manual Deposit Monitor Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
