import { PrismaClient } from "@prisma/client";

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const prisma = new PrismaClient();

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
