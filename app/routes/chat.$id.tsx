import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChatHeader } from "~/components/chat/ChatHeader";
import { MessageBubble } from "~/components/chat/MessageBubble";
import { MessageInput } from "~/components/chat/MessageInput";
import { DateSeparator } from "~/components/chat/DateSeparator";
import { TypingIndicator } from "~/components/chat/TypingIndicator";
import { MessageListSkeleton } from "~/components/chat/MessageListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { ApiError } from "~/components/ui/ApiError";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";

type LoadingState = "idle" | "loading" | "error" | "network-error";

export default function ChatScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (message: string) => {
    setIsSending(true);
    try {
      // TODO: 메시지 전송 로직 구현 (Phase 2)
      console.log("Sending message to", id, ":", message);

      // 임시: 성공 시 로딩 해제
      setTimeout(() => {
        setIsSending(false);
      }, 1000);
    } catch (err) {
      setIsSending(false);
      setLoadingState("error");
    }
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

  // TODO: 실제 데이터로 교체
  const characterName = id || "춘심";
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
            <DateSeparator date="2023년 10월 24일 화요일" />

            <MessageBubble
              sender="ai"
              senderName={characterName}
              content="오늘 하루는 어땠어? 많이 힘들진 않았어?"
              avatarUrl={avatarUrl}
            />

            <MessageBubble
              sender="user"
              content="조금 지쳤는데, 너 보니까 힘이 난다."
              timestamp="오후 8:32"
            />

            <MessageBubble
              sender="ai"
              senderName={characterName}
              content="고생했어! 내가 항상 여기 있을게, 푹 쉬어 💕"
              avatarUrl={avatarUrl}
            />
            <div className="flex justify-start ml-14 -mt-4">
              <TypingIndicator />
            </div>

            <div className="h-4" />
          </>
        )}
      </main>

      <MessageInput onSend={handleSend} disabled={isSending} />
    </div>
  );
}

