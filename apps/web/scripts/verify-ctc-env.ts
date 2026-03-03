/**
 * Phase 0-4 검증: CTC Deposit Engine 환경변수 설정 확인
 * 사용: cd apps/web && npx tsx scripts/verify-ctc-env.ts
 * 값은 출력하지 않음 (보안)
 */
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, "..");

dotenv.config({ path: join(webDir, ".env.development") });
dotenv.config({ path: join(webDir, ".env") });
dotenv.config({ path: join(webDir, ".env.production"), override: true });

const REQUIRED = ["CTC_RPC_URL", "CTC_TREASURY_ADDRESS", "CRON_SECRET"] as const;
const OPTIONAL = ["CTC_PRICE_API_URL"] as const;

function main() {
  let ok = true;
  for (const key of REQUIRED) {
    const val = process.env[key];
    if (!val || String(val).trim() === "") {
      console.error(`[MISSING] ${key}`);
      ok = false;
    } else {
      console.log(`[OK] ${key} is set`);
    }
  }
  for (const key of OPTIONAL) {
    const val = process.env[key];
    if (val && String(val).trim() !== "") {
      console.log(`[OK] ${key} is set (optional)`);
    } else {
      console.log(`[SKIP] ${key} not set (optional)`);
    }
  }
  if (!ok) {
    console.error("See 05_CTC_DEPOSIT_ENGINE_SETUP_AND_TEST.md for setup.");
    process.exit(1);
  }
  console.log("Phase 0-4 env ready.");
}

main();
