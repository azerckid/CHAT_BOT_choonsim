import { connect, keyStores, KeyPair, transactions } from "near-api-js";
import { db } from "../db.server";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";
import { ensureStorageDeposit } from "./storage-deposit.server";
import { NEAR_CONFIG } from "./client.server";

/**
 * 사용자의 임베디드 NEAR 지갑을 확인하고 없으면 새로 생성합니다.
 * @param userId 시스템 내부 사용자 ID
 */
export async function ensureNearWallet(userId: string) {
    // 1. 기존 지갑 확인 (Credits도 함께 조회)
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            id: true,
            email: true,
            nearAccountId: true,
            nearPublicKey: true,
            nearPrivateKey: true,
            credits: true,
            chocoBalance: true
        }
    });

    if (!user) return null;

    // 지갑이 이미 생성되어 있는지 확인 (플래그)
    let isWalletExist = false;
    let newAccountId: string | null = user.nearAccountId;

    if (user.nearAccountId && user.nearPublicKey && user.nearPrivateKey) {
        console.log(`[Wallet] Existing wallet found for user: ${userId} (${user.nearAccountId})`);
        isWalletExist = true;
    }

    // 지갑 ID는 있는데 키 정보가 없는 경우 (치명적 불일치 상태)
    if (user.nearAccountId && (!user.nearPublicKey || !user.nearPrivateKey)) {
        console.error(`[CRITICAL] Wallet ${user.nearAccountId} for user ${userId} is missing private key or public key!`);
    }

    if (!isWalletExist) {
        console.log(`[Wallet] Creation required for user: ${userId}`);

        const networkId = NEAR_CONFIG.networkId;
        const nodeUrl = NEAR_CONFIG.nodeUrl;
        const serviceAccountId = NEAR_CONFIG.serviceAccountId;
        let publicKey: string | null = null;

        try {
            const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
            if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");

            // 2. 새 키 페어 생성
            const keyPair = KeyPair.fromRandom("ed25519");
            publicKey = keyPair.getPublicKey().toString();
            const privateKey = keyPair.toString();

            // 3. NEAR 계정 아이디 결정
            const sanitizedId = userId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
            newAccountId = `${sanitizedId}.${serviceAccountId}`;

            // 4. 온체인 계정 생성
            const keyStore = new keyStores.InMemoryKeyStore();
            await keyStore.setKey(networkId, serviceAccountId, KeyPair.fromString(servicePrivateKey as any));
            const near = await connect({ networkId, nodeUrl, keyStore });
            const serviceAccount = await near.account(serviceAccountId);

            const publicKeyObj = keyPair.getPublicKey();
            const initialBalance = BigInt("100000000000000000000000"); // 0.1 NEAR

            try {
                if (typeof (serviceAccount as any).createAccount === "function") {
                    await (serviceAccount as any).createAccount(newAccountId, publicKeyObj.toString(), initialBalance.toString());
                } else {
                    await serviceAccount.functionCall({
                        contractId: serviceAccountId,
                        methodName: "create_account",
                        args: { new_account_id: newAccountId, new_public_key: publicKeyObj.toString() },
                        gas: BigInt("30000000000000"),
                        attachedDeposit: initialBalance,
                    });
                }
            } catch (createError: any) {
                const isAccountExists = createError.type === 'AccountAlreadyExists' ||
                    createError.message?.includes("already exists") ||
                    createError.message?.includes("AccountAlreadyExists");

                if (isAccountExists) {
                    console.log(`[Wallet] Account ${newAccountId} already exists on-chain.`);
                    if (user.nearAccountId === newAccountId) {
                        console.log(`[Wallet] User already has this account ID linked.`);
                    } else {
                        throw new Error(`Account ${newAccountId} already exists. Cannot safely link without verified private key.`);
                    }
                } else {
                    throw createError;
                }
            }

            // 5. CHOCO 토큰 스토리지 예치
            await ensureStorageDeposit(newAccountId);

            // 6. 개인키 암호화 및 DB 저장
            const { encrypt } = await import("./key-encryption.server");
            const encryptedPrivateKey = encrypt(privateKey);

            await db.update(schema.user)
                .set({
                    nearAccountId: newAccountId,
                    nearPublicKey: publicKey,
                    nearPrivateKey: encryptedPrivateKey,
                    chocoBalance: "0",
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));

            console.log(`[Wallet] Successfully created wallet: ${newAccountId}`);
        } catch (error: any) {
            console.error(`[Wallet] Failed to create wallet for ${userId}:`, error);
            return null;
        }
    }

    // 8. 보상 지급 및 잔액 동기화 (기존 지갑 사용자 및 신규 사용자 공통)
    if (newAccountId) {
        try {
            const { BigNumber } = await import("bignumber.js");
            const { sendChocoToken, getChocoBalance } = await import("./token.server");
            const { nanoid } = await import("nanoid");

            // [Idempotency Guard] 이미 보상이 지급되었는지 확인
            const existingReward = await db.query.tokenTransfer.findFirst({
                where: (table, { and, eq }) => and(
                    eq(table.userId, userId),
                    eq(table.purpose, "SIGNUP_REWARD"),
                    eq(table.status, "COMPLETED")
                )
            });

            if (!existingReward) {
                const signupReward = 100;
                const chocoAmountRaw = new BigNumber(signupReward).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

                console.log(`[Wallet] Rewarding user ${userId} with ${signupReward} CHOCO...`);
                try {
                    const sendResult = await sendChocoToken(newAccountId, chocoAmountRaw);
                    const chocoTxHash = (sendResult as any).transaction.hash;

                    if (chocoTxHash) {
                        await db.transaction(async (tx) => {
                            await tx.insert(schema.tokenTransfer).values({
                                id: nanoid(),
                                userId,
                                txHash: chocoTxHash,
                                amount: chocoAmountRaw,
                                tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                                status: "COMPLETED",
                                purpose: "SIGNUP_REWARD",
                                createdAt: new Date(),
                            });
                        });
                    }
                } catch (sendError) {
                    console.error(`[Wallet] Failed to send signup reward:`, sendError);
                }
            }

            // 9. 실시간 온체인 잔액 강제 동기화 (252 -> 100 교정 핵심)
            const onChainBalanceRaw = await getChocoBalance(newAccountId);
            const onChainBalanceBN = new BigNumber(onChainBalanceRaw).dividedBy(new BigNumber(10).pow(18));

            await db.update(schema.user)
                .set({
                    chocoBalance: onChainBalanceBN.toString(),
                    credits: 0,
                    chocoLastSyncAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));

            console.log(`[Wallet] Synced ${newAccountId} balance: ${onChainBalanceBN.toString()} CHOCO`);
        } catch (error) {
            console.error(`[Wallet] Post-process (reward/sync) failed:`, error);
        }
    }

    return newAccountId;
}

/**
 * 기존 계정의 키 페어를 재생성합니다.
 * 계정 ID는 유지하고 새 키 페어만 생성하여 저장합니다.
 * @param userId 사용자 ID
 * @returns 새로 생성한 공개키와 프라이빗 키
 */
export async function regenerateWalletKeys(userId: string): Promise<{
    publicKey: string;
    privateKey: string;
    nearAccountId: string;
} | null> {
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { id: true, nearAccountId: true }
    });

    if (!user || !user.nearAccountId) {
        console.error(`[Regenerate Keys] User ${userId} has no NEAR account`);
        return null;
    }

    try {
        const keyPair = KeyPair.fromRandom("ed25519");
        const publicKey = keyPair.getPublicKey().toString();
        const privateKey = keyPair.toString();

        const { encrypt } = await import("./key-encryption.server");
        const encryptedPrivateKey = encrypt(privateKey);

        await db.update(schema.user)
            .set({
                nearPublicKey: publicKey,
                nearPrivateKey: encryptedPrivateKey,
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));

        return {
            publicKey,
            privateKey,
            nearAccountId: user.nearAccountId,
        };
    } catch (error: any) {
        console.error(`[Regenerate Keys] Failed to regenerate keys:`, error);
        return null;
    }
}

/**
 * 사용자의 Better Auth 세션 ID와 NEAR 계정 주소를 연결합니다. (외부 지갑 연결용)
 */
export async function linkNearWallet(
    userId: string,
    nearAccountId: string,
    publicKey?: string
) {
    try {
        await ensureStorageDeposit(nearAccountId);
    } catch (e) {
        console.error("Failed to ensure storage deposit during linking:", e);
    }

    await db.update(schema.user)
        .set({
            nearAccountId,
            nearPublicKey: publicKey || null,
            updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));
}

/**
 * 사용자의 계정 정보와 연결된 NEAR 지갑 정보를 조회합니다.
 */
export async function getUserNearWallet(userId: string) {
    return await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            nearAccountId: true,
            nearPublicKey: true,
            chocoBalance: true,
            heartsCount: true,
            allowanceAmount: true,
            allowanceExpiresAt: true,
        },
    });
}
