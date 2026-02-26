
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

    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, "pQgfd2MfcDVQCVMkXTe9gfJ5TVUZWSpk")
    });

    console.log(`User ID: ${user?.id}`);
    console.log(`EVM Address: ${user?.evmAddress ?? "(none)"}`);
}

main().catch(console.error);
