import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await request.json();

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                pushSubscription: JSON.stringify(subscription)
            }
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Save subscription error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
