import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { eq, desc } from "drizzle-orm";

dotenv.config({ path: ".env.development" });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });

    const rows = await db.query.tokenTransfer.findMany({
        where: eq(schema.tokenTransfer.userId, "n6F3rktVX2MEuqplpOJBAd3kq6sYh2TF"),
        orderBy: [desc(schema.tokenTransfer.createdAt)],
        limit: 3,
    });

    if (rows.length === 0) {
        console.log("TokenTransfer 기록 없음");
        return;
    }

    for (const r of rows) {
        console.log(JSON.stringify(r, null, 2));
        console.log("---");
    }
}

main().catch(console.error);
