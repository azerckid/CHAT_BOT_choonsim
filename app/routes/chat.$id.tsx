import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { toast } from "sonner";

type LoadingState = "idle" | "loading" | "network-error";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaUrl?: string | null;
  createdAt: string | Date;
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

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ messages, user: session.user });
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
  const userMsg = await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      role: "user",
      content: result.data?.message || "",
      mediaUrl: result.data?.mediaUrl,
      conversationId: id,
      senderId: session.user.id,
      createdAt: new Date(),
    },
  });

  return Response.json({ success: true, message: userMsg });
}

export default function ChatScreen() {
  const { messages: initialMessages, user } = useLoaderData<typeof loader>() as { messages: any[], user: any };
  const fetcher = useFetcher();
  const { id: conversationId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [isOptimisticTyping, setIsOptimisticTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [initialMessages]);

  const handleSend = async (content: string, mediaUrl?: string) => {
    // 1. 사용자 메시지 낙관적 업데이트
    const userMsgId = crypto.randomUUID();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
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

  const startAiStreaming = async (userMessage: string, mediaUrl?: string) => {
    setIsAiStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId, mediaUrl }),
      });

      if (!response.ok) throw new Error("AI 응답 요청 실패");

      setIsOptimisticTyping(false); // 응답 시작되면 낙관적 타이핑 해제 (스트리밍 버블이 대신함)

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullAiContent = "";

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
                if (data.text) {
                  fullAiContent += data.text;
                  setStreamingContent(prev => prev + data.text);
                }
                if (data.done) {
                  const parts = fullAiContent.split('---').map(p => p.trim()).filter(p => p.length > 0);

                  const finalMsgs: Message[] = parts.map((part, idx) => ({
                    id: idx === parts.length - 1 && data.messageId ? data.messageId : crypto.randomUUID(),
                    role: "assistant",
                    content: part,
                    createdAt: new Date().toISOString(),
                  }));

                  setMessages(prev => [...prev, ...finalMsgs]);
                  setStreamingContent("");
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

  const handleBack = () => navigate(-1);
  const handleMenuClick = () => console.log("Menu clicked");
  const handleRetry = () => {
    setLoadingState("loading");
    setTimeout(() => setLoadingState("idle"), 1000);
  };

  const characterName = "춘심";
  const avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuA8XkiSD530UZKl37CoghVbq1qhTYUznUuQFA8dC8rGZe9VuKJsQzUHPgEOQJgupAoHDwO_ZIMC3G_bFGNvaHQ6PSySe2kGq-OJg-IHNH36ByOLEdNchZk1bnNuAxFmnVtxRjKZ5r3Ig5IyQz_moPPFVxD9suAIS4970ggd9cHE5tiLupgMBUCcvc_nJZxpSztEWzQ8QH_JoQ88WdEig0P_Jnj66eHhxORy45NPUNxo-32nkwobvofGqKLRQ2xyrx2QdJZPnhDk4UA";

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen flex flex-col overflow-hidden max-w-md mx-auto md:max-w-2xl lg:max-w-3xl">
      <ChatHeader
        characterName={characterName}
        isOnline={true}
        statusText="Active Now"
        onBack={handleBack}
        onMenuClick={handleMenuClick}
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
                sender={msg.role === "user" ? "user" : "ai"}
                senderName={msg.role === "user" ? user?.name : characterName}
                content={msg.content}
                mediaUrl={msg.mediaUrl || undefined}
                avatarUrl={msg.role === "assistant" ? avatarUrl : undefined}
                timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            ))}

            {(isAiStreaming || isOptimisticTyping) && (
              <>
                {streamingContent ? (
                  <MessageBubble
                    sender="ai"
                    senderName={characterName}
                    content={streamingContent}
                    avatarUrl={avatarUrl}
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

      <MessageInput onSend={handleSend} disabled={isAiStreaming || isOptimisticTyping} />
    </div>
  );
}
