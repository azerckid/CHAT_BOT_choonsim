/**
 * ChocoConsumptionLog 미전송(isSynced=false) 건수 확인
 * BondBase에 CHOCO_CONSUMPTION이 0건일 때, 보낼 데이터가 있는지 진단용.
 *
 * 사용: cd apps/web && npx tsx scripts/check-choco-consumption-log-sync.ts
 *      (.env.development 또는 TURSO_DATABASE_URL이 가리키는 DB 기준)
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const [unsynced, synced] = await Promise.all([
    client.execute("SELECT COUNT(*) as cnt FROM ChocoConsumptionLog WHERE isSynced = 0"),
    client.execute("SELECT COUNT(*) as cnt FROM ChocoConsumptionLog WHERE isSynced = 1"),
  ]);

  const unsyncedCount = Number((unsynced.rows[0] as { cnt: number })?.cnt ?? 0);
  const syncedCount = Number((synced.rows[0] as { cnt: number })?.cnt ?? 0);

  console.log("[ChocoConsumptionLog]");
  console.log("  isSynced=false (미전송, bondbase-sync가 보낼 대상):", unsyncedCount);
  console.log("  isSynced=true  (전송완료):", syncedCount);
  if (unsyncedCount === 0) {
    console.log("");
    console.log("  → 보낼 데이터 없음. mock-activity 또는 채팅/선물로 로그를 쌓은 뒤 bondbase-sync 실행.");
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
