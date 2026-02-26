/**
 * BondBase Revenue Bridge - Phase A 마이그레이션
 * 1. Character.bondBaseId 컬럼 추가
 * 2. ChocoConsumptionLog 테이블 + 인덱스 생성
 *
 * 실행: tsx scripts/run-migration-bondbase.ts
 */
import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log("🚀 BondBase Phase A 마이그레이션 시작...\n");

    // 1. Character.bondBaseId 컬럼 추가
    try {
        await client.execute("ALTER TABLE Character ADD COLUMN bondBaseId INTEGER");
        console.log("✅ Character.bondBaseId 컬럼 추가 완료");
    } catch (e: any) {
        if (e.message?.includes("duplicate column name")) {
            console.log("ℹ️  Character.bondBaseId 이미 존재, 건너뜀");
        } else {
            throw e;
        }
    }

    // 2. ChocoConsumptionLog 테이블 생성
    await client.execute(`
        CREATE TABLE IF NOT EXISTS ChocoConsumptionLog (
            id        TEXT    NOT NULL PRIMARY KEY,
            characterId TEXT  NOT NULL,
            chocoAmount TEXT  NOT NULL,
            source    TEXT    NOT NULL,
            isSynced  INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL DEFAULT (unixepoch())
        )
    `);
    console.log("✅ ChocoConsumptionLog 테이블 생성 완료");

    // 3. 복합 인덱스 생성
    await client.execute(`
        CREATE INDEX IF NOT EXISTS ChocoConsumptionLog_characterId_isSynced_idx
        ON ChocoConsumptionLog (characterId, isSynced)
    `);
    console.log("✅ ChocoConsumptionLog 인덱스 생성 완료");

    // 4. 결과 검증
    const charCols = await client.execute("PRAGMA table_info(Character)");
    const hasBondBaseId = charCols.rows.some((r: any) => r.name === "bondBaseId");

    const tables = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ChocoConsumptionLog'"
    );
    const hasTable = tables.rows.length > 0;

    console.log("\n📋 검증 결과:");
    console.log(`  Character.bondBaseId : ${hasBondBaseId ? "✅ 존재" : "❌ 없음"}`);
    console.log(`  ChocoConsumptionLog  : ${hasTable ? "✅ 존재" : "❌ 없음"}`);

    if (!hasBondBaseId || !hasTable) {
        throw new Error("마이그레이션 검증 실패");
    }

    console.log("\n✅ 마이그레이션 완료!");
}

migrate()
    .catch((e) => {
        console.error("❌ 마이그레이션 실패:", e);
        process.exit(1);
    })
    .finally(() => {
        client.close();
    });
