import { type ActionFunctionArgs, data } from "react-router";
import { z } from "zod";
import { prisma } from "~/lib/db.server";
import { paypal, paypalClient } from "~/lib/paypal.server";
import { CREDIT_PACKAGES } from "~/lib/subscription-plans";
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
    requestBody.requestBody({});

    try {
        const capture = await paypalClient.execute(requestBody);
        const result = capture.result;

        if (result.status !== "COMPLETED") {
            return data({ error: "Payment not completed" }, { status: 400 });
        }

        // 결제 검증 (금액 일치 여부 등)
        const purchaseUnit = result.purchase_units[0];
        const amountPaid = parseFloat(purchaseUnit.payments.captures[0].amount.value);

        // 부동소수점 비교 주의 (여기서는 간단히 처리하지만 실제론 epsilon 고려 필요할 수 있음)
        if (Math.abs(amountPaid - creditPackage.price) > 0.01) {
            console.error(`Amount mismatch: expected ${creditPackage.price}, paid ${amountPaid}`);
            // 이미 결제는 되었으므로, 여기서 에러를 내면 사용자 돈은 나갔는데 크레딧은 안 들어오는 상황이 됨.
            // 우선 Log를 남기고, 크레딧은 지급하되 'Review Needed' 같은 플래그를 달거나, 
            // 혹은 엄격하게 막고 환불 프로세스를 타야 함. 
            // 여기서는 안전하게 에러 리턴하고 수동 처리하도록 유도 (돈은 나갔으므로 매우 중요)
            return data({ error: "Payment amount mismatch. Please contact support." }, { status: 400 });
        }

        // 트랜잭션으로 DB 업데이트
        const totalCredits = creditPackage.credits + creditPackage.bonus;

        await prisma.$transaction([
            // 1. Payment 기록 생성
            prisma.payment.create({
                data: {
                    userId,
                    amount: creditPackage.price,
                    currency: "USD",
                    status: "COMPLETED",
                    type: "TOPUP",
                    provider: "PAYPAL",
                    transactionId: result.id, // orderId or captureId? result.id is orderId typically, let's use capture Id if available
                    // result.purchase_units[0].payments.captures[0].id 가 실제 캡처 ID임.
                    // result.id는 Order ID.
                    // 스키마의 transactionId는 유니크하므로 capture ID를 쓰는게 더 정확할 수 있음.
                    // 여기서는 Order ID를 transactionId로 쓰고, 나중에 구분하려면 메타데이터에 넣자.
                    // or use capture ID.
                    description: creditPackage.name,
                    creditsGranted: totalCredits,
                    metadata: JSON.stringify(result),
                },
            }),
            // 2. 유저 크레딧 업데이트
            prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: totalCredits },
                    lastTokenRefillAt: new Date(),
                },
            }),
        ]);

        return data({ success: true, newCredits: totalCredits });

    } catch (error: any) {
        console.error("PayPal Capture Error:", error);
        // 에러 상세 내용 파악
        const errorMessage = error.message || "Failed to capture payment";
        return data({ error: errorMessage }, { status: 500 });
    }
}
