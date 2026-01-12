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
            logger.error({
                category: "SYSTEM",
                message: `Error monitoring user ${user.id} for NEAR deposits`,
                stackTrace: (error as Error).stack,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId }
            });
        }
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
        if (user.isSweepEnabled) {
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
            logger.info({
                category: "PAYMENT",
                message: `Balance too low for sweep for ${user.nearAccountId}`,
                metadata: { userId: user.id, nearAccountId: user.nearAccountId }
            });
            return;
        }

        const sweepAmountRaw = sweepAmount.toFixed(0);
        const sweepAmountFormatted = utils.format.formatNearAmount(sweepAmountRaw);
        logger.info({
            category: "PAYMENT",
            message: `Sweeping ${sweepAmountFormatted} NEAR to treasury`,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId, treasuryAccountId, amount: sweepAmountFormatted }
        });

        const result = await account.sendMoney(treasuryAccountId, sweepAmountRaw as any);

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

    } catch (error) {
        logger.error({
            category: "PAYMENT",
            message: `Sweep failed for user ${user.id}`,
            stackTrace: (error as Error).stack,
            metadata: { userId: user.id, nearAccountId: user.nearAccountId, exchangeLogId }
        });
        await db.update(exchangeLogTable).set({
            status: "FAILED"
        }).where(eq(exchangeLogTable.id, exchangeLogId));
    }
}
