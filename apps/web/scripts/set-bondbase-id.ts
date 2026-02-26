/**
 * chunsim 캐릭터 bondBaseId=101 설정
 * 실행: npx tsx scripts/set-bondbase-id.ts
 */
import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    const updated = await client.execute(
        "UPDATE Character SET bondBaseId = 101 WHERE id = 'chunsim'"
    );
    console.log(`업데이트된 행: ${updated.rowsAffected}`);

    const result = await client.execute(
        "SELECT id, bondBaseId FROM Character WHERE id = 'chunsim'"
    );
    console.log("결과:", result.rows);

    if (result.rows[0] && (result.rows[0] as any).bondBaseId === 101) {
        console.log("✅ chunsim bondBaseId=101 설정 완료");
    } else {
        throw new Error("설정 실패 또는 chunsim 캐릭터 없음");
    }
}

run()
    .catch((e) => { console.error("❌", e); process.exit(1); })
    .finally(() => client.close());
