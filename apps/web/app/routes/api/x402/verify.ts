import type { ActionFunctionArgs } from "react-router";
import { verifyX402Payment } from "~/lib/near/x402.server";
import { auth } from "~/lib/auth.server";

/**
 * POST /api/x402/verify
 * 클라이언트가 수행한 X402 결제 트랜잭션을 검증하고 인보이스를 완료 처리합니다.
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, txHash } = await request.json();

    if (!token || !txHash) {
        return Response.json({ error: "Missing token or txHash" }, { status: 400 });
    }

    try {
        const result = await verifyX402Payment(token, txHash);
        return Response.json(result);
    } catch (error) {
        console.error("X402 Verification Error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 400 }
        );
    }
}
