import { db } from "../app/lib/db.server";
import * as schema from "../app/db/schema";
import { isNull, eq, and } from "drizzle-orm";
import { ensureNearWallet } from "../app/lib/near/wallet.server";
import { checkServiceAccountBalance } from "../app/lib/near/balance-monitor.server";

/**
 * 지갑이 없는 모든 사용자에게 자동으로 NEAR 지갑을 생성해 주는 마이그레이션 스크립트
 */

async function migrate() {
    console.log("🚀 Starting NEAR Wallet Batch Migration...");

    // 1. 서비스 계정 잔액 체크
    const balance = await checkServiceAccountBalance();
    console.log(`[Status] Service Account: ${process.env.NEAR_SERVICE_ACCOUNT_ID}`);
    console.log(`[Status] Available Balance: ${balance.available} NEAR`);

    if (balance.isRunningLow) {
        console.warn("⚠️ Warning: Service account balance is very low!");
        // 너무 낮으면 수동 확인을 위해 중단하거나 경고만 노출
    }

    // 2. 지갑이 없는 사용자 조회
    const usersToMigrate = await db.query.user.findMany({
        where: isNull(schema.user.nearAccountId),
        columns: { id: true, email: true }
    });

    const totalCount = usersToMigrate.length;
    console.log(`[Status] Found ${totalCount} users needing a wallet.`);

    if (totalCount === 0) {
        console.log("✅ All users already have wallets. No migration needed.");
        return;
    }

    // 3. 배치 처리 (동시 실행 방지를 위해 순차 처리 또는 작은 청크로 처리)
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < usersToMigrate.length; i++) {
        const user = usersToMigrate[i];
        const progress = `[${i + 1}/${totalCount}]`;

        try {
            console.log(`${progress} Processing user: ${user.email} (${user.id})`);

            // 지갑 생성 실행
            const accountId = await ensureNearWallet(user.id);

            if (accountId) {
                console.log(`   ✅ Created: ${accountId}`);
                successCount++;
            } else {
                console.error(`   ❌ Failed to create wallet.`);
                failCount++;
            }

            // NEAR RPC 및 노드 부하 방지를 위한 미세한 지연
            if (i % 5 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error(`${progress} Error processing ${user.email}:`, error);
            failCount++;
        }
    }

    console.log("\n--- Migration Result ---");
    console.log(`Total: ${totalCount}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log("------------------------");
}

// 스크립트 실행
migrate().catch(err => {
    console.error("Fatal Migration Error:", err);
    process.exit(1);
});
