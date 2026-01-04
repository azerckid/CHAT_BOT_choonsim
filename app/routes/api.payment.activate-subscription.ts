
import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { prisma } from "~/lib/db.server";
import { SUBSCRIPTION_PLANS } from "~/lib/subscription-plans";
import { requireUserId } from "~/lib/auth.server";
import { DateTime } from "luxon";

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
        const existingSub = await prisma.user.findFirst({
            where: { subscriptionId },
        });

        if (existingSub) {
            // 이미 처리된 요청일 수 있음 (멱등성)
            if (existingSub.id === userId) {
                return data({ success: true, message: "Subscription already active" });
            }
            return data({ error: "Subscription ID already in use" }, { status: 409 });
        }

        // 트랜잭션으로 DB 업데이트
        await prisma.$transaction(async (tx) => {
            // 1. 사용자 정보 업데이트
            // 구독 만료일은 보통 1개월 뒤 (정확한 건 Webhook에서 갱신하지만, 초기값 설정)
            const nextMonth = DateTime.now().plus({ months: 1 }).toJSDate();

            await tx.user.update({
                where: { id: userId },
                data: {
                    subscriptionStatus: "ACTIVE",
                    subscriptionTier: planEntry.tier,
                    subscriptionId: subscriptionId,
                    currentPeriodEnd: nextMonth,
                    // 초기 크레딧 지급 (구독 보너스)
                    credits: { increment: planEntry.creditsPerMonth },
                    lastTokenRefillAt: new Date(),
                },
            });

            // 2. Payment 기록 생성
            await tx.payment.create({
                data: {
                    userId,
                    amount: planEntry.monthlyPrice,
                    currency: "USD",
                    status: "COMPLETED",
                    type: "SUBSCRIPTION_ACTIVATION",
                    provider: "PAYPAL",
                    subscriptionId: subscriptionId,
                    description: `Subscription Activation: ${planEntry.name}`,
                    creditsGranted: planEntry.creditsPerMonth,
                }
            });
        });

        return data({ success: true });

    } catch (error: any) {
        console.error("Subscription Activation Error:", error);
        return data({ error: "Failed to activate subscription" }, { status: 500 });
    }
}
