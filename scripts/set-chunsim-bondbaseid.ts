import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    // 현재 캐릭터 목록 확인
    const existing = await client.execute("SELECT id, name, bondBaseId FROM Character");
    console.log("현재 Character 목록:");
    for (const row of existing.rows) {
        console.log(`  id=${row.id}, name=${row.name}, bondBaseId=${row.bondBaseId}`);
    }

    // chunsim 캐릭터에 bondBaseId = 101 설정
    const result = await client.execute({
        sql: "UPDATE Character SET bondBaseId = 101 WHERE id = 'chunsim'",
        args: [],
    });
    console.log(`\nUPDATE 결과: ${result.rowsAffected}행 영향`);

    // 확인
    const after = await client.execute(
        "SELECT id, name, bondBaseId FROM Character WHERE id = 'chunsim'"
    );
    if (after.rows.length === 0) {
        console.warn("⚠️  chunsim 캐릭터를 찾지 못했습니다. id 값 확인 필요.");
        // 전체 캐릭터 다시 출력
        const all = await client.execute("SELECT id, name FROM Character");
        console.log("전체 캐릭터 id 목록:");
        for (const row of all.rows) {
            console.log(`  id=${row.id}, name=${row.name}`);
        }
    } else {
        const r = after.rows[0];
        console.log(`\n검증: id=${r.id}, name=${r.name}, bondBaseId=${r.bondBaseId}`);
        if (r.bondBaseId === 101) {
            console.log("✅ bondBaseId=101 설정 완료");
        } else {
            console.error("❌ bondBaseId 설정 실패");
        }
    }
}

run()
    .catch((e) => { console.error("실패:", e); process.exit(1); })
    .finally(() => client.close());
