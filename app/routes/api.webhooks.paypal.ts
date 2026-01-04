
import { type ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";
import { verifyWebhookSignature } from "~/lib/paypal.server";
import { SUBSCRIPTION_PLANS } from "~/lib/subscription-plans";
import { DateTime } from "luxon";

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // 1. 요청 파싱
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const headers = Object.fromEntries(request.headers);

    // 2. Webhook 서명 검증
    // 주의: 헤더 이름은 소문자로 변환되어 들어올 수 있으므로, verifyWebhookSignature 함수에서 처리 시 주의 필요
    // 여기서는 헤더 전체를 넘겨서 처리
    const isValid = await verifyWebhookSignature(headers as any, body);

    if (!isValid) {
        console.error("Invalid Webhook Signature");
        return new Response("Invalid Signature", { status: 400 });
    }

    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType}`);

    try {
        switch (eventType) {
            case "BILLING.SUBSCRIPTION.PAYMENT.SUCCEEDED": {
                // 구독 갱신 결제 성공
                const subscriptionId = resource.billing_agreement_id;
                const transactionId = resource.id;
                const amount = resource.amount.total;

                // 1. 사용자 찾기
                const user = await prisma.user.findFirst({
                    where: { subscriptionId },
                });

                if (!user) {
                    console.warn(`User not found for subscription: ${subscriptionId}`);
                    return new Response("User Not Found", { status: 200 }); // 200 OK to stop retries
                }

                // 2. 중복 처리 방지 (이미 처리된 트랜잭션인지 확인)
                const existingPayment = await prisma.payment.findUnique({
                    where: { transactionId },
                });

                if (existingPayment) {
                    console.log(`Transaction ${transactionId} already processed.`);
                    return new Response("Already Processed", { status: 200 });
                }

                // 3. 플랜 정보 가져오기 & 크레딧 계산
                const planKey = user.subscriptionTier as keyof typeof SUBSCRIPTION_PLANS;
                const plan = SUBSCRIPTION_PLANS[planKey];

                // 만약 티어가 유효하지 않다면 보수적으로 처리 (크레딧 미지급)
                const creditsToAdd = plan ? plan.creditsPerMonth : 0;

                // 4. 다음 결제일 계산 (대략 한 달 뒤)
                // 정확한 건 resource에 'next_billing_date'가 없을 수도 있으니 Luxon으로 계산
                const nextBillingDate = DateTime.now().plus({ months: 1 }).toJSDate();

                // 5. 트랜잭션 실행
                await prisma.$transaction([
                    prisma.payment.create({
                        data: {
                            userId: user.id,
                            amount: parseFloat(amount),
                            currency: resource.amount.currency,
                            status: "COMPLETED",
                            type: "SUBSCRIPTION_RENEWAL",
                            provider: "PAYPAL",
                            transactionId: transactionId,
                            subscriptionId: subscriptionId,
                            description: `Subscription Renewal: ${user.subscriptionTier}`,
                            creditsGranted: creditsToAdd > 0 ? creditsToAdd : undefined,
                            metadata: JSON.stringify(resource), // 디버깅용 전체 데이터 저장
                        },
                    }),
                    prisma.user.update({
                        where: { id: user.id },
                        data: {
                            credits: { increment: Math.max(0, creditsToAdd) },
                            lastTokenRefillAt: new Date(),
                            currentPeriodEnd: nextBillingDate,
                            subscriptionStatus: "ACTIVE", // 혹시 정지 상태였다면 활성화
                        },
                    }),
                ]);

                console.log(`[Subscription Renewal] Success for user ${user.id}. Added ${creditsToAdd} credits.`);
                break;
            }

            case "BILLING.SUBSCRIPTION.CANCELLED": {
                const subscriptionId = resource.id;

                await prisma.user.updateMany({
                    where: { subscriptionId },
                    data: { subscriptionStatus: "CANCELLED" },
                });
                console.log(`[Subscription Cancelled] Subscription ${subscriptionId} cancelled.`);
                break;
            }

            case "BILLING.SUBSCRIPTION.SUSPENDED": {
                const subscriptionId = resource.id;

                await prisma.user.updateMany({
                    where: { subscriptionId },
                    data: { subscriptionStatus: "SUSPENDED" },
                });
                console.log(`[Subscription Suspended] Subscription ${subscriptionId} suspended.`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }
    } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response("Internal Server Error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
}
