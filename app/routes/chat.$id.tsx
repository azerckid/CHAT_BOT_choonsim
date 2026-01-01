import { useState } from "react";
import { useParams, useNavigate, useLoaderData, useFetcher } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { DateSeparator } from "~/components/chat/DateSeparator";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { ApiError } from "~/components/ui/ApiError";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { z } from "zod";

type LoadingState = "idle" | "loading" | "error" | "network-error";

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
  const { messages, user } = useLoaderData<typeof loader>() as { messages: any[], user: any };
  const fetcher = useFetcher();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const isSending = fetcher.state !== "idle";


  const handleSend = async (message: string) => {
    fetcher.submit(
      { message },
      { method: "post" }
    );
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenuClick = () => {
    // TODO: 메뉴 열기
    console.log("Menu clicked");
  };

  const handleRetry = () => {
    setLoadingState("loading");
    // TODO: 재시도 로직 (Phase 2)
    setTimeout(() => {
      setLoadingState("idle");
    }, 1000);
  };

  // TODO: 실제 캐릭터 정보 가져오기 (Phase 2.4/4)
  const characterName = "춘심";
  const avatarUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8XkiSD530UZKl37CoghVbq1qhTYUznUuQFA8dC8rGZe9VuKJsQzUHPgEOQJgupAoHDwO_ZIMC3G_bFGNvaHQ6PSySe2kGq-OJg-IHNH36ByOLEdNchZk1bnNuAxFmnVtxRjKZ5r3Ig5IyQz_moPPFVxD9suAIS4970ggd9cHE5tiLupgMBUCcvc_nJZxpSztEWzQ8QH_JoQ88WdEig0P_Jnj66eHhxORy45NPUNxo-32nkwobvofGqKLRQ2xyrx2QdJZPnhDk4UA";

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
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative no-scrollbar"
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
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <p className="text-sm text-slate-500">대화가 없습니다. 먼저 인사를 건네보세요!</p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <MessageBubble
                  key={msg.id}
                  sender={msg.role === "user" ? "user" : "ai"}
                  senderName={msg.role === "user" ? user.name : characterName}
                  content={msg.content}
                  avatarUrl={msg.role === "assistant" ? avatarUrl : undefined}
                  timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
              ))
            )}

            {isSending && (
              <div className="flex justify-start ml-14 -mt-4">
                <TypingIndicator />
              </div>
            )}

            <div className="h-4" />
          </>
        )}
      </main>

      <MessageInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}

