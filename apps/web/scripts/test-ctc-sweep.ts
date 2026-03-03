/**
 * Phase 0-4: ctc-sweep API 수동 호출 테스트
 * 사용: 로컬 서버 실행 후, cd apps/web && npx tsx scripts/test-ctc-sweep.ts
 */
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, "..");

dotenv.config({ path: join(webDir, ".env.development") });
dotenv.config({ path: join(webDir, ".env.production"), override: true });

const BASE = process.env.BASE_URL || "http://localhost:5173";
const SECRET = process.env.CRON_SECRET;

async function main() {
  if (!SECRET || !SECRET.trim()) {
    console.error("[FAIL] CRON_SECRET not set");
    process.exit(1);
  }
  const url = `${BASE}/api/cron/ctc-sweep`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    if (!res.ok) {
      console.error(`[FAIL] ${res.status} ${res.statusText}`);
      console.error(text.slice(0, 500));
      process.exit(1);
    }
    console.log("[OK] ctc-sweep response:", json);
  } catch (e) {
    console.error("[FAIL] Request error:", (e as Error).message);
    console.error("Ensure dev server is running: npm run dev");
    process.exit(1);
  }
}

main();
