import type { ActionFunctionArgs } from "react-router";
import { submitMetaTransaction } from "~/lib/near/relayer.server";
import { z } from "zod";

const submitSchema = z.object({
    signedDelegate: z.string().min(1, "SignedDelegate is required"),
});

/**
 * 클라이언트로부터 받은 Meta Transaction(SignedDelegate)을 Relayer를 통해 제출합니다.
 * 이를 통해 사용자는 NEAR 코인 없이 가스비 0원으로 트랜잭션을 실행할 수 있습니다.
 */
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { signedDelegate } = submitSchema.parse(body);

        const result = await submitMetaTransaction(signedDelegate);

        if (!result.success) {
            return Response.json({ error: result.error }, { status: 400 });
        }

        return Response.json(result);
    } catch (error) {
        console.error("Relayer API Error:", error);
        return Response.json(
            { error: error instanceof Error ? error.message : "Failed to process relayer request" },
            { status: 500 }
        );
    }
}
