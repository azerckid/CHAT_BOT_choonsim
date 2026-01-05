import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { HeartBurst } from "~/components/ui/HeartBurst";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ItemStoreModal } from "~/components/payment/ItemStoreModal";
import { CHARACTERS } from "~/lib/characters";
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

  const [messages, user, conversation] = await Promise.all([
    db.query.message.findMany({
      where: eq(schema.message.conversationId, id),
      orderBy: [asc(schema.message.createdAt)],
    }),
    db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
      with: {
        inventory: true,
      }
    }),
    db.query.conversation.findFirst({
      where: eq(schema.conversation.id, id),
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
  }));

  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const tossClientKey = process.env.TOSS_CLIENT_KEY;

  return Response.json({ messages: messagesWithLikes, user, conversation, characterStat, paypalClientId, tossClientKey });
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

  if (!result.success && !formData.get("mediaUrl")) {
    return Response.json({ error: "Message or image is required" }, { status: 400 });
  }

  // 1. 사용자 메시지 저장
  const [userMsg] = await db.insert(schema.message).values({
    id: crypto.randomUUID(),
    role: "user",
    content: result.data?.message || "",
    mediaUrl: result.data?.mediaUrl,
    conversationId: id,
    senderId: session.user.id,
    createdAt: new Date(),
  }).returning();

  if (!userMsg) throw new Error("Failed to create user message Record");

  return Response.json({ success: true, message: userMsg });
}

export default function ChatRoom() {
  const { messages: initialMessages, user, conversation, characterStat, paypalClientId, tossClientKey } = useLoaderData<typeof loader>() as { messages: any[], user: any, conversation: any, characterStat: any, paypalClientId: string, tossClientKey: string };
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const conversationId = conversation?.id || useParams().id;
  const character = CHARACTERS[conversation?.characterId || "chunsim"] || CHARACTERS["chunsim"];
  const characterName = character.name;
  const avatarUrl = character.avatarUrl;

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Add heart burst state
  const [isHeartBurstActive, setIsHeartBurstActive] = useState(false);
  // Hearts state
  const [currentUserHearts, setCurrentUserHearts] = useState(user?.inventory?.find((i: any) => i.itemId === "heart")?.quantity || 0);
  const [currentUserCredits, setCurrentUserCredits] = useState(user?.credits || 0);

  // Re-sync states when loader data updates
  useEffect(() => {
    setCurrentUserHearts(user?.inventory?.find((i: any) => i.itemId === "heart")?.quantity || 0);
    setCurrentUserCredits(user?.credits || 0);
  }, [user]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 감정 만료 타이머 및 초기 상태 설정
  useEffect(() => {
    if (characterStat) {
      setCurrentEmotion(characterStat.currentEmotion || "JOY");
      setEmotionExpiresAt(characterStat.emotionExpiresAt || null);
    }
  }, [characterStat]);

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

  // 스크롤 동기화
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isOptimisticTyping]);

  // Loader 데이터 변경 시 메시지 리스트 업데이트
  useEffect(() => {
    setMessages(initialMessages);
    setIsOptimisticTyping(false);
    if (user?.credits !== undefined) {
      setCurrentUserCredits(user.credits);
    }
  }, [initialMessages, user]);

  const handleSend = async (content: string, mediaUrl?: string) => {
    // 1. 사용자 메시지 낙관적 업데이트
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
      { message: content, mediaUrl: mediaUrl || "" },
      { method: "post" }
    );

    // 3. AI 스트리밍 요청 처리 루틴 시작 (낙관적 타이핑 포함)
    setIsOptimisticTyping(true);
    startAiStreaming(content, mediaUrl);
  };

  const startAiStreaming = async (userMessage: string, mediaUrl?: string, giftContext?: { amount: number; itemId: string }) => {
    setIsAiStreaming(true);
    setStreamingContent("");
    setStreamingMediaUrl(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          mediaUrl,
          characterId: character.id, // Pass characterId to API
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
                if (data.done) {
                  // 모든 스트리밍 완료
                  setIsAiStreaming(false);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      toast.error("답변을 가져오는 중 오류가 발생했습니다.");
      setIsAiStreaming(false);
      setIsOptimisticTyping(false);

      // 중간에 끊겼다면 현재까지의 내용이라도 유지
      if (streamingContent) {
        const partialMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: streamingContent,
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
          characterId: character.id,
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
      setIsHeartBurstActive(true); // TRIGGER ANIMATION HERE

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
      <HeartBurst active={isHeartBurstActive} onComplete={() => setIsHeartBurstActive(false)} count={30} />
      <ChatHeader
        characterName={characterName}
        characterId={character.id}
        isOnline={true}
        statusText={EMOTION_MAP[currentEmotion]?.text || "Active Now"}
        statusClassName={EMOTION_MAP[currentEmotion]?.color}
        statusOpacity={auraOpacity}
        onBack={handleBack}
        onDeleteChat={() => setIsDeleteDialogOpen(true)}
        onResetChat={() => setIsResetDialogOpen(true)}
      />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative no-scrollbar scroll-smooth"
        style={{
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
        userCredits={currentUserCredits}
        ownedHearts={currentUserHearts}
        disabled={isAiStreaming || isOptimisticTyping}
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
