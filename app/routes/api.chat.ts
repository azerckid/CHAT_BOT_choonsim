import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";

const chatSchema = z.object({
    message: z.string().min(1),
    conversationId: z.string().uuid(),
    personality: z.enum(["idol", "lover", "hybrid", "roleplay"]).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();
    const result = chatSchema.safeParse(body);

    if (!result.success) {
        return Response.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { message, conversationId, personality } = result.data;

    // TODO: Phase 3 - LangGraph & Gemini 연동
    // 지금은 단순히 에코 응답이나 하드코딩된 응답을 저장합니다.

    const aiResponse = "어? 왔어? 반가워! (AI 응답 준비 중...)";

    const savedMessage = await prisma.message.create({
        data: {
            id: crypto.randomUUID(),
            role: "assistant",
            content: aiResponse,
            conversationId,
            createdAt: new Date(),
            type: "TEXT",
        },
    });

    return Response.json({ message: savedMessage });
}
