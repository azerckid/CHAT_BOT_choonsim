/**
 * Phase 0-1: evmAddress, evmPrivateKey 컬럼 추가 마이그레이션만 실행
 * 기존 DB에 이미 다른 마이그레이션이 적용된 경우 drizzle-kit migrate 대신 이 스크립트 사용
 *
 * 사용: cd apps/web && npx tsx scripts/run-migration-0012.ts
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
  const sqlPath = join(__dirname, "../drizzle/0012_add_evm_wallet_columns.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  const statements = sql
    .split(/;--> statement-breakpoint\n?/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const stmt = statement.endsWith(";") ? statement : statement + ";";
    try {
      await client.execute(stmt);
      console.log("[OK]", stmt.slice(0, 60) + "...");
    } catch (e: any) {
      if (e?.message?.includes("duplicate column") || e?.message?.includes("already exists")) {
        console.log("[SKIP] Column or index already exists:", stmt.slice(0, 50) + "...");
      } else {
        throw e;
      }
    }
  }
  console.log("Migration 0012 done.");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
