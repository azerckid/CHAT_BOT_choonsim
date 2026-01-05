import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { ITEMS } from "~/lib/items";
import { z } from "zod";

const giftSchema = z.object({
    characterId: z.string(),
    itemId: z.string(),
    amount: z.number().min(1),
    message: z.string().optional(),
    conversationId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const result = giftSchema.safeParse(body);

    if (!result.success) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { characterId, itemId, amount, message, conversationId } = result.data;
    const item = Object.values(ITEMS).find(i => i.id === itemId);

    if (!item) {
        return Response.json({ error: "Item not found" }, { status: 404 });
    }

    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Check & Deduct from Inventory First
            const inventory = await tx.userInventory.findUnique({
                where: { userId_itemId: { userId: session.user.id, itemId } }
            });

            if (inventory && inventory.quantity >= amount) {
                // Use Inventory
                await tx.userInventory.update({
                    where: { userId_itemId: { userId: session.user.id, itemId } },
                    data: { quantity: { decrement: amount } }
                });
            } else {
                throw new Error("Insufficient hearts");
            }

            // 3. Update CharacterStat
            await tx.characterStat.upsert({
                where: { characterId },
                create: {
                    characterId,
                    totalHearts: amount,
                    totalUniqueGivers: 1,
                    lastGiftAt: new Date(),
                },
                update: {
                    totalHearts: { increment: amount },
                    lastGiftAt: new Date(),
                },
            });

            // 4. Create GiftLog
            const giftLog = await tx.giftLog.create({
                data: {
                    id: crypto.randomUUID(),
                    fromUserId: session.user.id,
                    toCharacterId: characterId,
                    itemId,
                    amount,
                    message,
                    createdAt: new Date(),
                },
            });

            // 5. Create a system message for the chat to acknowledge the gift
            const systemMsg = await tx.message.create({
                data: {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `💝 **${session.user.name || "사용자"}**님이 하트 **${amount}**개를 선물했습니다!`,
                    conversationId,
                    type: "TEXT",
                    createdAt: new Date(),
                }
            });

            // 6. Update mission progress (Gift missions)
            const giftMissions = await tx.mission.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { title: { contains: "Gift" } },
                        { title: { contains: "Heart" } },
                        { title: { contains: "선물" } },
                        { description: { contains: "gift" } }
                    ]
                }
            });

            for (const mission of giftMissions) {
                const userMission = await tx.userMission.findUnique({
                    where: { userId_missionId: { userId: session.user.id, missionId: mission.id } }
                });

                if (!userMission || (userMission.status === "IN_PROGRESS" && userMission.progress < 100)) {
                    const newProgress = Math.min((userMission?.progress || 0) + 25, 100);
                    await tx.userMission.upsert({
                        where: { userId_missionId: { userId: session.user.id, missionId: mission.id } },
                        create: {
                            userId: session.user.id,
                            missionId: mission.id,
                            progress: newProgress,
                            status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS"
                        },
                        update: {
                            progress: newProgress,
                            status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS"
                        }
                    });
                }
            }

            return Response.json({ success: true, giftLog, systemMsg });
        });
    } catch (error: any) {
        console.error("Gifting transaction error:", error);
        if (error.message === "Insufficient hearts") {
            return Response.json({ error: "Insufficient hearts" }, { status: 400 });
        }
        return Response.json({ error: "Gifting failed" }, { status: 500 });
    }
}
