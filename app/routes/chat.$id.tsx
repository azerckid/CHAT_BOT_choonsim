import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { toast } from "sonner";
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

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    if (messages.length > 0) {
      // If messages exist but conversation record missing (orphan), handle gracefully if needed or throw
      // For now, assume consistent DB
    }
  }

  return Response.json({ messages, user: session.user, conversation });
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
  const { messages: initialMessages, user, conversation } = useLoaderData<typeof loader>() as { messages: any[], user: any, conversation: any };
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const conversationId = conversation?.id || useParams().id;
  const character = CHARACTERS[conversation?.characterId || "chunsim"] || CHARACTERS["chunsim"];
  const characterName = character.name;
  const avatarUrl = character.avatarUrl;

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [isOptimisticTyping, setIsOptimisticTyping] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          mediaUrl,
          characterId: character.id // Pass characterId to API
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
                    createdAt: new Date().toISOString(),
                  };
                  
                  setMessages(prev => [...prev, completedMessage]);
                  setStreamingContent(""); // 다음 말풍선을 위해 초기화
                  currentMessageContent = ""; // 다음 말풍선을 위해 초기화
                  // 스트리밍은 계속 진행 (다음 말풍선 시작)
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
        isOnline={true}
        statusText="Active Now"
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
