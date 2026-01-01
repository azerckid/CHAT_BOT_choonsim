import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";
import { generateProactiveMessage } from "~/lib/ai.server";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    if (!userId) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, bio: true }
        });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        // 1. 해당 사용자의 대화방 찾기 (가장 최근 대화방 사용)
        let conversation = await prisma.conversation.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    id: crypto.randomUUID(),
                    title: "춘심이와의 대화 (자동 생성)",
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

        // 3. 메시지 저장
        const savedMessage = await prisma.message.create({
            data: {
                id: crypto.randomUUID(),
                role: "assistant",
                content: messageContent,
                conversationId: conversation.id,
                createdAt: new Date(),
            }
        });

        return Response.json({
            success: true,
            message: "Proactive message triggered successfully",
            content: messageContent,
            messageId: savedMessage.id
        });
    } catch (error) {
        console.error("Test Cron Error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
