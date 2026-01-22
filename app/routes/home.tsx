import { useNavigate, useLoaderData } from "react-router";
import { auth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import type { LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/home";
import { BottomNavigation } from "~/components/layout/BottomNavigation";
import { DateTime } from "luxon";
import { cn } from "~/lib/utils";
import * as schema from "~/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "AI Chat - Home" },
    { name: "description", content: "AI 아이돌과의 특별한 일상 대화" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  // 인증된 사용자의 경우 지갑 상태 체크 및 자동 동기화 (Foreground Execution)
  // [CRITICAL] Vercel 서버리스 시간 제한을 극복하기 위해 로더 단계에서 확실히 수행
  let recentConversations: any[] = [];
  if (session) {
    try {
      const { ensureNearWallet } = await import("~/lib/near/wallet.server");
      const walletId = await ensureNearWallet(session.user.id);
      if (walletId) {
        console.log(`[Home Loader] Wallet sync/recovery completed for: ${walletId}`);
      }
    } catch (walletError) {
      console.error(`[Home Loader] Wallet sync failed but continuing:`, walletError);
    }

    recentConversations = await db.query.conversation.findMany({
      where: eq(schema.conversation.userId, session.user.id),
      with: {
        character: {
          with: {
            media: {
              orderBy: [asc(schema.characterMedia.sortOrder)]
            }
          }
        },
        messages: {
          orderBy: [desc(schema.message.createdAt)],
          limit: 1,
        },
      },
      orderBy: [desc(schema.conversation.updatedAt)],
      limit: 5,
    });
  }

  // 모든 캐릭터 가져오기
  const allCharacters = await db.query.character.findMany({
    with: {
      media: {
        orderBy: [asc(schema.characterMedia.sortOrder)]
      },
    }
  });

  // Today's Pick: Fetch from dynamic system settings (fallback to 'rina' if or first if not set)
  const todaysPickSetting = await db.query.systemSettings.findFirst({
    where: eq(schema.systemSettings.key, "TODAYS_PICK_ID")
  });
  const todaysPick = allCharacters.find(c => c.id === todaysPickSetting?.value) ||
    allCharacters.find(c => c.id === "rina") ||
    allCharacters[0];

  // Trending Idols: DB에 있는 캐릭터들 (최대 4개)
  const trendingIdols = allCharacters.slice(0, 4);

  // 공지사항 및 이벤트 가져오기
  const notices = await db.query.notice.findMany({
    where: eq(schema.notice.isActive, true),
    orderBy: [
      desc(schema.notice.isPinned),
      desc(schema.notice.createdAt)
    ],
    limit: 3
  });

  return Response.json({
    user: session?.user || null,
    todaysPick,
    recentConversations,
    trendingIdols,
    notices,
    isAuthenticated: !!session,
  });
}

export default function HomeScreen() {
  const { user, todaysPick, recentConversations, trendingIdols, notices, isAuthenticated } = useLoaderData<typeof loader>() as any;
  const navigate = useNavigate();

  const handleStartChat = async (characterId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
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
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = DateTime.now();
    const messageTime = DateTime.fromJSDate(new Date(date));
    const diff = now.diff(messageTime, ["minutes", "hours", "days"]);

    if (diff.minutes < 1) return "방금 전";
    if (diff.minutes < 60) return `${Math.floor(diff.minutes)}분 전`;
    if (diff.hours < 24) return `${Math.floor(diff.hours)}시간 전`;
    if (diff.days < 7) return `${Math.floor(diff.days)}일 전`;
    return messageTime.toFormat("MM/dd");
  };

  const getCharacterFromConversation = (conversation: any) => {
    return conversation.character;
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display antialiased min-h-screen pb-24 max-w-md mx-auto shadow-2xl overflow-hidden">
      {/* Top App Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-white/5">
        <div className="flex flex-col">
          <h2 className="text-white text-xl font-extrabold leading-tight tracking-[-0.015em]">AI Chat</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/chats")}
            className="text-white hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
          <button className="relative text-white hover:text-primary transition-colors mr-1">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary ring-2 ring-background-dark"></span>
          </button>
          <button
            onClick={() => navigate(isAuthenticated ? "/profile" : "/login")}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-white/10"
          >
            {isAuthenticated ? "Profile" : "Login"}
          </button>
        </div>
      </div>

      {/* Hero Section - Today's Pick */}
      <div className="p-4 pt-2">
        <div className="relative w-full overflow-hidden rounded-2xl bg-surface-dark shadow-lg">
          <div
            className="absolute inset-0 h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${todaysPick?.media
                ?.filter((m: any) => m.type === "COVER")
                ?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                || todaysPick?.media?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                })`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent"></div>
          <div className="relative flex min-h-[420px] flex-col justify-end p-6">
            <span className="mb-2 inline-flex w-fit items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary backdrop-blur-sm border border-primary/30">
              ✨ Today's Pick
            </span>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white mb-1">
              {todaysPick.name}
            </h1>
            <p className="text-base text-gray-200 font-medium mb-6 line-clamp-2">
              "{todaysPick.bio}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleStartChat(todaysPick.id)}
                className="flex-1 cursor-pointer items-center justify-center rounded-xl h-12 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                Chat Now
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all">
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => navigate("/chats")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-primary">
              <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
            </div>
            <span className="text-xs font-medium text-gray-300">New Chat</span>
          </button>
          <button
            onClick={() => navigate("/missions")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#FFD700]">
              <span className="material-symbols-outlined text-[28px]">redeem</span>
            </div>
            <span className="text-xs font-medium text-gray-300">Missions</span>
          </button>
          <button
            onClick={() => navigate("/fandom")}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#4CAF50]">
              <span className="material-symbols-outlined text-[28px]">photo_library</span>
            </div>
            <span className="text-xs font-medium text-gray-300">Gallery</span>
          </button>
          <button className="flex flex-col items-center gap-2 group">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-white/10 group-active:scale-95 transition-all text-[#2196F3]">
              <span className="material-symbols-outlined text-[28px]">storefront</span>
            </div>
            <span className="text-xs font-medium text-gray-300">Shop</span>
          </button>
        </div>
      </div>

      {/* Continue Chatting */}
      {recentConversations.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold">Continue Chatting</h2>
            <button
              onClick={() => navigate("/chats")}
              className="text-primary text-sm font-semibold"
            >
              View All
            </button>
          </div>
          {recentConversations.slice(0, 1).map((conversation: any) => {
            const character = getCharacterFromConversation(conversation);
            const lastMessage = conversation.Message?.[0];
            return (
              <button
                key={conversation.id}
                onClick={() => navigate(`/chat/${conversation.id}`)}
                className="w-full flex items-center gap-4 rounded-xl bg-surface-dark p-4 border border-white/5 active:bg-white/5 transition-colors text-left"
              >
                <div className="relative">
                  <img
                    alt={`Avatar of ${character.name}`}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/50"
                    src={
                      character.media
                        ?.filter((m: any) => m.type === "AVATAR")
                        ?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                      || character.media?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                    }
                  />
                  {character.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-surface-dark"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-white font-bold truncate">{character.name}</h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-gray-400 text-sm truncate">
                      {lastMessage.content}
                    </p>
                  )}
                </div>
                <span className="material-symbols-outlined text-gray-500 text-sm">chevron_right</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Trending Idols */}
      <div className="pb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-white text-lg font-bold">Trending Idols</h2>
          <span className="material-symbols-outlined text-gray-400">trending_up</span>
        </div>
        <div className="flex overflow-x-auto px-4 gap-4 pb-4 scrollbar-hide snap-x">
          {(trendingIdols as any[]).map((character: any, index: number) => (
            <button
              key={character.id}
              onClick={() => navigate(`/character/${character.id}`)}
              className="snap-center shrink-0 w-[140px] flex flex-col gap-2 group cursor-pointer"
            >
              <div className="relative h-[180px] w-full rounded-xl overflow-hidden">
                <img
                  alt={character.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={
                    character.media
                      ?.filter((m: any) => m.type === "COVER")
                      ?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                    || character.media?.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0]?.url
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFD700] text-black text-xs font-bold">
                  {index + 1}
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1 text-xs text-white/80 mb-0.5">
                    <span className="material-symbols-outlined text-[12px] text-primary">favorite</span>
                    <span>{Math.floor(Math.random() * 5000 + 5000)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">{character.name}</h3>
                <p className="text-gray-500 text-xs">{character.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* News & Events */}
      <div className="px-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-bold">News & Events</h2>
          <button
            onClick={() => navigate("/notices")}
            className="text-primary text-xs font-bold uppercase tracking-widest"
          >
            See All
          </button>
        </div>
        <div className="space-y-4">
          {notices.length === 0 ? (
            <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
              <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em]">No official updates yet</p>
            </div>
          ) : (
            (notices as any[]).map((notice) => (
              <div
                key={notice.id}
                onClick={() => navigate(`/notices/${notice.id}`)}
                className="relative overflow-hidden rounded-xl bg-surface-dark border border-white/5 active:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="h-28 w-full sm:w-28 shrink-0 bg-cover bg-center bg-gradient-to-br from-primary/30 to-purple-600/30">
                    {notice.imageUrl && <img src={notice.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white",
                        notice.type === "EVENT" ? "bg-emerald-500" : notice.type === "NEWS" ? "bg-blue-600" : "bg-primary"
                      )}>
                        {notice.type}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {DateTime.fromJSDate(new Date(notice.createdAt)).toFormat("LLL dd")}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors truncate">{notice.title}</h3>
                    <p className="text-gray-400 text-[11px] line-clamp-1 leading-relaxed">{notice.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
