import { db } from "../db.server";
import { user as userTable, exchangeLog as exchangeLogTable, exchangeRate as exchangeRateTable } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getNearConnection } from "./client.server";
import { decrypt } from "./key-encryption.server";
import { logger } from "~/lib/logger.server";
import { BigNumber } from "bignumber.js";
import { v4 as uuidv4 } from "uuid";
import * as nearAPI from "near-api-js";

const { utils, KeyPair } = nearAPI;

/**
 * NEAR 입금 감지 및 환전 엔진 (Phase 6.5 MVP)
 * 주기적으로 실행되어 사용자의 NEAR 잔액 변화를 감지하고 CHOCO로 환전합니다.
 */
export async function runDepositMonitoring() {
    logger.info({
        category: "SYSTEM",
        message: "Starting NEAR deposit monitoring"
    });

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
            const currentBalance = (state.amount !== undefined ? state.amount : state.balance?.total).toString(); // BigInt or string
            const lastBalance = user.nearLastBalance || "0";

            // 새로운 입금 감지
            if (new BigNumber(currentBalance).gt(new BigNumber(lastBalance))) {
                const depositAmountYocto = new BigNumber(currentBalance).minus(new BigNumber(lastBalance));

                // 최소 입금 금액 체크 (예: 0.01 NEAR 미만은 무시)
                if (depositAmountYocto.lt(new BigNumber(utils.format.parseNearAmount("0.01")!))) {
                    continue;
                }

                const depositNear = utils.format.formatNearAmount(depositAmountYocto.toFixed(0));
                logger.info({
                    category: "PAYMENT",
                    message: `Detected deposit of ${depositNear} NEAR for user ${user.id}`,
                    metadata: { userId: user.id, nearAccountId: user.nearAccountId, amount: depositNear }
                });

                // 환전 및 스윕 처리
                await processExchangeAndSweep(user, depositNear, depositAmountYocto.toString(), currentBalance);
            }

            // 잔액이 lastBalance보다 낮지만 여전히 회수할 NEAR가 남아있는 경우 (과거 스윕 실패 등)
            // 또는 잔액이 줄어든 경우 동기화
            if (new BigNumber(currentBalance).lt(new BigNumber(lastBalance))) {
                await db.update(userTable).set({
                    nearLastBalance: currentBalance
                }).where(eq(userTable.id, user.id));
            }
        } catch (error) {
            logger.error({
                category: "SYSTEM",
                message: `Error monitoring user ${user.id} for NEAR deposits`,
                stackTrace: (error as Error).stack,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId }
            });
        }
    }

    // 2. 실패한 스윕 재시도 로직 (ExchangeLog 테이블 기준)
    try {
        const failedLogs = await db.select().from(exchangeLogTable).where(
            and(
                eq(exchangeLogTable.fromChain, "NEAR"),
                sql`${exchangeLogTable.status} IN ('FAILED', 'PENDING_SWEEP')`
            )
        );

        if (failedLogs.length > 0) {
            logger.info({
                category: "SYSTEM",
                message: `Found ${failedLogs.length} failed or pending sweeps. Retrying...`
            });

            for (const log of failedLogs) {
                const currentUser = users.find(u => u.id === log.userId);
                if (currentUser && currentUser.nearAccountId) {
                    const account = await near.account(currentUser.nearAccountId);
                    const state = await account.getState() as any;
                    const balance = (state.amount || "0").toString();

                    await executeSweep(currentUser, balance, log.id);
                }
            }
        }
    } catch (retryError) {
        logger.error({
            category: "SYSTEM",
            message: "Error during sweep retry process",
            stackTrace: (retryError as Error).stack
        });
    }
}

async function processExchangeAndSweep(user: any, nearAmount: string, nearAmountYocto: string, currentTotalBalance: string) {
    // 1. 시세 조회 (CoinGecko API 연동 또는 고정비율)
    const { getNearPriceUSD, calculateChocoFromNear } = await import("./exchange-rate.server");

    let rate: number;
    let chocoAmount: BigNumber;

    try {
        // CoinGecko API를 통해 NEAR 가격 조회
        const nearPriceUSD = await getNearPriceUSD();
        // 현재는 고정비율 사용 (향후 USD 기준으로 계산 가능)
        rate = 5000; // MVP: 고정비율
        const chocoAmountStr = await calculateChocoFromNear(nearAmount);
        chocoAmount = new BigNumber(chocoAmountStr);

        logger.info({
            category: "PAYMENT",
            message: `Exchange rate: 1 NEAR = ${rate} CHOCO (NEAR Price: $${nearPriceUSD})`,
            metadata: { nearPriceUSD, rate }
        });
    } catch (error) {
        // API 실패 시 고정비율 사용
        rate = 5000;
        chocoAmount = new BigNumber(nearAmount).multipliedBy(rate);
        logger.warn({
            category: "PAYMENT",
            message: "Failed to fetch exchange rate, using fixed rate",
            stackTrace: (error as Error).stack
        });
    }

    const chocoAmountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    const exchangeId = uuidv4();
    const dummyTxHash = `DEP_${user.id.slice(0, 8)}_${Date.now()}`;

    try {
        // 실제 CHOCO 토큰 전송 (rogulus.testnet -> 유저 계정)
        // 온체인 전송이 성공해야만 DB를 업데이트합니다.
        const { sendChocoToken } = await import("./token.server");
        logger.info({
            category: "PAYMENT",
            message: `Transferring ${chocoAmount.toString()} CHOCO tokens to ${user.nearAccountId} (NEAR deposit)`,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId, chocoAmount: chocoAmount.toString() }
        });

        const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
        const chocoTxHash = (sendResult as any).transaction.hash;

        await db.transaction(async (tx) => {
            // 유저 CHOCO 잔액 업데이트 (Credits는 더 이상 사용하지 않음)
            const newChocoBalance = new BigNumber(user.chocoBalance || "0").plus(chocoAmount);

            await tx.update(userTable).set({
                chocoBalance: newChocoBalance.toString(),
                nearLastBalance: currentTotalBalance,
                updatedAt: new Date(),
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
                txHash: chocoTxHash, // 실제 CHOCO 전송 해시로 저장
                status: "PENDING_SWEEP"
            });
        });

        logger.audit({
            category: "PAYMENT",
            message: `Exchange completed: ${nearAmount} NEAR -> ${chocoAmount} CHOCO`,
            metadata: {
                userId: user.id,
                nearAccountId: user.nearAccountId,
                nearAmount,
                chocoAmount: chocoAmount.toString(),
                rate,
                txHash: chocoTxHash
            }
        });

        // 2. 자산 회수 (Sweep) 실행
        // null도 true로 처리 (기본값이 true이므로 명시적으로 false가 아닌 경우 모두 회수)
        if (user.isSweepEnabled !== false) {
            await executeSweep(user, currentTotalBalance, exchangeId);
        }

    } catch (error) {
        logger.error({
            category: "PAYMENT",
            message: `Exchange failed for user ${user.id}`,
            stackTrace: (error as Error).stack,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId, nearAmount }
        });
    }
}

async function executeSweep(user: any, balanceToSweep: string, exchangeLogId: string) {
    const treasuryAccountId = process.env.NEAR_TREASURY_ACCOUNT_ID ||
        (process.env as any).NEAR_TREASURTY_ACCOUNT_ID ||
        "rogulus.testnet";

    try {
        if (!user.nearPrivateKey) {
            throw new Error("User private key not found");
        }

        const near = await getNearConnection();
        const networkId = process.env.NEAR_NETWORK_ID || "testnet";
        const privateKey = decrypt(user.nearPrivateKey);
        const keyPair = KeyPair.fromString(privateKey as any);

        // Signer의 KeyStore에 키 등록 (networkId 일관성 유지)
        const { signer } = near.connection;
        if ((signer as any).keyStore) {
            await (signer as any).keyStore.setKey(networkId, user.nearAccountId, keyPair);
        }

        const account = await near.account(user.nearAccountId);

        // 중요: 환전(CHOCO 전송) 과정에서 스토리지 예치금 등이 발생했을 수 있으므로 
        // 전송 직전의 실제 잔액을 다시 확인합니다.
        const state = await account.getState() as any;

        // near-api-js 버전에 따라 state.amount(string) 또는 state.balance.available(BigInt) 형태로 반환됩니다.
        let actualAvailableBalance: string;
        if (state.amount) {
            actualAvailableBalance = state.amount.toString();
        } else if (state.balance && state.balance.available) {
            actualAvailableBalance = state.balance.available.toString();
        } else {
            actualAvailableBalance = "0";
        }

        // 가스비와 스토리지 예약분을 고려하여 여유있게 0.02 NEAR를 남기고 회수합니다.
        const safetyMargin = new BigNumber(utils.format.parseNearAmount("0.02")!);
        const sweepAmount = new BigNumber(actualAvailableBalance).minus(safetyMargin);

        if (sweepAmount.lte(0)) {
            logger.info({
                category: "PAYMENT",
                message: `Available balance too low for sweep for ${user.nearAccountId}`,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId, actualBalance: actualAvailableBalance }
            });
            return;
        }

        const sweepAmountRaw = sweepAmount.toFixed(0);
        const sweepAmountFormatted = utils.format.formatNearAmount(sweepAmountRaw);

        logger.info({
            category: "PAYMENT",
            message: `Sweeping ${sweepAmountFormatted} NEAR to treasury (${treasuryAccountId})`,
            metadata: {
                userId: user.id,
                nearAccountId: user.nearAccountId,
                treasuryAccountId,
                amount: sweepAmountFormatted
            }
        });

        const result = await account.sendMoney(treasuryAccountId, sweepAmountRaw as any);

        // 로그 및 상태 업데이트
        await db.update(exchangeLogTable).set({
            sweepTxHash: result.transaction.hash,
            status: "COMPLETED"
        }).where(eq(exchangeLogTable.id, exchangeLogId));

        // 유저의 캐시된 잔액 업데이트 (스윕 후 최종 남은 양)
        const postSweepState = await account.getState() as any;
        await db.update(userTable).set({
            nearLastBalance: (postSweepState.amount || "0").toString()
        }).where(eq(userTable.id, user.id));

        logger.audit({
            category: "PAYMENT",
            message: `Sweep successful: ${sweepAmountFormatted} NEAR transferred to treasury`,
            metadata: {
                userId: user.id,
                nearAccountId: user.nearAccountId,
                treasuryAccountId,
                amount: sweepAmountFormatted,
                txHash: result.transaction.hash
            }
        });

    } catch (error: any) {
        let errorMessage = (error as Error).message || String(error);
        const isKeyMismatch = errorMessage.includes("AccessKeyDoesNotExist") ||
            errorMessage.includes("invalid signature") ||
            errorMessage.includes("public key");

        if (isKeyMismatch) {
            logger.error({
                category: "PAYMENT",
                message: `CRITICAL: NEAR Key Mismatch for ${user.nearAccountId}. Automated sweep impossible.`,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId, error: errorMessage }
            });
        } else {
            logger.error({
                category: "PAYMENT",
                message: `Sweep failed for user ${user.id}`,
                stackTrace: (error as Error).stack,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId, exchangeLogId }
            });
        }

        // 실패 시 로그 상태 업데이트
        await db.update(exchangeLogTable).set({
            status: "FAILED"
        }).where(eq(exchangeLogTable.id, exchangeLogId));
    }
}
