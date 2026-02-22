import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db.server";
import { paypal, paypalClient } from "~/lib/paypal.server";
import { CREDIT_PACKAGES } from "~/lib/subscription-plans";
import { requireUserId } from "~/lib/auth.server";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";
import { BigNumber } from "bignumber.js";
import { logger } from "~/lib/logger.server";

const CaptureOrderSchema = z.object({
    orderId: z.string(),
    packageId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request);
    if (!userId) {
        throw data({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const submission = CaptureOrderSchema.safeParse(Object.fromEntries(formData));

    if (!submission.success) {
        return data({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderId, packageId } = submission.data;
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);

    if (!creditPackage) {
        return data({ error: "Invalid package ID" }, { status: 400 });
    }

    const requestBody = new paypal.orders.OrdersCaptureRequest(orderId);
    requestBody.requestBody({} as any);

    try {
        const capture = await paypalClient.execute(requestBody);
        const result = capture.result;

        if (result.status !== "COMPLETED") {
            return data({ error: "Payment not completed" }, { status: 400 });
        }

        // 결제 검증 (금액 일치 여부 등)
        const purchaseUnit = result.purchase_units[0];
        const amountPaid = parseFloat(purchaseUnit.payments.captures[0].amount.value);

        if (Math.abs(amountPaid - creditPackage.price) > 0.01) {
            console.error(`Amount mismatch: expected ${creditPackage.price}, paid ${amountPaid}`);
            return data({ error: "Payment amount mismatch. Please contact support." }, { status: 400 });
        }

        // 1. 사용자 정보 조회 (NEAR 계정 확인)
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { id: true, nearAccountId: true, chocoBalance: true },
        });

        if (!user) {
            return data({ error: "User not found" }, { status: 404 });
        }

        // 2. USD → CHOCO 계산
        const { calculateChocoFromUSD } = await import("~/lib/near/exchange-rate.server");
        const chocoAmount = await calculateChocoFromUSD(creditPackage.price);
        const chocoAmountRaw = new BigNumber(chocoAmount).multipliedBy(new BigNumber(10).pow(18)).toFixed(0);

        // 3. NEAR 계정이 있으면 온체인 CHOCO 전송 (서비스 계정에서 사용자 계정으로)
        let chocoTxHash: string | null = null;
        if (user.nearAccountId) {
            try {
                const { sendChocoToken } = await import("~/lib/near/token.server");
                logger.info({
                    category: "PAYMENT",
                    message: `Transferring ${chocoAmount} CHOCO tokens to ${user.nearAccountId} (PayPal payment)`,
                    metadata: { userId, nearAccountId: user.nearAccountId, usdAmount: creditPackage.price, chocoAmount }
                });

                const sendResult = await sendChocoToken(user.nearAccountId, chocoAmountRaw);
                chocoTxHash = (sendResult as any).transaction.hash;
            } catch (error) {
                logger.error({
                    category: "PAYMENT",
                    message: "Failed to transfer CHOCO tokens on-chain (PayPal payment)",
                    stackTrace: (error as Error).stack,
                    metadata: { userId, nearAccountId: user.nearAccountId }
                });
                // 온체인 전송 실패해도 DB는 업데이트 (나중에 복구 가능)
            }
        }

        // 4. 트랜잭션으로 DB 업데이트
        const totalCredits = creditPackage.credits + creditPackage.bonus; // 호환성을 위해 유지

        await db.transaction(async (tx) => {
            // Payment 기록 생성
            await tx.insert(schema.payment).values({
                id: crypto.randomUUID(),
                userId,
                amount: creditPackage.price,
                currency: "USD",
                status: "COMPLETED",
                type: "TOPUP",
                provider: "PAYPAL",
                transactionId: result.id,
                description: creditPackage.name,
                creditsGranted: totalCredits, // 호환성을 위해 유지 (deprecated)
                txHash: chocoTxHash || undefined,
                metadata: JSON.stringify({
                    ...result,
                    chocoAmount,
                    chocoTxHash,
                }),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // 유저 CHOCO 잔액 업데이트
            const newChocoBalance = new BigNumber(user.chocoBalance || "0").plus(chocoAmount);
            await tx.update(schema.user)
                .set({
                    chocoBalance: newChocoBalance.toString(),
                    lastTokenRefillAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));

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

            // PAYMENT 알림 생성
            await tx.insert(schema.notification).values({
                id: crypto.randomUUID(),
                userId,
                type: "PAYMENT",
                title: "결제가 완료되었습니다",
                body: `${creditPackage.name} 구매가 완료되었습니다. +${chocoAmount} CHOCO`,
                createdAt: new Date(),
            });
        });

        return data({ success: true, newCredits: totalCredits, chocoAmount });

    } catch (error: any) {
        console.error("PayPal Capture Error:", error);
        const errorMessage = error.message || "Failed to capture payment";
        return data({ error: errorMessage }, { status: 500 });
    }
}
