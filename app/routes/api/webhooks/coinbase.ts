import type { ActionFunctionArgs } from "react-router";
import coinbase from "coinbase-commerce-node";
const { Webhook } = coinbase;
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, sql } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        console.error("COINBASE_COMMERCE_WEBHOOK_SECRET is not configured");
        return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    try {
        const rawBody = await request.text();
        const signature = request.headers.get("X-CC-Webhook-Signature");

        if (!signature) {
            return Response.json({ error: "Missing signature" }, { status: 401 });
        }

        // Webhook 서명 검증
        let event;
        try {
            event = Webhook.verifyEventBody(rawBody, signature, WEBHOOK_SECRET);
        } catch (err) {
            console.error("Coinbase webhook verification failed:", err);
            return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        // charge:confirmed 이벤트 처리 (블록체인 확인 완료 시)
        if (event.type === "charge:confirmed") {
            const charge = event.data;

            // transactionId(Charge ID)로 Payment 레코드 조회
            const paymentRecord = await db.query.payment.findFirst({
                where: eq(schema.payment.transactionId, charge.id),
            });

            if (!paymentRecord) {
                console.warn(`Payment record not found for charge ID: ${charge.id}`);
                return Response.json({ success: true, message: "Payment record not found" });
            }

            // 이미 완료된 결제인지 확인 (중복 처리 방지)
            if (paymentRecord.status === "COMPLETED") {
                return Response.json({ success: true, message: "Already processed" });
            }

            // 트랜잭션: 결제 상태 업데이트 및 크레딧 지급
            try {
                // 1. 결제 정보 업데이트
                await db.update(schema.payment)
                    .set({
                        status: "COMPLETED",
                        updatedAt: new Date(),
                        cryptoCurrency: charge.pricing?.local?.currency || null,
                        cryptoAmount: charge.pricing?.local?.amount ? parseFloat(charge.pricing.local.amount) : null,
                        exchangeRate: (charge.pricing?.local?.amount && paymentRecord.amount)
                            ? Number(paymentRecord.amount) / parseFloat(charge.pricing.local.amount)
                            : null,
                    })
                    .where(eq(schema.payment.id, paymentRecord.id));

                // 2. 유저 크레딧 충전
                if (paymentRecord.creditsGranted) {
                    await db.update(schema.user)
                        .set({
                            credits: sql`${schema.user.credits} + ${paymentRecord.creditsGranted}`
                        })
                        .where(eq(schema.user.id, paymentRecord.userId));
                }

                console.info(`[Coinbase] Payment COMPLETED: user=${paymentRecord.userId}, credits=${paymentRecord.creditsGranted}`);
            } catch (dbError) {
                console.error("DB Update failed during Coinbase webhook processing:", dbError);
                return Response.json({ error: "Internal Server Error" }, { status: 500 });
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Coinbase webhook error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
