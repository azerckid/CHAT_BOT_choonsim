import type { LoaderFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: {
            evmAddress: true,
            walletStatus: true,
            walletError: true,
            chocoBalance: true,
        }
    });

    return Response.json({
        accountId: user?.evmAddress ?? null,
        status: user?.walletStatus ?? null,
        error: user?.walletError ?? null,
        isReady: user?.walletStatus === "READY",
        chocoBalance: user?.chocoBalance ?? "0",
    });
}
