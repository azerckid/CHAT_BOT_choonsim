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
        console.log(`[Wallet] Creation phase started for user: ${userId}`);

        const serviceAccountId = NEAR_CONFIG.serviceAccountId;
        const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
        if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing from environment");

        // 3. NEAR 계정 아이디 및 키 페어 생성 (DB에 먼저 안전하게 보관)
        // [FIX] 기존 userId 기반 생성은 DB 리셋 후 계정 재사용(잔액 찌꺼기) 문제를 일으킴.
        // 항상 새로운 지갑을 생성하도록 무작위 난수 사용.
        const { nanoid } = await import("nanoid");
        const uniqueSuffix = nanoid(10).toLowerCase().replace(/[^a-z0-9]/g, ""); // 소문자+숫자만
        const derivedAccountId = `${uniqueSuffix}.${serviceAccountId}`;

        // 만약 DB에 이미 ID가 적혀있다면 그 ID를 재사용 (과거 실패 복구용)
        newAccountId = user.nearAccountId || derivedAccountId;

        let publicKey = user.nearPublicKey;
        let encryptedPrivateKey = user.nearPrivateKey;

        if (!publicKey || !encryptedPrivateKey) {
            const keyPair = KeyPair.fromRandom("ed25519");
            publicKey = keyPair.getPublicKey().toString();
            const privateKey = keyPair.toString();
            const { encrypt } = await import("./key-encryption.server");
            encryptedPrivateKey = encrypt(privateKey);

            // [CRITICAL] 온체인 호출 전 DB에 키 정보 먼저 저장 (Vercel 타임아웃 대비)
            await db.update(schema.user)
                .set({
                    nearAccountId: newAccountId,
                    nearPublicKey: publicKey,
                    nearPrivateKey: encryptedPrivateKey,
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));
            console.log(`[Wallet] Keys saved to DB for ${userId}. Proceeding to on-chain creation.`);
        }

        // 4. 온체인 계정 생성 시도
        try {
            const networkId = NEAR_CONFIG.networkId;
            const nodeUrl = NEAR_CONFIG.nodeUrl;
            const keyStore = new keyStores.InMemoryKeyStore();
            await keyStore.setKey(networkId, serviceAccountId, KeyPair.fromString(servicePrivateKey as any));
            const near = await connect({ networkId, nodeUrl, keyStore });
            const serviceAccount = await near.account(serviceAccountId);

            const initialBalance = BigInt("100000000000000000000000"); // 0.1 NEAR

            console.log(`[Wallet] Attempting on-chain createAccount: ${newAccountId}`);
            await (serviceAccount as any).createAccount(newAccountId, publicKey as any, initialBalance.toString());
            console.log(`[Wallet] On-chain account created: ${newAccountId}`);
        } catch (createError: any) {
            const isAccountExists = createError.type === 'AccountAlreadyExists' ||
                createError.message?.includes("already exists") ||
                createError.message?.includes("AccountAlreadyExists");

            if (isAccountExists) {
                console.log(`[Wallet] Account ${newAccountId} already exists on-chain. Resuming flow.`);
                // DB에 이미 저장되어 있으므로 안전하게 로직 지속
            } else {
                console.error(`[Wallet] On-chain error during creation:`, createError);
                throw createError; // 타임아웃 외의 다른 에러는 상위로 전파
            }
        }

        // 5. FT 스토리지 예치 (토큰 수령을 위해 필수)
        try {
            await ensureStorageDeposit(newAccountId);
        } catch (storageError) {
            console.warn(`[Wallet] Storage deposit warning (might already exist):`, storageError);
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
 * [비동기 방식] DB에 키 정보만 저장하고 즉시 반환합니다.
 * 온체인 계정 생성·CHOCO 전송은 백그라운드 큐에서 처리됩니다.
 * @param userId 시스템 내부 사용자 ID
 * @returns nearAccountId 또는 null
 */
export async function ensureNearWalletAsync(userId: string): Promise<string | null> {
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: {
            id: true,
            nearAccountId: true,
            nearPublicKey: true,
            nearPrivateKey: true,
            walletStatus: true,
        }
    });

    if (!user) return null;

    // 이미 READY 상태면 즉시 반환
    if (user.nearAccountId && user.walletStatus === "READY") {
        return user.nearAccountId;
    }

    // 이미 PENDING/CREATING 상태면 기존 accountId 반환 (큐에서 처리 중)
    if (user.nearAccountId && (user.walletStatus === "PENDING" || user.walletStatus === "CREATING")) {
        return user.nearAccountId;
    }

    // FAILED 상태면 재시도를 위해 PENDING으로 리셋
    if (user.nearAccountId && user.walletStatus === "FAILED") {
        await db.update(schema.user)
            .set({
                walletStatus: "PENDING",
                walletError: null,
                walletCreatedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));
        return user.nearAccountId;
    }

    // 신규: 키 페어 생성 + DB 저장 (PENDING 상태)
    const { nanoid } = await import("nanoid");
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const uniqueSuffix = nanoid(10).toLowerCase().replace(/[^a-z0-9]/g, "");
    const newAccountId = user.nearAccountId || `${uniqueSuffix}.${serviceAccountId}`;

    let publicKey = user.nearPublicKey;
    let encryptedPrivateKey = user.nearPrivateKey;

    if (!publicKey || !encryptedPrivateKey) {
        const keyPair = KeyPair.fromRandom("ed25519");
        publicKey = keyPair.getPublicKey().toString();
        const privateKey = keyPair.toString();
        const { encrypt } = await import("./key-encryption.server");
        encryptedPrivateKey = encrypt(privateKey);
    }

    // DB에 키 + PENDING 상태 저장 → 즉시 반환
    await db.update(schema.user)
        .set({
            nearAccountId: newAccountId,
            nearPublicKey: publicKey,
            nearPrivateKey: encryptedPrivateKey,
            walletStatus: "PENDING",
            walletCreatedAt: new Date(),
            walletRetryCount: 0,
            walletError: null,
            updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));

    console.log(`[Wallet Async] Keys saved, status=PENDING for user ${userId} (${newAccountId})`);
    return newAccountId;
}

/**
 * [백그라운드 전용] 온체인 계정 생성 + Storage deposit + CHOCO 전송 + 잔액 동기화.
 * wallet-queue에서 호출됩니다. 직접 호출하지 마세요.
 */
export async function ensureNearWalletOnChain(
    userId: string,
    nearAccountId: string,
    publicKey: string,
    encryptedPrivateKey: string
): Promise<void> {
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;
    if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");

    // 1. 온체인 계정 생성
    const networkId = NEAR_CONFIG.networkId;
    const nodeUrl = NEAR_CONFIG.nodeUrl;
    const keyStore = new keyStores.InMemoryKeyStore();
    await keyStore.setKey(networkId, serviceAccountId, KeyPair.fromString(servicePrivateKey as any));
    const near = await connect({ networkId, nodeUrl, keyStore });
    const serviceAccount = await near.account(serviceAccountId);

    const initialBalance = BigInt("100000000000000000000000"); // 0.1 NEAR

    try {
        console.log(`[Wallet OnChain] Creating account: ${nearAccountId}`);
        await (serviceAccount as any).createAccount(nearAccountId, publicKey as any, initialBalance.toString());
        console.log(`[Wallet OnChain] Account created: ${nearAccountId}`);
    } catch (createError: any) {
        const isAccountExists = createError.type === 'AccountAlreadyExists' ||
            createError.message?.includes("already exists") ||
            createError.message?.includes("AccountAlreadyExists");
        if (!isAccountExists) throw createError;
        console.log(`[Wallet OnChain] Account ${nearAccountId} already exists. Continuing.`);
    }

    // 2. Storage deposit
    try {
        await ensureStorageDeposit(nearAccountId);
    } catch (storageError) {
        console.warn(`[Wallet OnChain] Storage deposit warning:`, storageError);
    }

    // 3. CHOCO 가입 보상 전송
    const { BigNumber } = await import("bignumber.js");
    const { sendChocoToken, getChocoBalance } = await import("./token.server");
    const { nanoid } = await import("nanoid");

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

        console.log(`[Wallet OnChain] Sending ${signupReward} CHOCO to ${nearAccountId}`);
        const sendResult = await sendChocoToken(nearAccountId, chocoAmountRaw);
        const chocoTxHash = (sendResult as any).transaction?.hash;

        if (chocoTxHash) {
            await db.insert(schema.tokenTransfer).values({
                id: nanoid(),
                userId,
                txHash: chocoTxHash,
                amount: chocoAmountRaw,
                tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                status: "COMPLETED",
                purpose: "SIGNUP_REWARD",
                createdAt: new Date(),
            });
        }
    }

    // 4. 잔액 동기화
    const onChainBalanceRaw = await getChocoBalance(nearAccountId);
    const onChainBalanceBN = new BigNumber(onChainBalanceRaw).dividedBy(new BigNumber(10).pow(18));

    await db.update(schema.user)
        .set({
            chocoBalance: onChainBalanceBN.toString(),
            credits: 0,
            chocoLastSyncAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(schema.user.id, userId));

    console.log(`[Wallet OnChain] Synced ${nearAccountId} balance: ${onChainBalanceBN.toString()} CHOCO`);
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
