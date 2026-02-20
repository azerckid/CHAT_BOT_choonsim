
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.development" });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });

    const users = await db.select().from(schema.user);
    console.log("Searching for public key: ed25519:FwY1hVCrvJBcN2uCfUbh7BLaSX2ztdLMqzqyQWnbggJ3");
    const matchingUser = users.find(u => u.nearPublicKey === "ed25519:FwY1hVCrvJBcN2uCfUbh7BLaSX2ztdLMqzqyQWnbggJ3");

    if (matchingUser) {
        console.log(`Found matching user: ${matchingUser.id} (${matchingUser.nearAccountId})`);
    } else {
        console.log("No user found with this public key.");
    }
}

main().catch(console.error);
