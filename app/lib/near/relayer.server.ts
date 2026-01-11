import { connect, keyStores, KeyPair, transactions, utils } from "near-api-js";
import { NEAR_CONFIG } from "./client.server";
import { db } from "../db.server";
import { relayerLog } from "../../db/schema";
import { logger } from "../logger.server";
import { nanoid } from "nanoid";

/**
 * 서비스 계정을 활용한 가스비 대납(Relayer) 서비스
 * 사용자가 서명한 Meta Transaction(SignedDelegate)을 대신 네트워크에 전송합니다.
 */
export async function submitMetaTransaction(signedDelegateSerialized: string) {
    const networkId = NEAR_CONFIG.networkId;
    const nodeUrl = NEAR_CONFIG.nodeUrl;
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;
    const privateKey = process.env.NEAR_SERVICE_PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("NEAR_SERVICE_PRIVATE_KEY is not set.");
    }

    // 1. 서비스 계정(Relayer) 설정
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(privateKey as any);
    await keyStore.setKey(networkId, serviceAccountId, keyPair);

    const near = await connect({
        networkId,
        nodeUrl,
        keyStore,
    });

    const relayerAccount = await near.account(serviceAccountId);

    try {
        // 2. 직렬화된 SignedDelegate 복원
        // near-api-js 버전에 따라 타입 정의가 누락될 수 있으므로 any 처리
        const signedDelegate = (transactions as any).SignedDelegate.decode(
            Buffer.from(signedDelegateSerialized, "base64")
        );

        const senderId = signedDelegate.delegateAction.senderId;
        logger.info({
            category: "PAYMENT",
            message: `Relaying meta transaction for user: ${senderId}`,
            metadata: { senderId }
        });

        // 3. 트랜잭션 전송 (Relayer가 가스비 지불)
        const result = (await relayerAccount.signedDelegate(signedDelegate)) as any;
        const txHash = result.transaction_outcome?.id || result.transaction?.hash;

        logger.audit({
            category: "PAYMENT",
            message: `Meta transaction relayed successfully`,
            metadata: { senderId, txHash }
        });

        return {
            success: true,
            txHash,
            result: result.status,
        };
    } catch (error) {
        logger.error({
            category: "PAYMENT",
            message: "Failed to relay meta transaction",
            stackTrace: (error as Error).stack,
            metadata: { 
                senderId: (signedDelegate as any).delegateAction?.senderId 
            }
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
/**
 * 릴레이어 계정의 현재 NEAR 잔액 조회
 */
export async function getRelayerBalance() {
    const networkId = NEAR_CONFIG.networkId;
    const nodeUrl = NEAR_CONFIG.nodeUrl;
    const serviceAccountId = NEAR_CONFIG.serviceAccountId;

    const near = await connect({
        networkId,
        nodeUrl,
        keyStore: new keyStores.InMemoryKeyStore(),
    });

    const account = await near.account(serviceAccountId);
    const balance = await account.getAccountBalance();

    return {
        total: utils.format.formatNearAmount(balance.total),
        available: utils.format.formatNearAmount(balance.available),
    };
}

/**
 * 릴레이 활동 로깅
 */
export async function logRelayerAction(data: {
    userId: string;
    requestIp?: string;
    txHash?: string;
    error?: string;
    status: "SUCCESS" | "FAILED";
}) {
    try {
        await db.insert(relayerLog).values({
            id: nanoid(),
            userId: data.userId,
            requestIp: data.requestIp,
            txHash: data.txHash,
            error: data.error,
            status: data.status,
            createdAt: new Date(),
        });
    } catch (e) {
        logger.error({
            category: "PAYMENT",
            message: "Failed to log relayer action",
            stackTrace: (e as Error).stack
        });
    }
}
