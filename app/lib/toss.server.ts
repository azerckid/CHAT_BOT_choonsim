import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";
import crypto from "crypto";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;

/**
 * 토스페이먼츠 결제 승인 요청
 */
export async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
    if (!TOSS_SECRET_KEY) {
        throw new Error("TOSS_SECRET_KEY is not defined");
    }

    // Basic Auth: SecretKey를 Base64 인코딩 (끝에 콜론 포함)
    const encodedKey = Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64");

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
            Authorization: `Basic ${encodedKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            paymentKey,
            orderId,
            amount,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Toss Payment confirmation failed");
    }

    return data;
}

/**
 * 결제 내역 DB 기록 및 CHOCO 전송 (환전)
 */
export async function processSuccessfulTossPayment(
    userId: string,
    paymentData: any,
    creditsGranted: number
) {
    // 1. 사용자 정보 조회 (NEAR 계정 확인)
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { id: true, nearAccountId: true, chocoBalance: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // 2. KRW → CHOCO 계산
    const { calculateChocoFromKRW } = await import("../near/exchange-rate.server");
    const krwAmount = paymentData.totalAmount;
    const chocoAmount = await calculateChocoFromKRW(krwAmount);
    const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    // 3. NEAR 계정이 있으면 온체인 CHOCO 전송 (서비스 계정에서 사용자 계정으로)
    let chocoTxHash: string | null = null;
    if (user.nearAccountId) {
        try {
            const { sendChocoToken } = await import("../near/token.server");
            logger.info({
                category: "PAYMENT",
                message: `Transferring ${chocoAmount} CHOCO tokens to ${user.nearAccountId} (Toss payment)`,
                metadata: { userId, nearAccountId: user.nearAccountId, krwAmount, chocoAmount }
            });

            const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
            chocoTxHash = (sendResult as any).transaction.hash;
        } catch (error) {
            logger.error({
                category: "PAYMENT",
                message: "Failed to transfer CHOCO tokens on-chain (Toss payment)",
                stackTrace: (error as Error).stack,
                metadata: { userId, nearAccountId: user.nearAccountId }
            });
            // 온체인 전송 실패해도 DB는 업데이트 (나중에 복구 가능)
        }
    }

    // 4. DB 트랜잭션
    return await db.transaction(async (tx) => {
        // 유저 CHOCO 잔액 업데이트
        const newChocoBalance = new BigNumber(user.chocoBalance || "0").plus(chocoAmount);

        await tx.update(schema.user)
            .set({
                chocoBalance: newChocoBalance.toString(),
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));

        const updatedUser = await tx.query.user.findFirst({
            where: eq(schema.user.id, userId),
        });

        // 결제 로그 기록
        const [payment] = await tx.insert(schema.payment).values({
            id: crypto.randomUUID(),
            userId,
            transactionId: paymentData.orderId, // Toss OrderId
            paymentKey: paymentData.paymentKey, // Toss PaymentKey
            amount: paymentData.totalAmount,
            currency: "KRW",
            status: "COMPLETED",
            provider: "TOSS",
            type: "TOPUP",
            creditsGranted, // 호환성을 위해 유지 (deprecated)
            txHash: chocoTxHash || undefined,
            metadata: JSON.stringify({
                ...paymentData,
                chocoAmount,
                chocoTxHash,
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // TokenTransfer 기록 (온체인 전송 성공 시)
        if (chocoTxHash) {
            await tx.insert(schema.tokenTransfer).values({
                id: crypto.randomUUID(),
                userId,
                txHash: chocoTxHash,
                amount: chocoAmountRaw,
                tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                status: "COMPLETED",
                purpose: "TOPUP",
                createdAt: new Date(),
            });
        }

        return { user: updatedUser, payment };
    });
}

/**
 * 멤버십 구독 처리 (토스 결제 완료 후)
 */
export async function processSuccessfulTossSubscription(
    userId: string,
    paymentData: any,
    tier: string
) {
    // 1. 사용자 정보 및 플랜 정보 조회
    const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
        columns: { id: true, nearAccountId: true, chocoBalance: true },
    });

    if (!user) {
        throw new Error("User not found");
    }

    const { SUBSCRIPTION_PLANS } = await import("../subscription-plans");
    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
    const creditsPerMonth = plan?.creditsPerMonth || 0;

    // 2. 멤버십 보상 CHOCO 계산 (1 Credit = 1 CHOCO)
    const chocoAmount = creditsPerMonth.toString();
    const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

    // 3. NEAR 계정이 있으면 온체인 CHOCO 전송 (서비스 계정에서 사용자 계정으로)
    let chocoTxHash: string | null = null;
    if (user.nearAccountId && creditsPerMonth > 0) {
        try {
            const { sendChocoToken } = await import("../near/token.server");
            logger.info({
                category: "PAYMENT",
                message: `Transferring ${chocoAmount} CHOCO tokens for subscription (Toss)`,
                metadata: { userId, tier, nearAccountId: user.nearAccountId, chocoAmount }
            });

            const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
            chocoTxHash = (sendResult as any).transaction.hash;
        } catch (error) {
            logger.error({
                category: "PAYMENT",
                message: "Failed to transfer CHOCO tokens on-chain (Toss subscription)",
                stackTrace: (error as Error).stack,
                metadata: { userId, tier }
            });
        }
    }

    // 4. DB 트랜잭션
    return await db.transaction(async (tx) => {
        // 유저 구독 정보 및 CHOCO 잔액 업데이트
        const newChocoBalance = new BigNumber(user.chocoBalance || "0").plus(chocoAmount);

        await tx.update(schema.user)
            .set({
                subscriptionTier: tier,
                subscriptionStatus: "ACTIVE",
                chocoBalance: newChocoBalance.toString(),
                updatedAt: new Date(),
            })
            .where(eq(schema.user.id, userId));

        const updatedUser = await tx.query.user.findFirst({
            where: eq(schema.user.id, userId),
        });

        // 결제 로그 기록
        const [payment] = await tx.insert(schema.payment).values({
            id: crypto.randomUUID(),
            userId,
            transactionId: paymentData.orderId,
            paymentKey: paymentData.paymentKey,
            amount: paymentData.totalAmount,
            currency: "KRW",
            status: "COMPLETED",
            provider: "TOSS",
            type: "SUBSCRIPTION",
            description: `${tier} Membership Subscription`,
            creditsGranted: creditsPerMonth, // 호환성을 위해 유지 (deprecated)
            txHash: chocoTxHash || undefined,
            metadata: JSON.stringify({
                paymentData,
                tier,
                chocoAmount,
                chocoTxHash,
                activatedAt: new Date().toISOString(),
            }),
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        // TokenTransfer 기록 (온체인 전송 성공 시)
        if (chocoTxHash) {
            await tx.insert(schema.tokenTransfer).values({
                id: crypto.randomUUID(),
                userId,
                txHash: chocoTxHash,
                amount: chocoAmountRaw,
                tokenContract: process.env.NEAR_CHOCO_TOKEN_CONTRACT || "",
                status: "COMPLETED",
                purpose: "TOPUP",
                createdAt: new Date(),
            });
        }

        return { user: updatedUser, payment };
    });
}

/**
 * 아이템 구매 처리 (토스 결제 완료 후)
 */
export async function processSuccessfulTossItemPayment(
    userId: string,
    paymentData: any,
    itemId: string,
    quantity: number
) {
    return await db.transaction(async (tx) => {
        // 1. 인벤토리 업데이트
        await tx.insert(schema.userInventory).values({
            id: crypto.randomUUID(),
            userId,
            itemId,
            quantity,
            updatedAt: new Date(),
        }).onConflictDoUpdate({
            target: [schema.userInventory.userId, schema.userInventory.itemId],
            set: {
                quantity: sql`${schema.userInventory.quantity} + ${quantity}`,
                updatedAt: new Date(),
            },
        });

        const inventory = await tx.query.userInventory.findFirst({
            where: and(
                eq(schema.userInventory.userId, userId),
                eq(schema.userInventory.itemId, itemId)
            ),
        });

        // 2. 결제 로그 기록
        const [payment] = await tx.insert(schema.payment).values({
            id: crypto.randomUUID(),
            userId,
            transactionId: paymentData.orderId,
            paymentKey: paymentData.paymentKey,
            amount: paymentData.totalAmount,
            currency: "KRW",
            status: "COMPLETED",
            provider: "TOSS",
            type: "ITEM_PURCHASE",
            description: `아이템 구매: ${itemId} x ${quantity}`,
            metadata: JSON.stringify({ itemId, quantity, paymentData }),
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return { inventory, payment };
    });
}
