import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";
import { streamAIResponse, generateSummary, extractPhotoMarker } from "~/lib/ai.server";
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
                // 1단계: AI 응답을 먼저 전체 받기 (화면에 표시하지 않음)
                for await (const chunk of streamAIResponse(message, formattedHistory, personality, memory, mediaUrl, session.user.id, characterId)) {
                    fullContent += chunk;
                }

                // 2단계: 전체 응답을 ---로 나누기 (없으면 적당한 길이로 강제로 나누기)
                let messageParts = fullContent.split('---').map(p => p.trim()).filter(p => p.length > 0);
                
                // ---가 없거나 하나만 있으면 적당한 길이로 강제로 나누기
                if (messageParts.length <= 1 && fullContent.length > 100) {
                    const chunkSize = 80; // 한 말풍선당 약 80자
                    messageParts = [];
                    let currentPart = "";
                    
                    const sentences = fullContent.split(/[.!?。！？]\s*/).filter(s => s.trim());
                    
                    for (const sentence of sentences) {
                        if ((currentPart + sentence).length > chunkSize && currentPart) {
                            messageParts.push(currentPart.trim());
                            currentPart = sentence;
                        } else {
                            currentPart += (currentPart ? " " : "") + sentence;
                        }
                    }
                    if (currentPart.trim()) {
                        messageParts.push(currentPart.trim());
                    }
                }

                // 3단계: 각 말풍선을 하나씩 순차적으로 스트리밍
                for (let i = 0; i < messageParts.length; i++) {
                    const part = messageParts[i];
                    
                    // 첫 번째 메시지에만 사진 마커 체크
                    const { content: cleanedContent, photoUrl } = i === 0 
                        ? extractPhotoMarker(part, characterId) 
                        : { content: part, photoUrl: null };

                    // 한 글자씩 스트리밍
                    for (const char of cleanedContent) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: char })}\n\n`));
                        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms 딜레이
                    }

                    // 메시지 저장 및 완료 신호
                    const savedMessage = await prisma.message.create({
                        data: {
                            id: crypto.randomUUID(),
                            role: "assistant",
                            content: cleanedContent,
                            conversationId,
                            createdAt: new Date(),
                            type: "TEXT",
                            mediaUrl: photoUrl,
                            mediaType: photoUrl ? "image" : null,
                        },
                    });

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ messageComplete: true, messageId: savedMessage.id })}\n\n`));
                    
                    // 다음 말풍선 전에 약간의 딜레이
                    if (i < messageParts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300)); // 말풍선 사이 300ms 딜레이
                    }
                }

                // 모든 스트리밍 완료 신호
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));

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
