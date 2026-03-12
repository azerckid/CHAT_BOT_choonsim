/**
 * Phase 1-2 E2E 테스트용: 특정 유저의 chocoBalance를 0으로 설정
 * 사용법: USER_ID=xxx npx tsx scripts/set-zero-choco.ts
 */
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../app/db/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.development" });

async function main() {
    const userId = process.env.USER_ID;
    if (!userId) {
        console.error("USER_ID 환경변수 필요. 예: USER_ID=xxx npx tsx scripts/set-zero-choco.ts");
        process.exit(1);
    }

    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });

    const before = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { id: true, email: true, chocoBalance: true },
    });

    if (!before) { console.error("유저 없음:", userId); process.exit(1); }

    console.log(`변경 전: ${before.email} — ${before.chocoBalance} CHOCO`);

    await db.update(schema.user)
        .set({ chocoBalance: "0", updatedAt: new Date() })
        .where(eq(schema.user.id, userId));

    console.log(`✅ ${before.email} chocoBalance → 0`);
    console.log("(테스트 후 복구 필요 시 Admin 또는 스크립트로 직접 설정)");
}

main().catch(console.error);
