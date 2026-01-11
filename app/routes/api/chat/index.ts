import { db } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";
import { streamAIResponse, generateSummary, extractPhotoMarker, extractEmotionMarker } from "~/lib/ai.server";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { logger } from "~/lib/logger.server";
import * as schema from "~/db/schema";
import { eq, and, sql, desc, gte, count } from "drizzle-orm";
import { createX402Invoice, createX402Response } from "~/lib/near/x402.server";
import { checkSilentPaymentAllowance } from "~/lib/near/silent-payment.server";

const chatSchema = z.object({
    message: z.string().optional().default(""),
    conversationId: z.string().uuid(),
    personality: z.enum(["idol", "lover", "hybrid", "roleplay"]).optional(),
    mediaUrl: z.string().optional().nullable().transform(val => val === "" ? null : val),
    characterId: z.string().optional().default("chunsim"),
    giftContext: z.object({
        amount: z.number(),
        itemId: z.string(),
    }).optional(),
}).refine(data => data.message || data.mediaUrl || data.giftContext, {
    message: "Message, media or gift is required",
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

    const { message, conversationId, mediaUrl, characterId, giftContext } = result.data;

    // 1. 대화 내역 및 사용자 정보 조회
    const [history, currentUser] = await Promise.all([
        db.query.message.findMany({
            where: eq(schema.message.conversationId, conversationId),
            orderBy: [desc(schema.message.createdAt)],
            limit: 10,
        }),
        db.query.user.findFirst({
            where: eq(schema.user.id, session.user.id),
            columns: { id: true, bio: true, subscriptionTier: true, credits: true, nearAccountId: true },
        }),
    ]);

    // **X402 결제 체크**
    const MIN_REQUIRED_CREDITS = 10;
    if (!currentUser || (currentUser.credits ?? 0) < MIN_REQUIRED_CREDITS) {
        // 1. 인보이스 생성 ($0.01 = 약 100 Credits, 마이크로 페이먼트 단위)
        const amountToChargeUSD = 0.01;

        // 2. Silent Payment 한도 확인
        const allowance = await checkSilentPaymentAllowance(
            session.user.id,
            amountToChargeUSD
        );

        // 3. 한도 내 자동 결제 가능 여부를 헤더에 포함
        // 클라이언트 인터셉터가 이를 확인하여 자동 결제를 시도할 수 있음
        const { token, invoice } = await createX402Invoice(session.user.id, amountToChargeUSD);

        // 4. 402 Payment Required 응답 반환 (한도 정보 포함)
        const response = createX402Response(token, invoice);

        // 한도 정보를 헤더에 추가
        if (allowance.canAutoPay) {
            response.headers.set("X-x402-Allowance", JSON.stringify({
                canAutoPay: true,
                remainingAllowance: allowance.remainingAllowance,
            }));
        }

        return response;
    }

    // bio에서 페르소나 모드 및 기억(Summary) 파싱
    let personality: any = "hybrid";
    let memory: string = "";
    let bioData: any = {};

    if (currentUser?.bio) {
        try {
            bioData = JSON.parse(currentUser.bio);
            if (bioData.personaMode) personality = bioData.personaMode;
            if (bioData.memory) memory = bioData.memory;
        } catch (e) {
            console.error("Bio parsing error:", e);
        }
    }

    // 1.5 선물 연속성 확인 (최근 10분 이내 선물 횟수 조회)
    let giftCountInSession = 0;
    if (giftContext) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const [giftCountRes] = await db.select({ value: count() })
            .from(schema.giftLog)
            .where(and(
                eq(schema.giftLog.fromUserId, session.user.id),
                eq(schema.giftLog.toCharacterId, characterId),
                gte(schema.giftLog.createdAt, tenMinutesAgo)
            ));

        giftCountInSession = (giftCountRes?.value ?? 0) + 1;
    }

    // 멀티모달 히스토리 구성
    const formattedHistory = [...history].reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        isInterrupted: msg.isInterrupted,
    }));

    // SSE 스트리밍 설정
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            let fullContent = "";
            let isAborted = false;

            const abortHandler = () => {
                isAborted = true;
                controller.close();
            };
            request.signal.addEventListener("abort", abortHandler);

            try {
                // (이전 단계에서 이미 체크되었으므로 생략 가능하나, 스트림 내 보조 에러 메시지로 유지)
                if (!currentUser || (currentUser.credits ?? 0) < MIN_REQUIRED_CREDITS) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Insufficient credits", code: 402 })}\n\n`));
                    controller.close();
                    return;
                }

                // 2단계: AI 응답 스트리밍 및 토큰 사용량 집계
                const subscriptionTier = (currentUser?.subscriptionTier as any) || "FREE";
                let tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | null = null;

                for await (const item of streamAIResponse(
                    message,
                    formattedHistory,
                    personality,
                    memory,
                    mediaUrl,
                    session.user.id,
                    characterId,
                    subscriptionTier,
                    giftContext ? { ...giftContext, countInSession: giftCountInSession } : undefined,
                    request.signal // AbortSignal 전달
                )) {
                    if (isAborted) break;

                    if (item.type === 'content') {
                        fullContent += item.content;
                    } else if (item.type === 'usage' && item.usage) {
                        tokenUsage = item.usage;
                    }
                }

                if (isAborted) {
                    return;
                }

                // 3단계. 토큰 사용량에 따른 크레딧 차감 (스트리밍 완료 후)
                if (tokenUsage && tokenUsage.totalTokens > 0) {
                    try {
                        await db.update(schema.user)
                            .set({ credits: sql`${schema.user.credits} - ${tokenUsage.totalTokens}` })
                            .where(eq(schema.user.id, session.user.id));

                        logger.info({
                            category: "API",
                            message: `Deducted ${tokenUsage.totalTokens} credits for user ${session.user.id}`,
                            metadata: { tokenUsage }
                        });
                    } catch (err) {
                        logger.error({
                            category: "DB",
                            message: `Failed to deduct credits for user ${session.user.id}`,
                            stackTrace: (err as Error).stack
                        });
                    }
                }

                // 만약 AI 응답이 완전히 비어있는 경우 (세이프티 필터 등에 의해 차단된 경우) 폴백 메시지 설정
                if (!fullContent.trim()) {
                    fullContent = "[EMOTION:THINKING] 음... 그건 잘 모르겠지만 자기는 어떻게 생각해? ㅎㅎ 우리 다른 재미있는 이야기 하자!";
                }

                // 전체 응답에서 사진 마커 먼저 추출
                const firstPhotoMarker = await extractPhotoMarker(fullContent, characterId);
                const photoUrl = firstPhotoMarker.photoUrl;
                const contentWithoutPhotoMarker = photoUrl ? firstPhotoMarker.content : fullContent;

                // 2단계: 전체 응답을 ---로 나누기
                let messageParts = contentWithoutPhotoMarker.split('---').map(p => p.trim()).filter(p => p.length > 0);

                if (messageParts.length <= 1 && contentWithoutPhotoMarker.length > 100) {
                    const chunkSize = 80;
                    messageParts = [];
                    let currentPart = "";
                    const sentences = contentWithoutPhotoMarker.split(/[.!?。！？]\s*/).filter(s => s.trim());

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
                    const emotionMarker = extractEmotionMarker(part);
                    const emotionCode = emotionMarker.emotion;
                    const finalContent = emotionMarker.content;

                    if (emotionCode) {
                        let expiresAt: Date | null = null;
                        if (giftContext) {
                            const amount = giftContext.amount;
                            const durationMinutes = amount >= 100 ? 30 : amount >= 50 ? 15 : amount >= 10 ? 5 : 1;
                            expiresAt = new Date(Date.now() + durationMinutes * 60000);
                        }

                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            emotion: emotionCode,
                            expiresAt: expiresAt?.toISOString()
                        })}\n\n`));

                        // DB 업데이트 (비동기)
                        db.insert(schema.characterStat)
                            .values({
                                id: crypto.randomUUID(),
                                characterId,
                                currentEmotion: emotionCode,
                                emotionExpiresAt: expiresAt,
                                updatedAt: new Date(),
                            })
                            .onConflictDoUpdate({
                                target: [schema.characterStat.characterId],
                                set: {
                                    currentEmotion: emotionCode,
                                    emotionExpiresAt: expiresAt || undefined,
                                    updatedAt: new Date(),
                                }
                            }).catch(err => console.error("Failed to update emotion:", err));
                    }

                    if (i === 0 && photoUrl) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ mediaUrl: photoUrl })}\n\n`));
                    }

                    for (const char of finalContent) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: char })}\n\n`));
                        const randomDelay = Math.floor(Math.random() * (120 - 40 + 1)) + 40;
                        await new Promise(resolve => setTimeout(resolve, randomDelay));
                    }

                    // 메시지 저장
                    const [savedMessage] = await db.insert(schema.message).values({
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: finalContent,
                        conversationId,
                        createdAt: new Date(),
                        type: "TEXT",
                        mediaUrl: (i === 0 && photoUrl) ? photoUrl : null,
                        mediaType: (i === 0 && photoUrl) ? "image" : null,
                    }).returning();

                    if (i === 0 && savedMessage) {
                        try {
                            const usage = tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
                            await db.insert(schema.agentExecution).values({
                                id: crypto.randomUUID(),
                                messageId: savedMessage.id,
                                agentName: `gemini-2.0-flash-${characterId}`,
                                intent: personality || "hybrid",
                                promptTokens: usage.promptTokens,
                                completionTokens: usage.completionTokens,
                                totalTokens: usage.totalTokens,
                                createdAt: new Date(),
                            });
                        } catch (executionError) {
                            console.error("Failed to save AgentExecution:", executionError);
                        }
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ messageComplete: true, messageId: savedMessage?.id, mediaUrl: (i === 0 && photoUrl) ? photoUrl : null })}\n\n`));

                    if (i < messageParts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }

                // 스트리밍 완료 시 토큰 사용량 정보 전송
                const usage = tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, usage })}\n\n`));

                // 대화 요약 고도화
                if (history.length >= 8) {
                    const allMessagesForSummary: BaseMessage[] = [
                        ...formattedHistory.map(h => {
                            let content = h.content || (h.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");
                            if (h.role === "assistant" && h.isInterrupted && content.endsWith("...")) {
                                content = content.slice(0, -3).trim();
                            }
                            return h.role === "user" ? new HumanMessage(content) : new AIMessage(content);
                        }),
                        new HumanMessage(message || (mediaUrl ? "이 사진(그림)을 확인해줘." : " ")),
                        new AIMessage(fullContent)
                    ];

                    const newSummary = await generateSummary(allMessagesForSummary);
                    if (newSummary) {
                        await db.update(schema.user)
                            .set({
                                bio: JSON.stringify({
                                    ...bioData,
                                    memory: newSummary,
                                    lastMemoryUpdate: new Date().toISOString()
                                }),
                                updatedAt: new Date()
                            })
                            .where(eq(schema.user.id, session.user.id));
                    }
                }

                controller.close();
            } catch (error) {
                logger.error({
                    category: "API",
                    message: "Streaming error in chat API",
                    stackTrace: (error as Error).stack,
                    metadata: { conversationId, characterId }
                });
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
