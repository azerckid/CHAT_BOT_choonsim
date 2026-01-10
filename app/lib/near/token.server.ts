import { getNearConnection, NEAR_CONFIG } from "./client.server";
import { BigNumber } from "bignumber.js";

/**
 * 특정 계정의 CHOCO 토큰 잔액을 조회합니다.
 * @param accountId NEAR 계정 ID
 * @returns CHOCO 잔액 (인간이 읽을 수 있는 단위, decimals 18 적용)
 */
export async function getChocoBalance(accountId: string): Promise<string> {
    const near = await getNearConnection();
    const account = await near.account(NEAR_CONFIG.chocoTokenContract);

    try {
        const balanceRaw: string = await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_balance_of",
            args: { account_id: accountId },
        });

        // 18 decimals 변환
        const balance = new BigNumber(balanceRaw).dividedBy(new BigNumber(10).pow(18));
        return balance.toString();
    } catch (error) {
        console.error(`Failed to fetch CHOCO balance for ${accountId}:`, error);
        return "0";
    }
}

/**
 * CHOCO 토큰의 메타데이터를 조회합니다.
 */
export async function getChocoMetadata() {
    const near = await getNearConnection();
    const account = await near.account(NEAR_CONFIG.chocoTokenContract);

    try {
        return await account.viewFunction({
            contractId: NEAR_CONFIG.chocoTokenContract,
            methodName: "ft_metadata",
            args: {},
        });
    } catch (error) {
        console.error("Failed to fetch CHOCO metadata:", error);
        return null;
    }
}
