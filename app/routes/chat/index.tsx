import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { ChatListItem } from "~/components/chat/ChatListItem";
import { OnlineIdolList } from "~/components/chat/OnlineIdolList";
import { BottomNavigation } from "~/components/layout/BottomNavigation";
import { ChatListSkeleton } from "~/components/chat/ChatListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { ApiError } from "~/components/ui/ApiError";
import { cn } from "~/lib/utils";
import { db } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import * as schema from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type LoadingState = "idle" | "loading" | "error" | "network-error";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  const [conversations, allCharacters] = await Promise.all([
    db.query.conversation.findMany({
      where: eq(schema.conversation.userId, session.user.id),
      with: {
        messages: {
          orderBy: [desc(schema.message.createdAt)],
          limit: 1,
        },
        character: { with: { media: true } }
      },
      orderBy: [desc(schema.conversation.updatedAt)],
    }),
    db.query.character.findMany({
      with: { media: true }
    })
  ]);

  return Response.json({ conversations, allCharacters });
}

export default function ChatListScreen() {
  const { conversations, allCharacters } = useLoaderData<typeof loader>() as { conversations: any[], allCharacters: any[] };
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const navigate = useNavigate();

  const handleIdolClick = (characterId: string) => {
    // 아이돌 아바타 클릭 시 프로필 화면으로 이동
    navigate(`/character/${characterId}`);
  };

  const handleStartChat = async (characterId: string) => {
    try {
      setLoadingState("loading");
      const response = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      if (!response.ok) throw new Error("Failed to create chat");

      const data = await response.json();
      navigate(`/chat/${data.conversationId}`);
    } catch (error) {
      console.error("Chat creation error:", error);
      setLoadingState("error"); // In a real app, show toast
      // For now reset after short delay or show robust error
      setTimeout(() => setLoadingState("idle"), 2000);
    }
  };

  const onlineIdols = allCharacters.map((char: any) => ({
    id: char.id,
    name: char.name,
    avatarUrl: (char.media?.find((m: any) => m.type === "AVATAR")?.url) || char.media?.[0]?.url,
    isOnline: char.isOnline,
  }));

  const handleRetry = () => {
    setLoadingState("loading");
    setTimeout(() => {
      setLoadingState("idle");
    }, 1000);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white pb-24 max-w-md mx-auto md:max-w-lg lg:max-w-xl">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-4 pt-12 pb-3 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full bg-cover bg-center ring-2 ring-gray-200 dark:ring-white/10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVl0hrpoB1yOAKpQmi-_0n7ICqjGaew6qKzz_Gn8CbqiQL1TBgAMDihfIzH7NO8Kir1bL6J_gs-qj0PzAlVN-0TM1Py8H0_3TOtix5p0aql-mvaSLfSbA290FDgIwdBcPIYdPe53zzyV5MDn_BXBDETX3SZX_aoWMl3hh_NIS59fdAciuwSHR-AoKLwEeh2jIaNjLb0MTt70Uv5AzH3-4cfSZ7zkxkEY0Pj82wFASAxuhtYWy-IwB4kj9mN8N7xCmOj_sTq6L2f30")',
              }}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/search"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-text-muted">
              search
            </span>
          </Link>
          <Link
            to="/settings"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-text-muted">
              settings
            </span>
          </Link>
        </div>
      </header>

      <OnlineIdolList
        idols={onlineIdols}
        onIdolClick={handleIdolClick}
        onAddClick={() => setIsNewChatOpen(true)}
      />

      <main className="mt-2 flex flex-col px-2">
        <div className="px-4 py-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-text-muted">
            Recent Chats
          </h2>
        </div>
        {loadingState === "loading" ? (
          <ChatListSkeleton />
        ) : loadingState === "network-error" ? (
          <NetworkError onRetry={handleRetry} />
        ) : loadingState === "error" ? (
          <ApiError onRetry={handleRetry} />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">chat_bubble</span>
            </div>
            <h3 className="text-lg font-bold mb-1">새로운 대화를 시작해보세요!</h3>
            <p className="text-sm text-slate-500">춘심이가 당신의 연락을 기다리고 있어요.</p>
          </div>
        ) : (
          conversations.map((chat: any) => {
            const lastMsg = chat.messages?.[0];
            const character = chat.character;
            const avatarUrl = (character?.media?.find((m: any) => m.type === "AVATAR")?.url) || character?.media?.[0]?.url;

            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={character?.name || "AI"}
                lastMessage={lastMsg?.content || "대화를 시작해보세요"}
                timestamp={lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                avatarUrl={avatarUrl}
                isRead={lastMsg ? lastMsg.read : true}
                isOnline={character?.isOnline || false}
                characterId={character?.id}
              />
            );
          })
        )}
      </main>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogTrigger
          render={
            <button className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-slate-900 dark:bg-primary text-white rounded-full shadow-lg dark:shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl">add_comment</span>
            </button>
          }
        />
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 대화 시작하기</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {allCharacters.map((char: any) => (
              <button
                key={char.id}
                onClick={() => {
                  handleStartChat(char.id);
                  setIsNewChatOpen(false);
                }}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative flex-none">
                  <img
                    src={(char.media?.find((m: any) => m.type === "AVATAR")?.url) || char.media?.[0]?.url}
                    alt={char.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {char.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-light dark:border-background-dark" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{char.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{char.role}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />

      <div className="pointer-events-none fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-10" />
    </div>
  );
}

