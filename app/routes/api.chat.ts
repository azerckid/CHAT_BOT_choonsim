import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";
import { streamAIResponse, generateSummary } from "~/lib/ai.server";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

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

    const { message, conversationId } = result.data;

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

    const formattedHistory = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    // SSE 스트리밍 설정
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let fullContent = "";

            try {
                // 스트리밍 실행 (기존 기억 포함)
                for await (const chunk of streamAIResponse(message, formattedHistory, personality, memory)) {
                    fullContent += chunk;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
                }

                // AI 응답 저장
                const savedMessage = await prisma.message.create({
                    data: {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: fullContent,
                        conversationId,
                        createdAt: new Date(),
                        type: "TEXT",
                    },
                });

                // 대화 요약 고도화 (3.3.4): 일정 수 이상의 메시지가 쌓이면 요약본 갱신
                if (history.length >= 8) {
                    const allMessagesForSummary: BaseMessage[] = [
                        ...formattedHistory.map(h => h.role === "user" ? new HumanMessage(h.content) : new AIMessage(h.content)),
                        new HumanMessage(message),
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

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, messageId: savedMessage.id })}\n\n`));
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
