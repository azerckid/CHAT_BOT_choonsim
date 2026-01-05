import type { ActionFunctionArgs } from "react-router";
import { db } from "~/lib/db.server";
import { generateProactiveMessage } from "~/lib/ai.server";
import * as schema from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;

    if (!userId) {
        return Response.json({ error: "userId is required" }, { status: 400 });
    }

    try {
        const user = await db.query.user.findFirst({
            where: eq(schema.user.id, userId),
            columns: { id: true, name: true, bio: true },
        });

        if (!user) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        // 1. 해당 사용자의 대화방 찾기 (가장 최근 대화방 사용)
        let conversation = await db.query.conversation.findFirst({
            where: eq(schema.conversation.userId, user.id),
            orderBy: [desc(schema.conversation.updatedAt)],
        });

        if (!conversation) {
            const [newConversation] = await db.insert(schema.conversation).values({
                id: crypto.randomUUID(),
                title: "춘심이와의 대화 (자동 생성)",
                userId: user.id,
                updatedAt: new Date(),
            }).returning();
            conversation = newConversation;
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
        const [savedMessage] = await db.insert(schema.message).values({
            id: crypto.randomUUID(),
            role: "assistant",
            content: messageContent,
            conversationId: conversation.id,
            createdAt: new Date(),
        }).returning();

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

