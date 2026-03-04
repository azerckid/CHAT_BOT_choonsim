/**
 * AI 채팅 스트리밍 훅
 * - startAiStreaming: SSE 스트림 연결 및 파싱
 * - saveInterruptedMessage: 중단된 메시지 저장
 */
import { useRef, useCallback } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Message } from "~/lib/chat/types";

interface UseChatStreamOptions {
    conversationId: string;
    characterId: string | undefined;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setIsAiStreaming: (v: boolean) => void;
    setIsOptimisticTyping: (v: boolean) => void;
    setStreamingContent: React.Dispatch<React.SetStateAction<string>>;
    setStreamingMediaUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setCurrentEmotion: (v: string) => void;
    setEmotionExpiresAt: (v: string | null) => void;
    setPaywallTrigger: (v: string | null) => void;
    setCurrentUserChocoBalance: React.Dispatch<React.SetStateAction<number>>;
    setLastOptimisticDeduction: (v: number) => void;
    setChocoChange: (v: number | undefined) => void;
    optimisticIntervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    lastOptimisticDeductionRef: React.MutableRefObject<number>;
    abortControllerRef: React.MutableRefObject<AbortController | null>;
}

export function useChatStream(opts: UseChatStreamOptions) {
    const {
        conversationId,
        characterId,
        setMessages,
        setIsAiStreaming,
        setIsOptimisticTyping,
        setStreamingContent,
        setStreamingMediaUrl,
        setCurrentEmotion,
        setEmotionExpiresAt,
        setPaywallTrigger,
        setCurrentUserChocoBalance,
        setLastOptimisticDeduction,
        setChocoChange,
        optimisticIntervalRef,
        lastOptimisticDeductionRef,
        abortControllerRef,
    } = opts;

    const revalidator = useRevalidator();

    const saveInterruptedMessage = useCallback(async (content: string, mediaUrl: string | null) => {
        try {
            await fetch("/api/chat/interrupt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, content, mediaUrl }),
            });
        } catch (e) {
            console.error("Failed to save interrupted message:", e);
        }
    }, [conversationId]);

    const startAiStreaming = useCallback(async (
        userMessage: string,
        mediaUrl?: string,
        giftContext?: { amount: number; itemId: string }
    ) => {
        setIsAiStreaming(true);
        setStreamingContent("");
        setStreamingMediaUrl(null);

        try {
            if (abortControllerRef.current) abortControllerRef.current.abort();

            if (optimisticIntervalRef.current) {
                clearInterval(optimisticIntervalRef.current);
                optimisticIntervalRef.current = null;
            }
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    message: userMessage,
                    conversationId,
                    mediaUrl,
                    characterId,
                    giftContext
                }),
            });

            if (response.status === 402) return;
            if (!response.ok) throw new Error("AI 응답 요청 실패");

            setIsOptimisticTyping(false);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let currentMessageContent = "";

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.error && data.code === 402) {
                                    toast.error("CHOCO 잔액이 부족합니다.", {
                                        action: { label: "CHOCO 충전하기", onClick: () => window.location.href = "/profile/subscription" },
                                    });
                                    setIsAiStreaming(false);
                                    setIsOptimisticTyping(false);
                                    if (optimisticIntervalRef.current) {
                                        clearInterval(optimisticIntervalRef.current);
                                        optimisticIntervalRef.current = null;
                                    }
                                    if (lastOptimisticDeductionRef.current > 0) {
                                        setCurrentUserChocoBalance((p) => p + lastOptimisticDeductionRef.current);
                                        setLastOptimisticDeduction(0);
                                    }
                                    return;
                                }

                                if (data.emotion) setCurrentEmotion(data.emotion);
                                if (data.expiresAt) setEmotionExpiresAt(data.expiresAt);

                                if (data.text) {
                                    currentMessageContent += data.text;
                                    setStreamingContent(prev => prev + data.text);
                                }

                                if (data.messageComplete) {
                                    const completedMessage: Message = {
                                        id: data.messageId || crypto.randomUUID(),
                                        role: "assistant",
                                        content: currentMessageContent,
                                        mediaUrl: data.mediaUrl || null,
                                        createdAt: new Date().toISOString(),
                                        isLiked: false,
                                    };
                                    setMessages(prev => [...prev, completedMessage]);
                                    setStreamingContent("");
                                    setStreamingMediaUrl(null);
                                    currentMessageContent = "";
                                }

                                if (data.mediaUrl && !data.messageComplete) {
                                    setStreamingMediaUrl(data.mediaUrl);
                                }

                                if (data.paywallTrigger) {
                                    setPaywallTrigger(data.paywallTrigger);
                                }

                                if (data.done) {
                                    setIsAiStreaming(false);

                                    if (optimisticIntervalRef.current) {
                                        clearInterval(optimisticIntervalRef.current);
                                        optimisticIntervalRef.current = null;
                                    }

                                    if (data.usage && data.usage.totalTokens) {
                                        const actualCost = Math.ceil(data.usage.totalTokens / 100);
                                        const adjustment = lastOptimisticDeductionRef.current - actualCost;
                                        setCurrentUserChocoBalance((prev: number) => Math.max(0, prev + adjustment));
                                        setChocoChange(-actualCost);
                                        setTimeout(() => setChocoChange(undefined), 2000);
                                        setLastOptimisticDeduction(0);
                                        revalidator.revalidate();
                                    } else {
                                        setTimeout(() => {
                                            setChocoChange(undefined);
                                            setLastOptimisticDeduction(0);
                                            revalidator.revalidate();
                                        }, 2000);
                                    }
                                }
                            } catch {
                                // SSE parse error — ignore
                            }
                        }
                    }
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                return;
            }
            console.error("Streaming error:", err);
            toast.error("답변을 가져오는 중 오류가 발생했습니다.");
            setIsAiStreaming(false);
            setIsOptimisticTyping(false);

            if (optimisticIntervalRef.current) {
                clearInterval(optimisticIntervalRef.current);
                optimisticIntervalRef.current = null;
            }

            if (lastOptimisticDeductionRef.current > 0) {
                setCurrentUserChocoBalance((prev: number) => prev + lastOptimisticDeductionRef.current);
                const rolledBack = lastOptimisticDeductionRef.current;
                setLastOptimisticDeduction(0);
                setChocoChange(rolledBack);
                setTimeout(() => setChocoChange(undefined), 2000);
            }

            setStreamingContent(prev => {
                if (prev) {
                    const partialMsg: Message = {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        content: prev + "...",
                        createdAt: new Date().toISOString(),
                    };
                    setMessages(msgs => [...msgs, partialMsg]);
                }
                return "";
            });
        }
    }, [
        conversationId, characterId, abortControllerRef, optimisticIntervalRef,
        lastOptimisticDeductionRef, setIsAiStreaming, setIsOptimisticTyping,
        setStreamingContent, setStreamingMediaUrl, setCurrentEmotion, setEmotionExpiresAt,
        setPaywallTrigger, setMessages, setCurrentUserChocoBalance, setLastOptimisticDeduction,
        setChocoChange, revalidator,
    ]);

    return { startAiStreaming, saveInterruptedMessage };
}
