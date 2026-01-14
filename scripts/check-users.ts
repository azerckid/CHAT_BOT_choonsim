
import { db } from "../app/lib/db.server";
import { user } from "../app/db/schema";
import { sql } from "drizzle-orm";

async function main() {
    const usersWithBalance = await db.select({
        id: user.id,
        nearAccountId: user.nearAccountId,
        nearLastBalance: user.nearLastBalance
    }).from(user).where(sql`${user.nearAccountId} IS NOT NULL`);

    console.log(JSON.stringify(usersWithBalance, null, 2));
}

main().catch(console.error);
