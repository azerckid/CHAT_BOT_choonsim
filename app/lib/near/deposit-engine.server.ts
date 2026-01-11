import { db } from "../db.server";
import { user as userTable, exchangeLog as exchangeLogTable, exchangeRate as exchangeRateTable } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getNearConnection } from "./client.server";
import { decrypt } from "./key-encryption.server";
import { BigNumber } from "bignumber.js";
import { v4 as uuidv4 } from "uuid";
import * as nearAPI from "near-api-js";

const { utils, KeyPair } = nearAPI;

/**
 * NEAR 입금 감지 및 환전 엔진 (Phase 6.5 MVP)
 * 주기적으로 실행되어 사용자의 NEAR 잔액 변화를 감지하고 CHOCO로 환전합니다.
 */
export async function runDepositMonitoring() {
    console.log("[DepositEngine] Starting NEAR deposit monitoring...");

    // 1. NEAR 계정이 연결된 유저들 가져오기
    const users = await db.select().from(userTable).where(
        sql`${userTable.nearAccountId} IS NOT NULL`
    );

    const near = await getNearConnection();

    for (const user of users) {
        try {
            if (!user.nearAccountId) continue;

            const account = await near.account(user.nearAccountId);
            const state = await account.getState() as any;
            const currentBalance = state.amount; // yoctoNEAR
            const lastBalance = user.nearLastBalance || "0";

            if (new BigNumber(currentBalance).gt(new BigNumber(lastBalance))) {
                const depositAmountYocto = new BigNumber(currentBalance).minus(new BigNumber(lastBalance));

                // 최소 입금 금액 체크 (예: 0.01 NEAR 미만은 무시)
                if (depositAmountYocto.lt(new BigNumber(utils.format.parseNearAmount("0.01")!))) {
                    continue;
                }

                const depositNear = utils.format.formatNearAmount(depositAmountYocto.toString());
                console.log(`[DepositEngine] Detected deposit of ${depositNear} NEAR for user ${user.id} (${user.nearAccountId})`);

                // 2. 환전 및 스윕 처리
                await processExchangeAndSweep(user, depositNear, depositAmountYocto.toString(), currentBalance);
            } else if (new BigNumber(currentBalance).lt(new BigNumber(lastBalance))) {
                // 잔액이 줄어든 경우 (외부에서 출금했거나 우리가 스윕한 경우)
                // 단순히 마지막 잔액 동기화
                await db.update(userTable).set({
                    nearLastBalance: currentBalance
                }).where(eq(userTable.id, user.id));
            }
        } catch (error) {
            console.error(`[DepositEngine] Error monitoring user ${user.id}:`, error);
        }
    }
}

async function processExchangeAndSweep(user: any, nearAmount: string, nearAmountYocto: string, currentTotalBalance: string) {
    // 1. 시세 조회 (실제로는 API 연동, 여기서는 고정비율 1 NEAR = 5000 CHOCO)
    const rate = 5000;
    const chocoAmount = new BigNumber(nearAmount).multipliedBy(rate);

    const exchangeId = uuidv4();
    const dummyTxHash = `DEP_${user.id.slice(0, 8)}_${Date.now()}`;

    try {
        await db.transaction(async (tx) => {
            // 유저 초코 잔액 업데이트
            const newChocoBalance = new BigNumber(user.chocoBalance).plus(chocoAmount);

            await tx.update(userTable).set({
                chocoBalance: newChocoBalance.toString(),
                nearLastBalance: currentTotalBalance // 일단 현재 잔액으로 업데이트
            }).where(eq(userTable.id, user.id));

            // 로그 기록
            await tx.insert(exchangeLogTable).values({
                id: exchangeId,
                userId: user.id,
                fromChain: "NEAR",
                fromAmount: nearAmount,
                toToken: "CHOCO",
                toAmount: chocoAmount.toString(),
                rate: rate,
                txHash: dummyTxHash,
                status: "PENDING_SWEEP"
            });
        });

        console.log(`[DepositEngine] Exchange completed: ${nearAmount} NEAR -> ${chocoAmount} CHOCO for user ${user.id}`);

        // 2. 자산 회수 (Sweep) 실행
        if (user.isSweepEnabled) {
            await executeSweep(user, currentTotalBalance, exchangeId);
        }

    } catch (error) {
        console.error(`[DepositEngine] Exchange failed for user ${user.id}:`, error);
    }
}

async function executeSweep(user: any, balanceToSweep: string, exchangeLogId: string) {
    const treasuryAccountId = process.env.NEAR_TREASURY_ACCOUNT_ID || "rogulus.testnet";

    try {
        if (!user.nearPrivateKey) {
            throw new Error("User private key not found");
        }

        const near = await getNearConnection();
        const privateKey = decrypt(user.nearPrivateKey);
        const keyPair = KeyPair.fromString(privateKey as any);

        // 유저 계정으로 연결된 KeyStore 설정 없이 수동 서명 방식 사용
        near.connection.signer.keyStore.setKey("testnet", user.nearAccountId, keyPair);

        const account = await near.account(user.nearAccountId);

        // 가스비를 제외한 전체 잔액 전송 (약 0.01 NEAR 남김)
        const safetyMargin = new BigNumber(utils.format.parseNearAmount("0.01")!);
        const sweepAmount = new BigNumber(balanceToSweep).minus(safetyMargin);

        if (sweepAmount.lte(0)) {
            console.log(`[DepositEngine] Balance too low for sweep for ${user.nearAccountId}`);
            return;
        }

        console.log(`[DepositEngine] Sweeping ${utils.format.formatNearAmount(sweepAmount.toString())} NEAR to treasury (${treasuryAccountId})...`);

        const result = await account.sendMoney(treasuryAccountId, BigInt(sweepAmount.toFixed(0)));

        // 로그 업데이트
        await db.update(exchangeLogTable).set({
            sweepTxHash: result.transaction.hash,
            status: "COMPLETED"
        }).where(eq(exchangeLogTable.id, exchangeLogId));

        // 유저의 캐시된 잔액 업데이트 (스윕 후 남은 양)
        const finalState = await account.getState() as any;
        await db.update(userTable).set({
            nearLastBalance: finalState.amount
        }).where(eq(userTable.id, user.id));

        console.log(`[DepositEngine] Sweep successful: ${result.transaction.hash}`);

    } catch (error) {
        console.error(`[DepositEngine] Sweep failed for user ${user.id}:`, error);
        await db.update(exchangeLogTable).set({
            status: "FAILED"
        }).where(eq(exchangeLogTable.id, exchangeLogId));
    }
}
