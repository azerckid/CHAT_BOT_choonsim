import { db } from "../db.server";
import * as schema from "../../db/schema";
import { sum, sql } from "drizzle-orm";
import { getNearConnection, NEAR_CONFIG } from "../near/client.server";
import { BigNumber } from "bignumber.js";

export async function getServiceWalletStats() {
    try {
        const near = await getNearConnection();
        const account = await near.account(NEAR_CONFIG.serviceAccountId);

        // 1. NEAR 잔액 조회
        const nearBalance = await account.getAccountBalance();
        const nearBalanceFormatted = new BigNumber(nearBalance.available)
            .dividedBy(new BigNumber(10).pow(24))
            .toFixed(2);

        // 2. CHOCO 잔액 조회 (ft_balance_of)
        const chocoBalanceRaw = await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_balance_of",
            args: { account_id: NEAR_CONFIG.serviceAccountId },
        });

        // 3. 전체 발행량 조회 (ft_total_supply)
        const totalSupplyRaw = await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_total_supply",
            args: {},
        });

        const chocoBalanceFormatted = new BigNumber(chocoBalanceRaw)
            .dividedBy(new BigNumber(10).pow(18))
            .toFormat(0);

        const totalSupplyFormatted = new BigNumber(totalSupplyRaw)
            .dividedBy(new BigNumber(10).pow(18))
            .toFormat(0);

        return {
            nearBalance: nearBalanceFormatted,
            chocoBalance: chocoBalanceFormatted,
            chocoBalanceRaw: chocoBalanceRaw,
            totalSupply: totalSupplyFormatted,
            totalSupplyRaw: totalSupplyRaw,
            address: NEAR_CONFIG.serviceAccountId,
        };
    } catch (error) {
        console.error("Failed to fetch service wallet stats:", error);
        return {
            nearBalance: "0",
            chocoBalance: "0",
            address: NEAR_CONFIG.serviceAccountId,
            error: "Failed to connect to NEAR"
        };
    }
}

export async function getEconomyStats() {
    // 1. 사용자 총 보유량 (DB chocoBalance 합계)
    // SQLite에서 text 필드를 숫자로 더하기 위해 CAST 사용
    const userBalanceRes = await db.select({
        total: sql<string>`sum(cast(chocoBalance as decimal))`
    }).from(schema.user);

    const totalUserBalance = new BigNumber(userBalanceRes[0]?.total || "0").toFormat(0);

    // 2. 누적 판매 내역 (TOPUP 결제 성공 건 합계)
    // Payment.amount는 real(USD)이므로, CHOCO 환산이 필요할 수 있으나 
    // 여기서는 Payment.description이나 metadata 혹은 creditsGranted(deprecated이나 현재 사용 중)를 참고
    const topupRes = await db.select({
        total: sum(schema.payment.creditsGranted)
    }).from(schema.payment).where(sql`type = 'TOPUP' AND status = 'COMPLETED'`);

    // 3. 누적 지급 내역 (ADMIN_MEMBERSHIP_GRANT 합계)
    const grantRes = await db.select({
        total: sum(schema.payment.creditsGranted)
    }).from(schema.payment).where(sql`type = 'ADMIN_MEMBERSHIP_GRANT' AND status = 'COMPLETED'`);

    // 4. 온체인 실전송량 (TokenTransfer 합계)
    const transferRes = await db.select({
        total: sql<string>`sum(cast(amount as decimal))`
    }).from(schema.tokenTransfer).where(sql`status = 'COMPLETED'`);

    const totalOnChainTransferred = new BigNumber(transferRes[0]?.total || "0")
        .dividedBy(new BigNumber(10).pow(18))
        .toFormat(0);

    // 5. 지갑 보유 유저 vs 미보유 유저 잔액 분리 (중복 계산 방지용)
    const walletUserBalanceRes = await db.select({
        total: sql<string>`sum(cast(chocoBalance as decimal))`
    }).from(schema.user).where(sql`nearAccountId IS NOT NULL`);

    const pendingUserBalanceRes = await db.select({
        total: sql<string>`sum(cast(chocoBalance as decimal))`
    }).from(schema.user).where(sql`nearAccountId IS NULL`);

    const walletUserBalanceRaw = walletUserBalanceRes[0]?.total || "0";
    const pendingUserBalanceRaw = pendingUserBalanceRes[0]?.total || "0";

    return {
        totalUserChoco: totalUserBalance,
        totalUserChocoRaw: userBalanceRes[0]?.total || "0",
        walletUserChocoRaw: walletUserBalanceRaw,
        pendingUserChocoRaw: pendingUserBalanceRaw,
        totalPurchasedChoco: (topupRes[0]?.total || 0).toLocaleString(),
        totalGrantedChoco: (grantRes[0]?.total || 0).toLocaleString(),
        totalOnChainTransferred: totalOnChainTransferred,
    };
}
