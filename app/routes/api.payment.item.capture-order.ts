import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { prisma } from "~/lib/db.server";
import { paypal, paypalClient } from "~/lib/paypal.server";
import { HEART_PACKAGES } from "~/lib/items";
import { requireUserId } from "~/lib/auth.server";

const CaptureOrderSchema = z.object({
    orderId: z.string(),
    packageId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    const userId = await requireUserId(request);
    if (!userId) {
        throw data({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const submission = CaptureOrderSchema.safeParse(body);

    if (!submission.success) {
        return data({ error: "Invalid payload" }, { status: 400 });
    }

    const { orderId, packageId } = submission.data;
    const itemPackage = HEART_PACKAGES.find((p) => p.id === packageId);

    if (!itemPackage) {
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

        if (Math.abs(amountPaid - itemPackage.priceUSD) > 0.01) {
            console.error(`Amount mismatch: expected ${itemPackage.priceUSD}, paid ${amountPaid}`);
            return data({ error: "Payment amount mismatch. Please contact support." }, { status: 400 });
        }

        const quantity = itemPackage.quantity;
        const itemId = itemPackage.itemId;

        await prisma.$transaction([
            // 1. Payment 기록 생성
            prisma.payment.create({
                data: {
                    userId,
                    amount: itemPackage.priceUSD,
                    currency: "USD",
                    status: "COMPLETED",
                    type: "ITEM_PURCHASE",
                    provider: "PAYPAL",
                    transactionId: result.id,
                    description: itemPackage.name,
                    metadata: JSON.stringify({
                        itemId,
                        quantity,
                        packageId,
                        paypalResult: result
                    }),
                },
            }),
            // 2. 인벤토리 업데이트
            prisma.userInventory.upsert({
                where: { userId_itemId: { userId, itemId } },
                create: { userId, itemId, quantity },
                update: { quantity: { increment: quantity } },
            }),
        ]);

        return data({ success: true, quantityAdded: quantity });

    } catch (error: any) {
        console.error("PayPal Capture Item Error:", error);
        return data({ error: error.message || "Failed to capture payment" }, { status: 500 });
    }
}
