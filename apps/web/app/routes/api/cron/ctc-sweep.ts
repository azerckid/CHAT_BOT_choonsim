/**
 * Phase 0-4: CTC 입금 감지 및 스윕 Cron 엔드포인트
 * Vercel Cron에서 호출. CRON_SECRET 헤더로 인증.
 *
 * Related: docs/04_Logic_Progress/03_BM_IMPLEMENTATION_PLAN.md Phase 0-4
 */
import type { LoaderFunctionArgs } from "react-router";
import { runCtcDepositAndSweep } from "~/lib/ctc/deposit-engine.server";

const CRON_SECRET = process.env.CRON_SECRET;

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get("Authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? request.headers.get("X-Cron-Secret") ?? "";

  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCtcDepositAndSweep();
    return Response.json({
      ok: true,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (e) {
    console.error("[CTC Sweep Cron]", e);
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
