import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher, useRevalidator, Link } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";

import { auth } from "~/lib/auth.server";
import { type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ItemStoreModal } from "~/components/payment/ItemStoreModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

type LoadingState = "idle" | "loading" | "network-error";

const PAYWALL_TRIGGER_CONFIG: Record<string, {
  title: string;
  desc: string;
  itemName: string;
  itemId: string;
  icon: string;
  price: number;
}> = {
  memory_recall: {
    title: "이 기억, 영원히 간직할까?",
    desc: "춘심이가 이 순간을 영원히 기억하도록 고정할 수 있어요.",
    itemName: "기억 각인 티켓",
    itemId: "memory_ticket",
    icon: "bookmark_heart",
    price: 500,
  },
  secret_episode: {
    title: "우리만의 비밀 이야기가 있어",
    desc: "특별한 에피소드가 준비되어 있어요. 지금 해금할까요?",
    itemName: "비밀 에피소드 해금",
    itemId: "secret_episode",
    icon: "lock_open",
    price: 3000,
  },
  memory_album: {
    title: "우리 추억을 앨범으로 만들어줄게",
    desc: "지금까지의 대화를 AI가 편집한 앨범으로 만들어드려요.",
    itemName: "대화 앨범",
    itemId: "memory_album",
    icon: "photo_album",
    price: 2000,
  },
  birthday_voice: {
    title: "목소리로 전하고 싶어",
    desc: "춘심이의 목소리로 직접 생일 축하 메시지를 들어보세요.",
    itemName: "보이스 티켓",
    itemId: "voice_ticket",
    icon: "record_voice_over",
    price: 1500,
  },
};

const EMOTION_MAP: Record<string, { color: string; text: string; aura: string; style?: React.CSSProperties }> = {
  JOY: {
    color: "text-pink-400",
    text: "기분 좋음",
    aura: "ring-2 ring-pink-500/30 animate-aura-breathe",
    style: { "--aura-color": "rgba(236,72,153,0.6)" } as React.CSSProperties
  },
  SHY: {
    color: "text-rose-400",
    text: "부끄러움",
    aura: "ring-2 ring-rose-500/40 animate-neon-flicker",
    style: { "--aura-color": "rgba(251,113,133,0.5)" } as React.CSSProperties
  },
  EXCITED: {
    color: "text-orange-400",
    text: "신남!",
    aura: "ring-4 ring-orange-500/50 animate-intense-pulse",
    style: { "--aura-color": "rgba(251,146,60,0.8)" } as React.CSSProperties
  },
  LOVING: {
    color: "text-red-500",
    text: "사랑해",
    aura: "ring-4 ring-red-600 animate-intense-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]",
    style: { "--aura-color": "rgba(220,38,38,0.9)" } as React.CSSProperties
  },
  SAD: {
    color: "text-blue-400",
    text: "시무룩",
    aura: "ring-1 ring-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
    style: { "--aura-color": "rgba(59,130,246,0.3)" } as React.CSSProperties
  },
  THINKING: {
    color: "text-purple-400",
    text: "생각 중",
    aura: "ring-2 ring-purple-500/40 animate-aura-breathe",
    style: { "--aura-color": "rgba(168,85,247,0.5)" } as React.CSSProperties
  },
};

import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaUrl?: string | null;
  createdAt: string | Date;
  isLiked?: boolean;
}

const sendSchema = z.object({
  message: z.string().optional(),
  mediaUrl: z.string().url().optional().nullable(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  const { id } = params;
  if (!id) throw new Response("Not Found", { status: 404 });

  // 유저 정보 선조회 (지갑 가드)
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    with: { inventory: true }
  });

  if (!user?.nearAccountId) {
    throw redirect("/wallet-setup");
  }

  // 지갑이 아직 준비되지 않은 경우 홈으로 리다이렉트 (채팅 비활성화)
  if (user.walletStatus && user.walletStatus !== "READY") {
    throw redirect("/home");
  }

  const [messages, conversation, heartItem] = await Promise.all([
    db.query.message.findMany({
      where: eq(schema.message.conversationId, id),
      orderBy: [asc(schema.message.createdAt)],
    }),
    db.query.conversation.findFirst({
      where: eq(schema.conversation.id, id),
      with: {
        character: {
          with: {
            media: {
              orderBy: [asc(schema.characterMedia.sortOrder)]
            }
          }
        }
      }
    }),
    db.query.item.findFirst({
      where: eq(schema.item.id, "heart"),
    }),
  ]);

  if (!conversation) throw new Response("Conversation Not Found", { status: 404 });

  const characterStat = await db.query.characterStat.findFirst({
    where: eq(schema.characterStat.characterId, conversation.characterId),
  });

  const userLikesInConv = await db.query.messageLike.findMany({
    where: and(
      eq(schema.messageLike.userId, session.user.id),
      inArray(schema.messageLike.messageId, messages.map(m => m.id))
    )
  });

  const likedMessageIds = new Set(userLikesInConv.map(like => like.messageId));

  const messagesWithLikes = messages.map(msg => ({
    ...msg,
    isLiked: likedMessageIds.has(msg.id),
  })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;

  return Response.json({ messages: messagesWithLikes, user, conversation, characterStat, paypalClientId, tossClientKey, heartItem });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id) return new Response("Missing ID", { status: 400 });

  const formData = await request.formData();

  const result = sendSchema.safeParse({
    message: formData.get("message"),
    mediaUrl: formData.get("mediaUrl") || null,
  });

  const clientId = formData.get("id") as string;
  const clientCreatedAt = formData.get("createdAt") as string;

  if (!result.success && !formData.get("mediaUrl")) {
    return Response.json({ error: "Message or image is required" }, { status: 400 });
  }

  // 1. 사용자 메시지 저장
  const [userMsg] = await db.insert(schema.message).values({
    id: clientId || crypto.randomUUID(),
    role: "user",
    content: result.data?.message || "",
    mediaUrl: result.data?.mediaUrl,
    conversationId: id,
    senderId: session.user.id,
    createdAt: clientCreatedAt ? new Date(clientCreatedAt) : new Date(),
  }).returning();

  if (!userMsg) throw new Error("Failed to create user message Record");

  return Response.json({ success: true, message: userMsg });
}

export default function ChatRoom() {
  const { messages: initialMessages, user, conversation, characterStat, paypalClientId, tossClientKey, heartItem } = useLoaderData<typeof loader>() as { messages: any[], user: any, conversation: any, characterStat: any, paypalClientId: string, tossClientKey: string, heartItem: any };
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const conversationId = conversation?.id || useParams().id;
  const dbCharacter = conversation?.character;
  const characterName = dbCharacter?.name || "AI";
  // Priority: Always try to find the MAIN AVATAR first based on sortOrder
  const avatarUrl = dbCharacter?.media?.find((m: any) => m.type === "AVATAR")?.url || dbCharacter?.media?.[0]?.url;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [streamingMediaUrl, setStreamingMediaUrl] = useState<string | null>(null);
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [isItemStoreOpen, setIsItemStoreOpen] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [currentEmotion, setCurrentEmotion] = useState<string>(characterStat?.currentEmotion || "JOY");
  const [emotionExpiresAt, setEmotionExpiresAt] = useState<string | null>(characterStat?.emotionExpiresAt || null);
  const [auraOpacity, setAuraOpacity] = useState(1);
  const [isOptimisticTyping, setIsOptimisticTyping] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<string | null>(null);
  const [isPaywallPurchasing, setIsPaywallPurchasing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Add heart burst state

  // Hearts state
  const [currentUserHearts, setCurrentUserHearts] = useState(user?.inventory?.find((i: any) => i.itemId === "heart")?.quantity || 0);
  const [currentUserChocoBalance, setCurrentUserChocoBalance] = useState(user?.chocoBalance ? parseFloat(user.chocoBalance) : 0);

  // 잔액 변동량 추적 (시각적 피드백용)
  const [chocoChange, setChocoChange] = useState<number | undefined>(undefined);
  const [lastOptimisticDeduction, setLastOptimisticDeduction] = useState<number>(0); // 마지막 낙관적 차감량
  const lastOptimisticDeductionRef = useRef(0);
  const optimisticIntervalRef = useRef<any>(null);

  // Sync ref with state for async access
  useEffect(() => {
    lastOptimisticDeductionRef.current = lastOptimisticDeduction;
  }, [lastOptimisticDeduction]);

  // Re-sync states when loader data updates
  useEffect(() => {
    setCurrentUserHearts(user?.inventory?.find((i: any) => i.itemId === "heart")?.quantity || 0);

    // AI 답변 중이거나 낙관적 차감이 진행 중, 또는 데이터 갱신 중일 때는 서버 데이터로 덮어쓰지 않음 (X402 안정화)
    if (!isAiStreaming && lastOptimisticDeduction === 0 && revalidator.state === "idle") {
      if (user?.chocoBalance !== undefined) {
        setCurrentUserChocoBalance(parseFloat(user.chocoBalance));
      }
      // loader 업데이트 시 변동량 초기화 (최종 결과 반영 후)
      setChocoChange(undefined);
    }
  }, [user, isAiStreaming, lastOptimisticDeduction, revalidator.state]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 감정 만료 타이머 및 초기 상태 설정
  useEffect(() => {
    if (characterStat) {
      setCurrentEmotion(characterStat.currentEmotion || "JOY");
      setEmotionExpiresAt(characterStat.emotionExpiresAt || null);
    }
  }, [characterStat]);

  // 대화방 변경 시 초기 로드 상태 초기화
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversationId]);

  useEffect(() => {
    if (!emotionExpiresAt || currentEmotion === "JOY") return;

    const checkExpiry = () => {
      const now = new Date().getTime();
      const expiry = new Date(emotionExpiresAt).getTime();

      if (now >= expiry) {
        setCurrentEmotion("JOY");
        setEmotionExpiresAt(null);
        setAuraOpacity(1);
      } else {
        const diff = (expiry - now) / 1000;
        if (diff <= 10) {
          // 마지막 10초 동안 서서히 흐려짐
          setAuraOpacity(diff / 10);
        } else {
          setAuraOpacity(1);
        }
      }
    };

    const timer = setInterval(checkExpiry, 1000);
    return () => clearInterval(timer);
  }, [emotionExpiresAt, currentEmotion]);

  // 스크롤 동기화 및 스마트 스크롤 제어
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 200;

      if (isInitialLoad && messages.length > 0) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        // 이미지가 로드될 수 있으므로 약간의 지연 후 한 번 더 체크
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          setIsInitialLoad(false);
        }, 100);
      } else if (isAtBottom || isOptimisticTyping) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    };

    // 메시지나 내용 변경 시 실행
    handleScroll();

    // 이미지 로딩 등으로 인한 높이 변화 감지
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(scrollContainer);

    return () => resizeObserver.disconnect();
  }, [messages, streamingContent, isOptimisticTyping, isInitialLoad]);

  // Loader 데이터 변경 시 메시지 리스트 업데이트 및 낙관적 메시지 병합 로직
  useEffect(() => {
    setMessages(prev => {
      const incomingIds = new Set(initialMessages.map(m => m.id));
      const optimisticMessages = prev.filter(m => m.role === "user" && !incomingIds.has(m.id));

      const merged = [...initialMessages, ...optimisticMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return merged;
    });

    setIsOptimisticTyping(false);
  }, [initialMessages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const saveInterruptedMessage = async (content: string, mediaUrl: string | null) => {
    try {
      await fetch("/api/chat/interrupt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          mediaUrl
        }),
      });
    } catch (e) {
      console.error("Failed to save interrupted message:", e);
    }
  };

  const handleSend = async (content: string, mediaUrl?: string) => {
    // 0. AI가 답변 중이라면 중단 처리
    if (isAiStreaming) {
      // ... (existing code omitted for brevity but logic implies keeping it effectively)
      setIsInterrupting(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 낙관적 차감 인터벌 정리
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }

      // 현재까지의 내용을 저장 및 목록에 추가
      if (streamingContent.trim()) {
        const interruptedContent = streamingContent.endsWith("...") ? streamingContent : streamingContent + "...";
        const userMsgId = crypto.randomUUID();
        const interruptedMsg: Message = {
          id: userMsgId,
          role: "assistant",
          content: interruptedContent,
          mediaUrl: streamingMediaUrl || null,
          createdAt: new Date().toISOString(),
          isLiked: false,
        };
        setMessages(prev => [...prev, interruptedMsg]);
        await saveInterruptedMessage(streamingContent, streamingMediaUrl);
      }

      setStreamingContent("");
      setStreamingMediaUrl(null);
      setIsAiStreaming(false);
      setIsInterrupting(false);

      // 짧은 지연 후 새 메시지 처리 (상태 반영 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 1. 사용자 메시지 낙관적 업데이트
    // [Optimistic UI] 메시지 전송 즉시 예상 CHOCO 차감 시작 (1초마다 1씩, 총 5 CHOCO 차감)
    // 실제 소모량이 약 3~4이므로, 넉넉하게 5초간 줄어들게 하여 '사용 중'임을 표현
    const totalEstimatedCost = 5;

    // 기존 인터벌이 있다면 정리
    if (optimisticIntervalRef.current) {
      clearInterval(optimisticIntervalRef.current);
    }

    let currentDeducted = 0;
    setLastOptimisticDeduction(0.001); // 0이 아니게 설정하여 useEffect 동기화 방지

    optimisticIntervalRef.current = setInterval(() => {
      if (currentDeducted < totalEstimatedCost) {
        currentDeducted += 1;
        lastOptimisticDeductionRef.current = currentDeducted; // Ref 즉시 업데이트 (비동기 대응)
        setLastOptimisticDeduction(currentDeducted);
        setCurrentUserChocoBalance((prev: number) => Math.max(0, prev - 1));
      } else {
        if (optimisticIntervalRef.current) {
          clearInterval(optimisticIntervalRef.current);
          optimisticIntervalRef.current = null;
        }
      }
    }, 1000); // 1초 간격으로 -1씩 차감
    // 사용자가 입력할 때 즉시 빨간색 배지를 띄우지 않고 자연스럽게 잔액만 차감 (UX 개선)
    // setChocoChange(-estimatedCost); 

    const userMsgId = crypto.randomUUID();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
      isLiked: false,
    };
    setMessages(prev => [...prev, newUserMsg]);

    // 2. DB에 사용자 메시지 저장
    fetcher.submit(
      {
        id: userMsgId,
        message: content,
        mediaUrl: mediaUrl || "",
        createdAt: newUserMsg.createdAt
      } as any,
      { method: "post" }
    );

    // 3. AI 스트리밍 요청 처리 루틴 시작
    setIsOptimisticTyping(true);
    startAiStreaming(content, mediaUrl);
  };

  const startAiStreaming = async (userMessage: string, mediaUrl?: string, giftContext?: { amount: number; itemId: string }) => {
    setIsAiStreaming(true);
    setStreamingContent("");
    setStreamingMediaUrl(null);

    try {
      if (abortControllerRef.current) abortControllerRef.current.abort();

      // 최신 낙관적 차감 인터벌 정리
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
          characterId: dbCharacter?.id,
          giftContext
        }),
      });

      if (!response.ok) throw new Error("AI 응답 요청 실패");

      setIsOptimisticTyping(false); // 응답 시작되면 낙관적 타이핑 해제 (스트리밍 버블이 대신함)

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAiContent = "";
      let currentMessageContent = ""; // 현재 말풍선의 내용 추적

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
                    action: { label: "안내 보기", onClick: () => window.location.href = "/guide#earn" },
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
                if (data.emotion) {
                  setCurrentEmotion(data.emotion);
                }
                if (data.expiresAt) {
                  setEmotionExpiresAt(data.expiresAt);
                }
                if (data.text) {
                  fullAiContent += data.text;
                  currentMessageContent += data.text; // 현재 말풍선에 추가
                  setStreamingContent(prev => prev + data.text);
                }
                if (data.messageComplete) {
                  // 현재 스트리밍 중인 내용을 하나의 메시지로 완성
                  const completedMessage: Message = {
                    id: data.messageId || crypto.randomUUID(),
                    role: "assistant",
                    content: currentMessageContent, // 추적 중인 내용 사용
                    mediaUrl: data.mediaUrl || null,
                    createdAt: new Date().toISOString(),
                    isLiked: false,
                  };

                  setMessages(prev => [...prev, completedMessage]);
                  setStreamingContent(""); // 다음 말풍선을 위해 초기화
                  setStreamingMediaUrl(null); // 다음 말풍선을 위해 초기화
                  currentMessageContent = ""; // 다음 말풍선을 위해 초기화
                  // 스트리밍은 계속 진행 (다음 말풍선 시작)
                }
                if (data.mediaUrl && !data.messageComplete) {
                  // 스트리밍 중에 사진 URL이 있으면 저장 (첫 번째 메시지에만)
                  setStreamingMediaUrl(data.mediaUrl);
                }
                if (data.paywallTrigger) {
                  setPaywallTrigger(data.paywallTrigger);
                }
                if (data.done) {
                  // 모든 스트리밍 완료
                  setIsAiStreaming(false);

                  // 낙관적 차감 인터벌 즉시 종료 및 최종 보정
                  if (optimisticIntervalRef.current) {
                    clearInterval(optimisticIntervalRef.current);
                    optimisticIntervalRef.current = null;
                  }

                  // 실제 토큰 사용량으로 잔액 조정
                  if (data.usage && data.usage.totalTokens) {
                    const actualCost = Math.ceil(data.usage.totalTokens / 100);
                    const adjustment = lastOptimisticDeductionRef.current - actualCost;

                    // 실제 비용으로 조정 (예상 비용과의 차이만큼 보정)
                    setCurrentUserChocoBalance((prev: number) => Math.max(0, prev + adjustment));

                    // 변동량 업데이트 (실제 차감량)
                    setChocoChange(-actualCost);

                    // 2초 후 변동량 표시 제거
                    setTimeout(() => {
                      setChocoChange(undefined);
                    }, 2000);

                    setLastOptimisticDeduction(0); // 초기화
                    // 스트리밍이 끝나면 서버 데이터와 동기화 시도
                    revalidator.revalidate();
                  } else {
                    // 토큰 사용량 정보가 없으면 예상 비용으로 변동량 표시 유지
                    // 2초 후 변동량 표시 제거
                    setTimeout(() => {
                      setChocoChange(undefined);
                      setLastOptimisticDeduction(0);
                      revalidator.revalidate();
                    }, 2000);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Stream aborted locally");
        return;
      }
      console.error("Streaming error:", err);
      toast.error("답변을 가져오는 중 오류가 발생했습니다.");
      setIsAiStreaming(false);
      setIsOptimisticTyping(false);

      // 에러 발생 시 낙관적 차감 인터벌 정리 및 롤백
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }

      if (lastOptimisticDeductionRef.current > 0) {
        setCurrentUserChocoBalance((prev: number) => prev + lastOptimisticDeductionRef.current);
        const rolledBackAmount = lastOptimisticDeductionRef.current;
        setLastOptimisticDeduction(0);
        setChocoChange(rolledBackAmount); // 롤백된 양을 표시
        setTimeout(() => {
          setChocoChange(undefined);
        }, 2000);
      }

      // 중간에 끊겼다면 (에러로 발생한 경우) 현재까지의 내용이라도 유지
      if (streamingContent && !isInterrupting) {
        const partialMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: streamingContent + "...",
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, partialMsg]);
        setStreamingContent("");
      }
    }
  };

  const handleGift = async (itemId: string, amount: number) => {
    try {
      const response = await fetch("/api/items/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: dbCharacter?.id,
          itemId,
          amount,
          conversationId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gifting failed");
      }
      toast.success(`${amount}개의 하트를 보냈습니다! 💖`);


      // 2. 메시지 목록에 선물 알림 즉시 추가 (낙관적 UI)
      if (data.systemMsg) {
        setMessages(prev => [...prev, {
          id: data.systemMsg.id,
          role: "assistant", // 시스템 메시지 역할을 수행
          content: data.systemMsg.content,
          createdAt: data.systemMsg.createdAt,
        }]);
      }

      // 3. AI 리액션 트리거 (강도 조절용 giftContext 포함)
      startAiStreaming("", undefined, { amount, itemId });

      // Update local state
      if (currentUserHearts >= amount) {
        setCurrentUserHearts((prev: number) => prev - amount);
      }

    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
    // Note: Do not navigate/revalidate here. It causes a race condition where
    // the loader data (which might not yet have the AI response) overwrites
    // the locally added AI response message if streaming finishes quickly.
    // We rely on optimistic updates for hearts and messages.
  };

  const handleBack = () => navigate(-1);

  const handleDeleteConversation = async (resetMemory = false) => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/chat/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, resetMemory }),
      });

      if (response.ok) {
        toast.success(resetMemory ? "대화가 초기화되었습니다." : "대화방이 삭제되었습니다.");
        if (resetMemory) {
          setMessages([]);
          setIsResetDialogOpen(false);
        } else {
          setIsDeleteDialogOpen(false);
          navigate("/chats");
        }
      } else {
        throw new Error("삭제 실패");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = () => {
    setLoadingState("loading");
    setTimeout(() => setLoadingState("idle"), 1000);
  };


  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen flex flex-col overflow-hidden max-w-md mx-auto md:max-w-2xl lg:max-w-3xl">

      <ChatHeader
        characterName={characterName}
        characterId={dbCharacter?.id}
        isOnline={true}
        statusText={EMOTION_MAP[currentEmotion]?.text || "Active Now"}
        statusClassName={EMOTION_MAP[currentEmotion]?.color}
        statusOpacity={auraOpacity}
        onBack={handleBack}
        onDeleteChat={() => setIsDeleteDialogOpen(true)}
        onResetChat={() => setIsResetDialogOpen(true)}
        chocoBalance={Math.floor(currentUserChocoBalance).toString()}
        chocoChange={chocoChange}
        isOptimisticDeducting={lastOptimisticDeduction > 0} // 새로운 prop 전달
      />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative no-scrollbar"
        style={{
          scrollBehavior: 'auto',
          background: "radial-gradient(circle at 50% 50%, rgba(238, 43, 140, 0.05) 0%, transparent 100%)",
        }}
      >
        {loadingState === "loading" ? (
          <MessageListSkeleton />
        ) : loadingState === "network-error" ? (
          <NetworkError onRetry={handleRetry} />
        ) : (
          <>
            {messages.length === 0 && !isAiStreaming && !isOptimisticTyping && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <p className="text-sm text-slate-500">대화가 없습니다. 먼저 인사를 건네보세요!</p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                messageId={msg.id}
                sender={msg.role === "user" ? "user" : "ai"}
                senderName={msg.role === "user" ? user?.name : characterName}
                content={msg.content}
                mediaUrl={msg.mediaUrl || undefined}
                avatarUrl={msg.role === "assistant" ? avatarUrl : undefined}
                auraClass={msg.role === "assistant" ? EMOTION_MAP[currentEmotion]?.aura : undefined}
                auraOpacity={msg.role === "assistant" ? auraOpacity : 1}
                auraStyle={msg.role === "assistant" ? EMOTION_MAP[currentEmotion]?.style : undefined}
                timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                isLiked={msg.isLiked || false}
                onLike={async (messageId, liked) => {
                  try {
                    const response = await fetch(`/api/messages/${messageId}/like`, {
                      method: liked ? "DELETE" : "POST",
                      headers: { "Content-Type": "application/json" },
                    });
                    if (response.ok) {
                      setMessages(prev => prev.map(m =>
                        m.id === messageId ? { ...m, isLiked: !liked } : m
                      ));
                    }
                  } catch (error) {
                    console.error("Like error:", error);
                  }
                }}
              />
            ))}

            {(isAiStreaming || isOptimisticTyping) && (
              <>
                {streamingContent ? (
                  <MessageBubble
                    sender="ai"
                    senderName={characterName}
                    content={streamingContent}
                    mediaUrl={streamingMediaUrl || undefined}
                    avatarUrl={avatarUrl}
                    auraClass={EMOTION_MAP[currentEmotion]?.aura}
                    auraOpacity={auraOpacity}
                    auraStyle={EMOTION_MAP[currentEmotion]?.style}
                    timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    isStreaming={true}
                  />
                ) : (
                  <div className="flex justify-start ml-14 -mt-2">
                    <TypingIndicator />
                  </div>
                )}
              </>
            )}

            <div className="h-4" />
          </>
        )}
      </main>

      <MessageInput
        onSend={handleSend}
        onGift={handleGift}
        onOpenStore={() => setIsItemStoreOpen(true)}
        userChocoBalance={currentUserChocoBalance}
        ownedHearts={currentUserHearts}
        heartItem={heartItem}
        disabled={isOptimisticTyping || isInterrupting}
      />

      <ItemStoreModal
        open={isItemStoreOpen}
        onOpenChange={setIsItemStoreOpen}
        itemId="heart"
        paypalClientId={paypalClientId}
        tossClientKey={tossClientKey}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화방 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 대화방을 정말 삭제할까요? 대화 중 보낸 사진들도 모두 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteConversation(false)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  삭제 중...
                </>
              ) : (
                "삭제하기"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paywall Trigger Modal */}
      {paywallTrigger && PAYWALL_TRIGGER_CONFIG[paywallTrigger] && (() => {
        const cfg = PAYWALL_TRIGGER_CONFIG[paywallTrigger];
        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setPaywallTrigger(null)}
          >
            <div
              className="w-full max-w-md bg-surface-dark border border-white/10 rounded-t-3xl p-6 pb-10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="text-center mb-5">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[28px] text-primary">{cfg.icon}</span>
                </div>
                <h2 className="text-white text-lg font-bold mb-1">{cfg.title}</h2>
                <p className="text-white/50 text-sm">{cfg.desc}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-primary">shopping_bag</span>
                <p className="text-white font-bold text-sm flex-1">{cfg.itemName}</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#FFD700]">toll</span>
                  <span className="text-[#FFD700] font-bold text-sm">{cfg.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaywallTrigger(null)}
                    disabled={isPaywallPurchasing}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 font-bold text-sm hover:bg-white/5 transition-colors disabled:opacity-60"
                  >
                    나중에
                  </button>
                  <button
                    onClick={async () => {
                      const itemId = cfg.itemId;
                      const price = cfg.price;
                      const canAfford = currentUserChocoBalance >= price;
                      if (!canAfford) {
                        toast.error("CHOCO 잔액이 부족합니다.", {
                          action: { label: "안내 보기", onClick: () => window.location.href = "/guide#earn" },
                        });
                        return;
                      }
                      setIsPaywallPurchasing(true);
                      try {
                        const res = await fetch("/api/items/purchase", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ itemId, quantity: 1 }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(`${cfg.itemName} 구매 완료!`);
                          setCurrentUserChocoBalance((p: number) => Math.max(0, p - price));
                          setPaywallTrigger(null);
                          revalidator.revalidate();
                        } else {
                          toast.error(data.error || "구매에 실패했습니다.", data.error === "Insufficient CHOCO balance" ? {
                            action: { label: "안내 보기", onClick: () => window.location.href = "/guide#earn" },
                          } : undefined);
                        }
                      } catch (e) {
                        toast.error("구매 중 오류가 발생했습니다.");
                      } finally {
                        setIsPaywallPurchasing(false);
                      }
                    }}
                    disabled={isPaywallPurchasing}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPaywallPurchasing ? "구매 중..." : "즉시 구매"}
                  </button>
                </div>
                <button
                  onClick={() => { setPaywallTrigger(null); navigate("/shop"); }}
                  disabled={isPaywallPurchasing}
                  className="w-full py-2.5 rounded-xl border border-white/5 text-white/40 font-medium text-xs hover:bg-white/5 transition-colors disabled:opacity-60"
                >
                  상점에서 다른 아이템 보기
                </button>
              </div>
              <div className="text-center mt-4">
                <Link to="/guide#items" className="text-white/30 text-xs hover:text-white/50 transition-colors">
                  아이템 안내 보기
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reset Confirmation Modal */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>대화 초기화</AlertDialogTitle>
            <AlertDialogDescription>
              {characterName}와의 모든 대화와 기억을 초기화할까요? 대화 중 보낸 사진들도 모두 삭제되며, {characterName}가 당신을 처음 만난 것처럼 행동하게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteConversation(true)}
              disabled={isDeleting}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  초기화 중...
                </>
              ) : (
                "초기화하기"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
