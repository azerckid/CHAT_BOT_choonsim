import type { ActionFunctionArgs } from "react-router";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import { CHARACTERS } from "~/lib/characters";

const createChatSchema = z.object({
    characterId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    // POST 요청만 허용
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const body = await request.json();
        const result = createChatSchema.safeParse(body);

        if (!result.success) {
            return Response.json({ error: "Invalid character ID" }, { status: 400 });
        }

        const { characterId } = result.data;

        // 존재하는 캐릭터인지 확인
        const character = CHARACTERS[characterId];
        if (!character) {
            return Response.json({ error: "Character not found" }, { status: 404 });
        }

        // 이미 존재하는 대화방이 있는지 확인
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                userId: session.user.id,
                characterId: characterId,
            },
        });

        if (existingConversation) {
            return Response.json({ conversationId: existingConversation.id });
        }

        // 새 대화방 생성
        const newConversation = await prisma.conversation.create({
            data: {
                id: crypto.randomUUID(),
                userId: session.user.id,
                characterId: characterId,
                title: character.name,
            },
        });

        return Response.json({ conversationId: newConversation.id });

    } catch (error) {
        console.error("Create chat error:", error);
        return Response.json({ error: "Failed to create chat" }, { status: 500 });
    }
}

