import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { ApiError } from "~/components/ui/ApiError";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { z } from "zod";

type LoadingState = "idle" | "loading" | "error" | "network-error";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | Date;
}

const sendSchema = z.object({
  message: z.string().min(1),
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
  const result = sendSchema.safeParse({ message: formData.get("message") });

  if (!result.success) {
    return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  // 1. 사용자 메시지 저장
  const userMsg = await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      role: "user",
      content: result.data.message,
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

  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 동기화
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Loader 데이터 변경 시 메시지 리스트 업데이트 (페이지 진입 시)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleSend = async (content: string) => {
    // 1. 사용자 메시지 낙관적 업데이트
    const userMsgId = crypto.randomUUID();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMsg]);

    // 2. DB에 사용자 메시지 저장
    fetcher.submit(
      { message: content },
      { method: "post" }
    );

    // 3. AI 스트리밍 요청 처리 루틴 시작
    startAiStreaming(content);
  };

  const startAiStreaming = async (userMessage: string) => {
    setIsAiStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId }),
      });

      if (!response.ok) throw new Error("AI 응답 요청 실패");

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
                  // 스트리밍 완료 시 최종 메시지를 리스트에 추가하고 스트리밍 상태 해제
                  const finalAiMsg: Message = {
                    id: data.messageId || crypto.randomUUID(),
                    role: "assistant",
                    content: fullAiContent,
                    createdAt: new Date().toISOString(),
                  };
                  setMessages(prev => [...prev, finalAiMsg]);
                  setStreamingContent("");
                  setIsAiStreaming(false);
                }
              } catch (e) {
                // 파싱 에러 무시 (완성되지 않은 JSON chunk 처리 등)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setIsAiStreaming(false);
      setLoadingState("error");
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
        statusText="Online now"
        onBack={handleBack}
        onMenuClick={handleMenuClick}
      />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative no-scrollbar scroll-smooth"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(238, 43, 140, 0.05) 0%, transparent 100%)",
        }}
      >
        {loadingState === "loading" ? (
          <MessageListSkeleton />
        ) : loadingState === "network-error" ? (
          <NetworkError onRetry={handleRetry} />
        ) : loadingState === "error" ? (
          <ApiError onRetry={handleRetry} />
        ) : (
          <>
            {messages.length === 0 && !isAiStreaming && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <p className="text-sm text-slate-500">대화가 없습니다. 먼저 인사를 건네보세요!</p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                sender={msg.role === "user" ? "user" : "ai"}
                senderName={msg.role === "user" ? user.name : characterName}
                content={msg.content}
                avatarUrl={msg.role === "assistant" ? avatarUrl : undefined}
                timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            ))}

            {isAiStreaming && (
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
                  <div className="flex justify-start ml-14 -mt-4">
                    <TypingIndicator />
                  </div>
                )}
              </>
            )}

            <div className="h-4" />
          </>
        )}
      </main>

      <MessageInput onSend={handleSend} disabled={isAiStreaming} />
    </div>
  );
}
