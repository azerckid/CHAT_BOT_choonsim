import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { db } from "~/lib/db.server";
import { paypal, paypalClient } from "~/lib/paypal.server";
import { CREDIT_PACKAGES } from "~/lib/subscription-plans";
import { requireUserId } from "~/lib/auth.server";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";

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

        // 트랜잭션으로 DB 업데이트
        const totalCredits = creditPackage.credits + creditPackage.bonus;

        await db.transaction(async (tx) => {
            // 1. Payment 기록 생성
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
                creditsGranted: totalCredits,
                metadata: JSON.stringify(result),
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // 2. 유저 크레딧 업데이트
            await tx.update(schema.user)
                .set({
                    credits: sql`${schema.user.credits} + ${totalCredits}`,
                    lastTokenRefillAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(schema.user.id, userId));
        });

        return data({ success: true, newCredits: totalCredits });

    } catch (error: any) {
        console.error("PayPal Capture Error:", error);
        const errorMessage = error.message || "Failed to capture payment";
        return data({ error: errorMessage }, { status: 500 });
    }
}
