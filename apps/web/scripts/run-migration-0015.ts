/**
 * Phase 3-1: User.lastFreePresendAt 컬럼 추가 (BASIC+ 주 1회 무료 선톡)
 * 사용: cd apps/web && npx tsx scripts/run-migration-0015.ts
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionConfig = {
  url: process.env.TURSO_DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
};

async function main() {
  const client = createClient(connectionConfig);
  const sqlPath = join(__dirname, "../drizzle/0015_add_last_free_presend_at.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    if (!stmt || stmt.startsWith("--")) continue;
    const full = stmt.endsWith(";") ? stmt : stmt + ";";
    try {
      await client.execute(full);
      console.log("[OK]", full.slice(0, 60) + "...");
    } catch (e: any) {
      if (e?.message?.includes("duplicate column")) {
        console.log("[SKIP] Column already exists:", full.slice(0, 50) + "...");
      } else {
        throw e;
      }
    }
  }
  console.log("Migration 0015 done.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
