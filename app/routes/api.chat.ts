import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";
import { streamAIResponse, generateSummary } from "~/lib/ai.server";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const chatSchema = z.object({
    message: z.string().optional().default(""),
    conversationId: z.string().uuid(),
    personality: z.enum(["idol", "lover", "hybrid", "roleplay"]).optional(),
    mediaUrl: z.string().optional().nullable().transform(val => val === "" ? null : val),
    characterId: z.string().optional().default("chunsim"),
}).refine(data => data.message || data.mediaUrl, {
    message: "Message or media is required",
    path: ["message"],
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

    const { message, conversationId, mediaUrl, characterId } = result.data;

    // 1. 대화 내역 및 사용자 정보 조회
    const [history, user] = await Promise.all([
        prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { bio: true },
        }),
    ]);

    // bio에서 페르소나 모드 및 기억(Summary) 파싱
    let personality: any = "hybrid";
    let memory: string = "";
    let bioData: any = {};

    if (user?.bio) {
        try {
            bioData = JSON.parse(user.bio);
            if (bioData.personaMode) personality = bioData.personaMode;
            if (bioData.memory) memory = bioData.memory;
        } catch (e) {
            console.error("Bio parsing error:", e);
        }
    }

    // 멀티모달 히스토리 구성
    const formattedHistory = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
    }));

    // SSE 스트리밍 설정
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let fullContent = "";

            try {
                // 스트리밍 실행 (기존 기억 및 미디어 포함)
                for await (const chunk of streamAIResponse(message, formattedHistory, personality, memory, mediaUrl, session.user.id, characterId)) {
                    fullContent += chunk;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                }

                // AI 응답 저장 (여러 개로 나누어 저장)
                const messageParts = fullContent.split('---').map(p => p.trim()).filter(p => p.length > 0);
                let lastSavedMessageId = "";

                for (const part of messageParts) {
                    const savedMessage = await prisma.message.create({
                        data: {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: part,
                            conversationId,
                            createdAt: new Date(),
                            type: "TEXT",
                        },
                    });
                    lastSavedMessageId = savedMessage.id;
                }

                // 대화 요약 고도화
                if (history.length >= 8) {
                    // 요약용 메시지 리스트도 멀티모달 고려 (단순화하여 텍스트만 전달하거나 Placeholder 사용)
                    const allMessagesForSummary: BaseMessage[] = [
                        ...formattedHistory.map(h => {
                            const content = h.content || (h.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");
                            return h.role === "user" ? new HumanMessage(content) : new AIMessage(content);
                        }),
                        new HumanMessage(message || (mediaUrl ? "이 사진(그림)을 확인해줘." : " ")),
                        new AIMessage(fullContent)
                    ];

                    const newSummary = await generateSummary(allMessagesForSummary);
                    if (newSummary) {
                        // bio에 기억 정보 업데이트
                        await prisma.user.update({
                            where: { id: session.user.id },
                            data: {
                                bio: JSON.stringify({
                                    ...bioData,
                                    memory: newSummary,
                                    lastMemoryUpdate: new Date().toISOString()
                                })
                            }
                        });
                    }
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, messageId: lastSavedMessageId })}\n\n`));
                controller.close();
            } catch (error) {
                console.error("Streaming error:", error);
                controller.error(error);
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
