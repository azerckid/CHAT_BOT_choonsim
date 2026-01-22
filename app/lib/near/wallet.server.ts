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

    // 지갑 ID가 있고 키 정보도 온전한 경우만 정상 리턴
    if (user.nearAccountId && user.nearPublicKey && user.nearPrivateKey) {
        return user.nearAccountId;
    }

    // 지갑 ID는 있는데 키 정보가 없는 경우 (치명적 불일치 상태)
    if (user.nearAccountId && (!user.nearPublicKey || !user.nearPrivateKey)) {
        console.error(`[CRITICAL] Wallet ${user.nearAccountId} for user ${userId} is missing private key or public key! Manual recovery required.`);
        // 이 상태에서는 아무것도 하지 않고 null을 리턴하거나 에러를 던져서 수동 수습을 유도함
        return user.nearAccountId;
    }

    console.log(`[Wallet] Creating invisible wallet for user: ${userId}`);

    // 변수를 try 블록 밖에서 선언하여 catch 블록에서도 접근 가능하도록 함
    const networkId = NEAR_CONFIG.networkId;
    const nodeUrl = NEAR_CONFIG.nodeUrl;
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    let newAccountId: string | null = null;
    let publicKey: string | null = null;

    try {
        const servicePrivateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

        if (!servicePrivateKey) throw new Error("NEAR_SERVICE_PRIVATE_KEY is missing");

        // 2. 새 키 페어 생성
        const keyPair = KeyPair.fromRandom("ed25519");
        publicKey = keyPair.getPublicKey().toString();
        const privateKey = keyPair.toString(); // TODO: 실제 운영 시 암호화 라이브러리 연동 권장

        // 3. NEAR 계정 아이디 결정 (이메일 기반 또는 ID 기반)
        // NEAR 계정 규칙: a-z, 0-9, _, - (최대 64자)
        const sanitizedId = userId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
        newAccountId = `${sanitizedId}.${serviceAccountId}`;

        // 4. 온체인 계정 생성 (서비스 계정이 서명)
        const keyStore = new keyStores.InMemoryKeyStore();
        await keyStore.setKey(networkId, serviceAccountId, KeyPair.fromString(servicePrivateKey as any));

        const near = await connect({ networkId, nodeUrl, keyStore });
        const serviceAccount = await near.account(serviceAccountId);

        // Sub-account 생성 (0.1 NEAR 정도의 보증금 포함)
        // near-api-js의 createAccount 메서드 사용
        // 참고: createAccount는 서브 계정 생성 시 사용 가능한 헬퍼 메서드입니다
        const publicKeyObj = keyPair.getPublicKey();
        const initialBalance = BigInt("100000000000000000000000"); // 0.1 NEAR

        try {
            // 방법 1: createAccount 메서드 시도 (만약 존재한다면)
            if (typeof (serviceAccount as any).createAccount === "function") {
                await (serviceAccount as any).createAccount(
                    newAccountId,
                    publicKeyObj.toString(),
                    initialBalance.toString()
                );
            } else {
                // 방법 2: functionCall을 사용하여 서브 계정 생성
                // NEAR에서 서브 계정을 생성하려면 부모 계정에 대한 functionCall을 사용합니다
                await serviceAccount.functionCall({
                    contractId: serviceAccountId, // 자기 자신에게 호출
                    methodName: "create_account",
                    args: {
                        new_account_id: newAccountId,
                        new_public_key: publicKeyObj.toString(),
                    },
                    gas: BigInt("30000000000000"), // 30 TGas
                    attachedDeposit: initialBalance,
                });
            }
        } catch (createError: any) {
            // 계정이 이미 존재하는 경우 처리
            const isAccountExists = createError.type === 'AccountAlreadyExists' ||
                createError.message?.includes("already exists") ||
                createError.message?.includes("AccountAlreadyExists");

            if (isAccountExists) {
                console.log(`[Wallet] Account ${newAccountId} already exists on-chain.`);

                // [CRITICAL FIX] 기존에 DB에 저장된 키가 있다면 절대 새로 생성하거나 덮어씌우지 않음
                if (user.nearAccountId === newAccountId) {
                    console.log(`[Wallet] User already has this account ID linked. Maintaining existing keys.`);
                    return newAccountId;
                }

                // 만약 계정 아이디는 일치하는데 DB에 키가 없는 특수 상황인 경우만 제한적으로 처리 고려
                // 하지만 안전을 위해 여기서는 추가적인 덮어쓰기를 원천 금지함
                console.error(`[Wallet] Account exists but ID mismatch or key missing. Manual intervention required to prevent key loss.`);
                throw new Error(`Account ${newAccountId} already exists. Cannot safely link without verified private key.`);
            }

            // 다른 에러는 그대로 throw
            console.error(`[Wallet] Account creation failed for ${newAccountId}:`, createError);
            throw new Error(`Failed to create NEAR account: ${createError.message || createError}`);
        }

        // 5. CHOCO 토큰 스토리지 예치
        await ensureStorageDeposit(newAccountId);

        // [New Guard 1] 생성된 키 형식의 유효성 즉시 검증 (ed25519: 접두사 명시적 확인 포함)
        if (!privateKey.startsWith("ed25519:")) {
            throw new Error(`Generated private key is missing 'ed25519:' prefix. Security policy violation.`);
        }
        try {
            KeyPair.fromString(privateKey as any);
        } catch (formatError) {
            throw new Error(`Generated private key format is invalid: ${formatError}`);
        }

        // [New Guard 2] 온체인 계정 및 권한(Access Key) 검증
        const account = await near.account(newAccountId);
        try {
            const state = await account.getState();
            if (!state) throw new Error("Account was not found on-chain immediately after creation.");

            const accessKeys = await account.getAccessKeys();
            const hasCorrectKey = accessKeys.some(k => k.public_key === publicKey);
            if (!hasCorrectKey) {
                throw new Error(`On-chain access key mismatch. Expected ${publicKey} to be registered.`);
            }
            console.log(`[Wallet] On-chain verification successful for ${newAccountId}`);
        } catch (verifyError) {
            console.error(`[Wallet] Post-creation on-chain verification failed:`, verifyError);
            throw verifyError;
        }

        // 6. 개인키 암호화 및 무결성 검증
        const { encrypt, decrypt } = await import("./key-encryption.server");
        const encryptedPrivateKey = encrypt(privateKey);

        // [New Guard 3] 저장 전 복호화 라운드트립 테스트 (데이터 유실 방지)
        const verifyDecrypted = decrypt(encryptedPrivateKey);
        if (verifyDecrypted !== privateKey) {
            throw new Error("Encryption integrity check failed. Private key mismatch after round-trip.");
        }

        // 7. DB 업데이트 (지갑 정보 저장)
        // 이 시점까지 모든 검증(형식, 온체인, 암호화)을 통과해야만 DB에 기록함
        await db.update(schema.user)
            .set({
                nearAccountId: newAccountId,
                nearPublicKey: publicKey,
                nearPrivateKey: encryptedPrivateKey,
                chocoBalance: "0",
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));

        console.log(`[Wallet] Successfully created and verified wallet: ${newAccountId}`);

        // 8. 신규 가입 축하금 (100 CHOCO) 지급
        try {
            const { BigNumber } = await import("bignumber.js");
            const { sendChocoToken, getChocoBalance } = await import("./token.server");
            const { logger } = await import("../logger.server");
            const { nanoid } = await import("nanoid");

            // [Idempotency Guard] 이미 보상이 지급되었는지 확인
            const existingReward = await db.query.tokenTransfer.findFirst({
                where: (table, { and, eq }) => and(
                    eq(table.userId, userId),
                    eq(table.purpose, "SIGNUP_REWARD"),
                    eq(table.status, "COMPLETED")
                )
            });

            if (existingReward) {
                console.log(`[Wallet] Signup reward already granted for user ${userId}. Skipping.`);
            } else {
                const signupReward = 100;
                const chocoAmount = new BigNumber(signupReward);
                const chocoAmountRaw = chocoAmount.multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

                logger.info({
                    category: "PAYMENT",
                    message: `Granting signup reward of ${signupReward} CHOCO to user ${userId}`,
                    metadata: { userId, nearAccountId: newAccountId }
                });

                // 온체인 CHOCO 전송
                let chocoTxHash: string | null = null;
                try {
                    const sendResult = await sendChocoToken(newAccountId, chocoAmountRaw);
                    chocoTxHash = (sendResult as any).transaction.hash;
                    logger.info({
                        category: "PAYMENT",
                        message: `Successfully transferred ${signupReward} CHOCO tokens (Signup reward)`,
                        metadata: { userId, nearAccountId: newAccountId, txHash: chocoTxHash }
                    });
                } catch (error) {
                    logger.error({
                        category: "PAYMENT",
                        message: "Failed to transfer signup reward CHOCO tokens on-chain",
                        stackTrace: (error as Error).stack,
                        metadata: { userId, nearAccountId: newAccountId }
                    });
                }

                // DB 업데이트: 잔액 반영 및 이력 기록
                if (chocoTxHash) {
                    await db.transaction(async (tx) => {
                        // 실제 온체인 잔액 확인하여 정합성 확보
                        const latestOnChainRaw = await getChocoBalance(newAccountId!);
                        const latestOnChainBN = new BigNumber(latestOnChainRaw).dividedBy(new BigNumber(10).pow(18));

                        await tx.update(schema.user)
                            .set({
                                chocoBalance: latestOnChainBN.toString(), // 실시간 온체인 잔액으로 정합성 확보
                                credits: 0,
                                updatedAt: new Date(),
                            })
                            .where(eq(schema.user.id, userId));

                        await tx.insert(schema.tokenTransfer).values({
                            id: nanoid(),
                            userId,
                            txHash: chocoTxHash!,
                            amount: chocoAmountRaw,
                            tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                            status: "COMPLETED",
                            purpose: "SIGNUP_REWARD",
                            createdAt: new Date(),
                        });
                    });
                }
            }
        } catch (error: any) {
            console.error(`[Wallet] Failed to process signup reward for user ${userId}:`, error);
        }

        // 9. 실시간 온체인 잔액 강제 동기화 (숫자 불일치 해결 핵심)
        try {
            const { BigNumber } = await import("bignumber.js");
            const { getChocoBalance } = await import("./token.server");

            const onChainBalanceRaw = await getChocoBalance(newAccountId);
            const onChainBalanceBN = new BigNumber(onChainBalanceRaw).dividedBy(new BigNumber(10).pow(18));

            await db.update(schema.user)
                .set({
                    chocoBalance: onChainBalanceBN.toString(), // DB 값을 온체인 잔액으로 강제 업데이트
                    chocoLastSyncAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));

            console.log(`[Wallet] Balance synchronized with on-chain for ${newAccountId}: ${onChainBalanceBN.toString()} CHOCO`);
        } catch (syncError) {
            console.error(`[Wallet] Failed to sync balance for user ${userId}:`, syncError);
        }

        return newAccountId;
    } catch (error: any) {
        // 상세한 에러 로깅
        console.error(`[Wallet] Failed to create wallet for ${userId}:`, {
            error: error.message || error,
            stack: error.stack,
            userId,
            serviceAccountId,
            networkId,
            nodeUrl,
        });

        // 특정 에러 타입에 대한 추가 정보
        if (error.message?.includes("insufficient balance")) {
            console.error(`[Wallet] Service account ${serviceAccountId} has insufficient balance. Please add more NEAR.`);
        }
        if (error.message?.includes("already exists")) {
            // 이미 내부에서 처리되었지만, 여기까지 도달했다면 예상치 못한 경우
            console.warn(`[Wallet] Account ${newAccountId} already exists but was not handled properly.`);
        }
        if (error.message?.includes("Invalid account ID")) {
            console.error(`[Wallet] Invalid account ID format: ${newAccountId}`);
        }

        return null;
    }
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
    // 1. 사용자 정보 조회
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { id: true, nearAccountId: true }
    });

    if (!user || !user.nearAccountId) {
        console.error(`[Regenerate Keys] User ${userId} has no NEAR account`);
        return null;
    }

    console.log(`[Regenerate Keys] Regenerating keys for account: ${user.nearAccountId}`);

    try {
        // 2. 새 키 페어 생성
        const keyPair = KeyPair.fromRandom("ed25519");
        const publicKey = keyPair.getPublicKey().toString();
        const privateKey = keyPair.toString();

        // 3. 프라이빗 키 암호화
        const { encrypt } = await import("./key-encryption.server");
        const encryptedPrivateKey = encrypt(privateKey);

        // 4. DB 업데이트
        await db.update(schema.user)
            .set({
                nearPublicKey: publicKey,
                nearPrivateKey: encryptedPrivateKey,
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));

        console.log(`[Regenerate Keys] Successfully regenerated keys for ${user.nearAccountId}`);

        return {
            publicKey,
            privateKey,
            nearAccountId: user.nearAccountId,
        };
    } catch (error: any) {
        console.error(`[Regenerate Keys] Failed to regenerate keys for ${user.nearAccountId}:`, error);
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
