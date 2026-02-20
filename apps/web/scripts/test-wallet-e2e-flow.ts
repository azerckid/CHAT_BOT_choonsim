/**
 * NEAR 지갑 E2E 플로우 테스트
 *
 * 실행: npx tsx scripts/test-wallet-e2e-flow.ts [userId]
 *
 * 테스트 단계:
 * 1. 지갑 생성 확인 (또는 생성)
 * 2. 온체인 상태 확인 (NEAR, CHOCO 잔액)
 * 3. deposit-engine 실행 및 CHOCO 전환 확인 (NEAR 입금 후)
 * 4. CHOCO 소비 이력 확인 (대화, 아이템 구매)
 */

import { db } from "../app/lib/db.server";
import * as schema from "../app/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureNearWallet } from "../app/lib/near/wallet.server";
import { getChocoBalance } from "../app/lib/near/token.server";
import { runDepositMonitoring } from "../app/lib/near/deposit-engine.server";
import { getNearConnection, NEAR_CONFIG } from "../app/lib/near/client.server";
import { BigNumber } from "bignumber.js";
import * as nearAPI from "near-api-js";

const { utils } = nearAPI;

interface TestResult {
    step: string;
    success: boolean;
    message: string;
    data?: any;
}

const results: TestResult[] = [];

function logResult(step: string, success: boolean, message: string, data?: any) {
    results.push({ step, success, message, data });
    const icon = success ? "✅" : "❌";
    console.log(`${icon} [${step}] ${message}`);
    if (data && !success) {
        console.log(`   데이터:`, data);
    }
}

async function testWalletE2EFlow(userId: string) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`NEAR 지갑 E2E 테스트 시작`);
    console.log(`User ID: ${userId}`);
    console.log(`${"=".repeat(60)}\n`);

    // 1. 유저 조회
    console.log("[1/6] 유저 정보 조회...");
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            id: true,
            email: true,
            nearAccountId: true,
            nearPublicKey: true,
            nearPrivateKey: true,
            chocoBalance: true,
            walletStatus: true,
            nearLastBalance: true,
        }
    });

    if (!user) {
        logResult("1. 유저 조회", false, `유저를 찾을 수 없습니다: ${userId}`);
        printSummary();
        return;
    }
    logResult("1. 유저 조회", true, `유저 발견: ${user.email}`);

    // 2. 지갑 생성 확인
    console.log("\n[2/6] 지갑 생성 확인...");
    let nearAccountId = user.nearAccountId;
    
    if (!nearAccountId) {
        console.log("  → 지갑이 없습니다. 생성 중...");
        try {
            nearAccountId = await ensureNearWallet(userId);
            if (!nearAccountId) {
                logResult("2. 지갑 생성", false, "지갑 생성 실패 (null 반환)");
                printSummary();
                return;
            }
            logResult("2. 지갑 생성", true, `지갑 생성 완료: ${nearAccountId}`);
        } catch (error) {
            logResult("2. 지갑 생성", false, `지갑 생성 실패: ${error instanceof Error ? error.message : String(error)}`);
            printSummary();
            return;
        }
    } else {
        logResult("2. 지갑 생성", true, `기존 지갑: ${nearAccountId}`);
    }

    // 3. 온체인 NEAR 잔액 확인
    console.log("\n[3/6] 온체인 NEAR 잔액 확인...");
    try {
        const near = await getNearConnection();
        const account = await near.account(nearAccountId!);
        const state = await account.getState() as any;
        const nearBalanceYocto = (state.amount !== undefined ? state.amount : state.balance?.total).toString();
        const nearBalance = utils.format.formatNearAmount(nearBalanceYocto);
        
        logResult("3. NEAR 잔액", true, `${nearBalance} NEAR`, { balance: nearBalance });
        
        if (parseFloat(nearBalance) < 0.01) {
            console.log("  ⚠️  NEAR 잔액이 0.01 미만입니다. 입금 테스트를 위해 최소 0.01 NEAR를 입금하세요.");
            console.log(`     계정: ${nearAccountId}`);
            console.log(`     테스트넷 faucet: https://testnet.mynearwallet.com/`);
        }
    } catch (error) {
        logResult("3. NEAR 잔액", false, `온체인 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. 온체인 CHOCO 잔액 확인
    console.log("\n[4/6] 온체인 CHOCO 잔액 확인...");
    try {
        const onChainBalanceRaw = await getChocoBalance(nearAccountId!);
        const balanceBN = new BigNumber(onChainBalanceRaw).dividedBy(new BigNumber(10).pow(18));
        const dbBalance = new BigNumber(user.chocoBalance || "0");
        
        logResult("4. CHOCO 잔액", true, `온체인: ${balanceBN.toString()} CHOCO, DB: ${dbBalance.toString()} CHOCO`, {
            onChain: balanceBN.toString(),
            db: dbBalance.toString(),
        });

        if (!balanceBN.eq(dbBalance)) {
            console.log("  ⚠️  온체인과 DB 잔액이 일치하지 않습니다. 동기화가 필요할 수 있습니다.");
        }

        if (balanceBN.gt(0)) {
            console.log("  ✅ CHOCO 잔액 확인됨");
        } else {
            console.log("  ⚠️  CHOCO 잔액이 0입니다. 가입 축하금이 전송되었는지 확인하세요.");
        }
    } catch (error) {
        logResult("4. CHOCO 잔액", false, `온체인 조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 5. deposit-engine 실행 (CHOCO 전환 확인)
    console.log("\n[5/6] deposit-engine 실행 (CHOCO 전환 확인)...");
    try {
        const beforeBalance = new BigNumber(user.chocoBalance || "0");
        
        await runDepositMonitoring();
        
        // 업데이트된 잔액 확인
        const updatedUser = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { chocoBalance: true, nearLastBalance: true }
        });
        
        const afterBalance = new BigNumber(updatedUser?.chocoBalance || "0");
        const balanceIncrease = afterBalance.minus(beforeBalance);
        
        logResult("5. deposit-engine", true, `실행 완료. CHOCO 변화: ${balanceIncrease.toString()} CHOCO`, {
            before: beforeBalance.toString(),
            after: afterBalance.toString(),
            increase: balanceIncrease.toString(),
        });

        // ExchangeLog 확인
        const exchangeLogs = await db.query.exchangeLog.findMany({
            where: eq(schema.exchangeLog.userId, userId),
            orderBy: [desc(schema.exchangeLog.createdAt)],
            limit: 3,
        });

        if (exchangeLogs.length > 0) {
            console.log("\n  → 최근 환전 이력:");
            exchangeLogs.forEach((log, idx) => {
                console.log(`     ${idx + 1}. ${log.fromAmount} NEAR → ${log.toAmount} CHOCO (비율: ${log.rate}, 상태: ${log.status})`);
            });
        } else {
            console.log("  → 환전 이력이 없습니다. NEAR 입금 후 다시 실행하세요.");
        }
    } catch (error) {
        logResult("5. deposit-engine", false, `실행 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 6. CHOCO 소비 이력 확인
    console.log("\n[6/6] CHOCO 소비 이력 확인...");
    try {
        const transfers = await db.query.tokenTransfer.findMany({
            where: eq(schema.tokenTransfer.userId, userId),
            orderBy: [desc(schema.tokenTransfer.createdAt)],
            limit: 10,
        });

        if (transfers.length > 0) {
            console.log("  → 최근 TokenTransfer 이력:");
            transfers.forEach((t, idx) => {
                const amountBN = new BigNumber(t.amount).dividedBy(new BigNumber(10).pow(18));
                const date = new Date(t.createdAt).toLocaleString("ko-KR");
                console.log(`     ${idx + 1}. [${t.purpose}] ${amountBN.toString()} CHOCO (${t.status}) - ${date}`);
            });
            
            // 목적별 통계
            const purposeStats = transfers.reduce((acc, t) => {
                const purpose = t.purpose || "UNKNOWN";
                acc[purpose] = (acc[purpose] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            console.log("\n  → 목적별 통계:");
            Object.entries(purposeStats).forEach(([purpose, count]) => {
                console.log(`     ${purpose}: ${count}건`);
            });

            logResult("6. CHOCO 소비 이력", true, `${transfers.length}건의 이력 확인됨`, { count: transfers.length });
        } else {
            console.log("  → CHOCO 소비 이력이 없습니다.");
            console.log("     대화나 아이템 구매를 통해 CHOCO를 소비하면 이력이 기록됩니다.");
            logResult("6. CHOCO 소비 이력", true, "이력 없음 (정상)", { count: 0 });
        }
    } catch (error) {
        logResult("6. CHOCO 소비 이력", false, `조회 실패: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 요약 출력
    printSummary();
}

function printSummary() {
    console.log(`\n${"=".repeat(60)}`);
    console.log("테스트 요약");
    console.log(`${"=".repeat(60)}`);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    results.forEach((r, idx) => {
        const icon = r.success ? "✅" : "❌";
        console.log(`${idx + 1}. ${icon} ${r.step}: ${r.message}`);
    });
    
    console.log(`\n성공: ${successCount}건, 실패: ${failCount}건`);
    
    if (failCount > 0) {
        console.log("\n⚠️  일부 테스트가 실패했습니다. 위의 오류 메시지를 확인하세요.");
    } else {
        console.log("\n✅ 모든 테스트가 성공했습니다!");
    }
    
    console.log(`${"=".repeat(60)}\n`);
}

// 실행
const userId = process.argv[2];
if (!userId) {
    console.error("Usage: npx tsx scripts/test-wallet-e2e-flow.ts <userId>");
    console.error("\n예시:");
    console.error("  npx tsx scripts/test-wallet-e2e-flow.ts user_abc123def456");
    console.error("\n⚠️  중요: <userId>는 DB에 실제로 존재하는 유저 ID여야 합니다.");
    console.error("\n유저 ID 확인 방법:");
    console.error("  1. Drizzle Studio: npx drizzle-kit studio");
    console.error("     → User 테이블에서 id 컬럼 확인");
    console.error("  2. SQL 직접 조회: SELECT id, email FROM User LIMIT 10;");
    console.error("  3. 테스트용 유저 생성: 실제 회원가입 후 해당 유저의 id 사용");
    console.error("\n주의: 임의로 만든 ID(예: test-user-123)는 사용할 수 없습니다.");
    console.error("      스크립트가 DB에서 유저를 조회하므로 실제 유저 ID가 필요합니다.");
    process.exit(1);
}

testWalletE2EFlow(userId).catch((error) => {
    console.error("\n❌ 테스트 실행 중 오류 발생:");
    console.error(error);
    process.exit(1);
});
