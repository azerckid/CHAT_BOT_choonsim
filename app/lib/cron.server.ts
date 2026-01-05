import cron from "node-cron";
import { prisma } from "./db.server";
import { generateProactiveMessage } from "./ai.server";
import { DateTime } from "luxon";
import webpush from "web-push";
import { logger } from "./logger.server";

// VAPID 키 설정
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY!,
    privateKey: process.env.VAPID_PRIVATE_KEY!
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        "mailto:example@yourdomain.com",
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

async function sendPushNotification(user: { name: string | null, pushSubscription: string | null }, content: string) {
    if (!user.pushSubscription) return;

    try {
        const subscription = JSON.parse(user.pushSubscription);
        const payload = JSON.stringify({
            title: "춘심이의 메시지",
            body: content,
            url: "/chats"
        });

        await webpush.sendNotification(subscription, payload);
    } catch (error) {
        logger.error({
            category: "SYSTEM",
            message: `Push Notification Error for ${user.name}`,
            stackTrace: (error as Error).stack
        });
    }
}

export function initCronJobs() {
    logger.info({ category: "SYSTEM", message: "Initializing Cron Jobs..." });

    // 1. Proactive Message Check (Every Minute)
    cron.schedule("* * * * *", async () => {
        const now = DateTime.now().setZone("Asia/Seoul").toFormat("HH:mm");

        try {
            const usersToCheckIn = await prisma.user.findMany({
                where: { checkInTime: now },
                select: { id: true, name: true, bio: true, pushSubscription: true },
            });

            if (usersToCheckIn.length > 0) {
                logger.info({
                    category: "SYSTEM",
                    message: `Starting proactive message delivery for ${usersToCheckIn.length} users`
                });
            }

            for (const user of usersToCheckIn) {
                // ... (existing logic)
                let conversation = await prisma.conversation.findFirst({
                    where: { userId: user.id },
                    orderBy: { updatedAt: 'desc' }
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
                    await sendPushNotification(user, part);
                    if (messageParts.length > 1) await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            if (usersToCheckIn.length > 0) {
                logger.audit({ category: "SYSTEM", message: `Successfully delivered proactive messages to ${usersToCheckIn.length} users` });
            }
        } catch (error) {
            logger.error({
                category: "SYSTEM",
                message: "Proactive Message Cron Error",
                stackTrace: (error as Error).stack
            });
        }
    });

    // 2. Daily Credit Refill (Every night at 00:00)
    cron.schedule("0 0 * * *", async () => {
        logger.audit({ category: "SYSTEM", message: "Starting Daily Credit Refill job..." });
        try {
            // Basic logic: Reset/Refill daily credits for eligible users
            // Here we just log it as an example of a cron monitorable task
            const result = await prisma.user.updateMany({
                where: { subscriptionTier: "FREE" },
                data: { credits: { set: 500 } } // Example: Reset free users to 500 credits daily
            });
            logger.audit({ category: "SYSTEM", message: `Daily Credit Refill completed for ${result.count} users` });
        } catch (error) {
            logger.error({
                category: "SYSTEM",
                message: "Credit Refill Cron Error",
                stackTrace: (error as Error).stack
            });
        }
    });
}
