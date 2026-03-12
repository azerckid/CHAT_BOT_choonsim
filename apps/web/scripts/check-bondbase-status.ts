/**
 * BondBase 연동 현황 확인: ChocoConsumptionLog 테이블 + 캐릭터 bondBaseId
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { db } from "../app/lib/db.server";
import * as schema from "../app/db/schema";
import { count } from "drizzle-orm";

async function main() {
    const [logCount] = await db.select({ cnt: count() }).from(schema.chocoConsumptionLog);
    console.log("ChocoConsumptionLog rows:", logCount?.cnt);

    const chars = await db.query.character.findMany({ columns: { id: true, name: true, bondBaseId: true } });
    console.log("\nCharacter bondBaseId 현황:");
    for (const c of chars) {
        console.log(`  ${c.id} (${c.name}): bondBaseId=${c.bondBaseId ?? "null"}`);
    }
}

main().catch(console.error);
