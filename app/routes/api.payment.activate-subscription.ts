import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db.server";
import { SUBSCRIPTION_PLANS } from "~/lib/subscription-plans";
import { requireUserId } from "~/lib/auth.server";
import { DateTime } from "luxon";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";

const ActivateSubscriptionSchema = z.object({
    subscriptionId: z.string(),
    planId: z.string(), // PayPal Plan ID
});

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request);
    if (!userId) {
        throw data({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const submission = ActivateSubscriptionSchema.safeParse(Object.fromEntries(formData));

    if (!submission.success) {
        console.error("Invalid payload:", submission.error);
        return data({ error: "Invalid payload" }, { status: 400 });
    }

    const { subscriptionId, planId } = submission.data;

    // Plan ID로 Tier 찾기
    const planEntry = Object.values(SUBSCRIPTION_PLANS).find(p => p.paypalPlanId === planId);

    if (!planEntry) {
        return data({ error: "Unknown subscription plan" }, { status: 400 });
    }

    try {
        // 이미 사용 중인 Subscription ID인지 확인
        const existingSub = await db.query.user.findFirst({
            where: eq(schema.user.subscriptionId, subscriptionId),
        });

        if (existingSub) {
            // 이미 처리된 요청일 수 있음 (멱등성)
            if (existingSub.id === userId) {
                return data({ success: true, message: "Subscription already active" });
            }
            return data({ error: "Subscription ID already in use" }, { status: 409 });
        }

        // 1. 사용자 정보 조회 (NEAR 계정 확인)
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { id: true, nearAccountId: true, chocoBalance: true },
        });

        if (!user) {
            return data({ error: "User not found" }, { status: 404 });
        }

        // 2. 멤버십 보상 CHOCO 계산 (1 Credit = 1 CHOCO)
        const chocoAmount = planEntry.creditsPerMonth.toString();
        const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

        // 3. NEAR 계정이 있으면 온체인 CHOCO 전송 (서비스 계정에서 사용자 계정으로)
        let chocoTxHash: string | null = null;
        if (user.nearAccountId && planEntry.creditsPerMonth > 0) {
            try {
                const { sendChocoToken } = await import("~/lib/near/token.server");
                logger.info({
                    category: "PAYMENT",
                    message: `Transferring ${chocoAmount} CHOCO tokens for subscription activation (PayPal)`,
                    metadata: { userId, tier: planEntry.tier, nearAccountId: user.nearAccountId, chocoAmount }
                });

                const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
                chocoTxHash = (sendResult as any).transaction.hash;
            } catch (error) {
                logger.error({
                    category: "PAYMENT",
                    message: "Failed to transfer CHOCO tokens on-chain (PayPal subscription activation)",
                    stackTrace: (error as Error).stack,
                    metadata: { userId, tier: planEntry.tier }
                });
            }
        }

        // 4. 트랜잭션으로 DB 업데이트
        const nextMonth = DateTime.now().plus({ months: 1 }).toJSDate();

        await db.transaction(async (tx) => {
            // 사용자 정보 업데이트
            const newChocoBalance = new BigNumber(user.chocoBalance || "0").plus(chocoAmount);

            await tx.update(schema.user)
                .set({
                    subscriptionStatus: "ACTIVE",
                    subscriptionTier: planEntry.tier,
                    subscriptionId: subscriptionId,
                    currentPeriodEnd: nextMonth,
                    chocoBalance: newChocoBalance.toString(),
                    lastTokenRefillAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));

            // Payment 기록 생성
            await tx.insert(schema.payment).values({
                id: crypto.randomUUID(),
                userId,
                amount: planEntry.monthlyPrice,
                currency: "USD",
                status: "COMPLETED",
                type: "SUBSCRIPTION_ACTIVATION",
                provider: "PAYPAL",
                subscriptionId: subscriptionId,
                description: `Subscription Activation: ${planEntry.name}`,
                creditsGranted: planEntry.creditsPerMonth, // 호환성을 위해 유지 (deprecated)
                txHash: chocoTxHash || undefined,
                metadata: JSON.stringify({
                    tier: planEntry.tier,
                    chocoAmount,
                    chocoTxHash,
                }),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

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
        });

        return data({ success: true });

    } catch (error: any) {
        console.error("Subscription Activation Error:", error);
        return data({ error: "Failed to activate subscription" }, { status: 500 });
    }
}
