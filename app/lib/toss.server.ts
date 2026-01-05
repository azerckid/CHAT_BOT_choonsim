import { prisma } from "~/lib/db.server";

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
 * 결제 내역 DB 기록 및 크레딧 부여
 */
export async function processSuccessfulTossPayment(
    userId: string,
    paymentData: any,
    creditsGranted: number
) {
    return await prisma.$transaction(async (tx) => {
        // 1. 유저 크레딧 업데이트
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                credits: { increment: creditsGranted },
            },
        });

        // 2. 결제 로그 기록
        const payment = await tx.payment.create({
            data: {
                userId,
                transactionId: paymentData.orderId, // Toss OrderId
                paymentKey: paymentData.paymentKey, // Toss PaymentKey
                amount: paymentData.totalAmount,
                currency: "KRW",
                status: "COMPLETED",
                provider: "TOSS",
                type: "TOPUP",
                creditsGranted,
            },
        });

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
    return await prisma.$transaction(async (tx) => {
        // 1. 유저 구독 정보 업데이트
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                subscriptionTier: tier,
                subscriptionStatus: "ACTIVE",
            },
        });

        // 2. 결제 로그 기록
        const payment = await tx.payment.create({
            data: {
                userId,
                transactionId: paymentData.orderId,
                paymentKey: paymentData.paymentKey,
                amount: paymentData.totalAmount,
                currency: "KRW",
                status: "COMPLETED",
                provider: "TOSS",
                type: "SUBSCRIPTION",
                description: `${tier} Membership Subscription`,
                metadata: JSON.stringify({
                    paymentData,
                    tier,
                    activatedAt: new Array().toString() // Simple timestamp placeholder if needed
                }),
            },
        });

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
    return await prisma.$transaction(async (tx) => {
        // 1. 인벤토리 업데이트
        const inventory = await tx.userInventory.upsert({
            where: { userId_itemId: { userId, itemId } },
            create: { userId, itemId, quantity },
            update: { quantity: { increment: quantity } },
        });

        // 2. 결제 로그 기록
        const payment = await tx.payment.create({
            data: {
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
            },
        });

        return { inventory, payment };
    });
}
