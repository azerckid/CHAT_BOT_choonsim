
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { sql } from "drizzle-orm";

dotenv.config({ path: ".env.development" });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });

    const usersWithBalance = await db.select({
        id: schema.user.id,
        nearAccountId: schema.user.nearAccountId,
        nearLastBalance: schema.user.nearLastBalance
    }).from(schema.user).where(sql`${schema.user.nearAccountId} IS NOT NULL`);

    console.log(JSON.stringify(usersWithBalance, null, 2));
}

main().catch(console.error);
