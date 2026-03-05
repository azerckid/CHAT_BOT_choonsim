/**
 * chunsim / rina 캐릭터 bondBaseId 설정
 *   chunsim → 101
 *   rina    → 102  (순차 부여 규칙: docs/04_Logic_Progress/06_BONDBASE_BRIDGE_PLAN.md)
 *
 * 실행: cd apps/web && npx tsx scripts/set-bondbase-id.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const BOND_IDS: Record<string, number> = {
    chunsim: 101,
    rina: 102,
};

async function run() {
    // 현재 상태 먼저 확인
    const before = await client.execute(
        "SELECT id, name, bondBaseId FROM Character WHERE id IN ('chunsim', 'rina')"
    );
    console.log("[현재 상태]");
    for (const row of before.rows) {
        const r = row as { id: string; name: string; bondBaseId: number | null };
        console.log(`  ${r.id} (${r.name}): bondBaseId = ${r.bondBaseId ?? "null (미설정)"}`);
    }
    console.log("");

    // 설정
    for (const [charId, bondId] of Object.entries(BOND_IDS)) {
        const updated = await client.execute({
            sql: "UPDATE Character SET bondBaseId = ? WHERE id = ?",
            args: [bondId, charId],
        });

        if (updated.rowsAffected === 0) {
            console.warn(`⚠️  ${charId}: 캐릭터 없음 (rowsAffected=0)`);
        } else {
            console.log(`✅ ${charId}: bondBaseId = ${bondId} 설정 완료`);
        }
    }

    // 최종 확인
    console.log("\n[최종 상태]");
    const after = await client.execute(
        "SELECT id, name, bondBaseId FROM Character WHERE id IN ('chunsim', 'rina')"
    );
    for (const row of after.rows) {
        const r = row as { id: string; name: string; bondBaseId: number | null };
        console.log(`  ${r.id} (${r.name}): bondBaseId = ${r.bondBaseId ?? "null"}`);
    }
}

run()
    .catch((e) => { console.error("❌", e); process.exit(1); })
    .finally(() => client.close());
