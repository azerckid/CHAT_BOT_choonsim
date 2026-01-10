import { utils } from "near-api-js";
import { NEAR_CONFIG, getNearConnection } from "./client.server";

/**
 * 서비스 계정의 잔액을 모니터링하기 위한 유틸리티
 */

export async function checkServiceAccountBalance() {
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const near = await getNearConnection();
    const account = await near.account(serviceAccountId);

    // getAccountBalance 대신 getState 사용 (권장 방식)
    const state = await account.getState() as any;
    const balanceAmount = state.amount;

    const availableNear = parseFloat(utils.format.formatNearAmount(balanceAmount));

    return {
        total: availableNear.toFixed(4),
        available: availableNear.toFixed(4),
        isRunningLow: availableNear < 1.0, // 1 NEAR 미만이면 경고
    };
}
