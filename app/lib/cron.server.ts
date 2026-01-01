import cron from "node-cron";
import { prisma } from "./db.server";
import { generateProactiveMessage } from "./ai.server";
import { DateTime } from "luxon";
import webpush from "web-push";

// VAPID 키 설정
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!
};

webpush.setVapidDetails(
    "mailto:example@yourdomain.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

async function sendPushNotification(user: { name: string | null, pushSubscription: string | null }, content: string) {
    if (!user.pushSubscription) return;

    try {
        const subscription = JSON.parse(user.pushSubscription);
        const payload = JSON.stringify({
            title: "춘심이의 메시지",
            body: content,
            url: "/chats" // 클릭 시 이동할 경로
        });

        await webpush.sendNotification(subscription, payload);
        console.log(`Push notification sent to ${user.name}`);
    } catch (error) {
        console.error("Push Notification Error:", error);
    }
}

export function initCronJobs() {
    console.log("Initializing Cron Jobs...");

    // 매 분마다 체크
    cron.schedule("* * * * *", async () => {
        const now = DateTime.now().setZone("Asia/Seoul").toFormat("HH:mm");
        console.log(`Checking for check-ins at ${now}`);

        try {
            const usersToCheckIn = await prisma.user.findMany({
                where: {
                    checkInTime: now,
                },
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    pushSubscription: true,
                },
            });

            for (const user of usersToCheckIn) {
                console.log(`Sending proactive message to ${user.name}`);

                // 1. 해당 사용자의 대화방 찾기 (가장 최근 대화방 사용)
                let conversation = await prisma.conversation.findFirst({
                    where: {
                        userId: user.id
                    },
                    orderBy: {
                        updatedAt: 'desc'
                    }
                });

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            id: crypto.randomUUID(),
                            title: "춘심이와의 대화",
                            userId: user.id,
                            updatedAt: new Date(),
                        }
                    });
                }

                // 2. 메시지 생성
                let memory = "";
                let personaMode: any = "hybrid";
                if (user.bio) {
                    try {
                        const bioData = JSON.parse(user.bio);
                        memory = bioData.memory || "";
                        personaMode = bioData.personaMode || "hybrid";
                    } catch (e) { }
                }

                const messageContent = await generateProactiveMessage(user.name || "친구", memory, personaMode);

                // 3. 메시지 저장 및 전송 (여러 개로 나누어 보내기)
                const messageParts = messageContent.split('---').map(p => p.trim()).filter(p => p.length > 0);

                for (const part of messageParts) {
                    await prisma.message.create({
                        data: {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: part,
                            conversationId: conversation.id,
                            createdAt: new Date(),
                        }
                    });

                    // 4. 푸시 알림 발송
                    await sendPushNotification(user, part);

                    console.log(`Part sent to ${user.name}: ${part}`);

                    // 자연스러운 느낌을 위해 약간의 딜레이
                    if (messageParts.length > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }
            }
        } catch (error) {
            console.error("Cron Job Error:", error);
        }
    });
}
