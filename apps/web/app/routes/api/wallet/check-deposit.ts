
import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { runDepositMonitoring } from "~/lib/near/deposit-engine.server";

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute the deposit monitoring engine
    // In production, this would be a background job, but for UAT we trigger it manually
    try {
        await runDepositMonitoring();
        return Response.json({ success: true, message: "Deposit scan completed" });
    } catch (error) {
        console.error("Deposit scan failed:", error);
        return Response.json({ success: false, error: "Failed to scan deposits" }, { status: 500 });
    }
}

export async function loader() {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
}
