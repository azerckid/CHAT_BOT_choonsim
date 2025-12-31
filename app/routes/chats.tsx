import { useState } from "react";
import { Link } from "react-router";
import { ChatListItem } from "~/components/chat/ChatListItem";
import { OnlineIdolList } from "~/components/chat/OnlineIdolList";
import { BottomNavigation } from "~/components/layout/BottomNavigation";
import { ChatListSkeleton } from "~/components/chat/ChatListSkeleton";
import { NetworkError } from "~/components/ui/NetworkError";
import { ApiError } from "~/components/ui/ApiError";
import { cn } from "~/lib/utils";

type LoadingState = "idle" | "loading" | "error" | "network-error";

export default function ChatListScreen() {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");

  const handleRetry = () => {
    setLoadingState("loading");
    // TODO: 재시도 로직 (Phase 2)
    setTimeout(() => {
      setLoadingState("idle");
    }, 1000);
  };
  // TODO: 실제 데이터로 교체
  const onlineIdols = [
    {
      id: "mina",
      name: "Mina",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD6dA-SVTr0ytH2Pt9yG6hyUa97f3KkA-0vn9buUm3UGQv7uHa4839D-z3n7SpBmNB-ykCrx878EcYEShcpLmSpdPC73vjnhrYJBIHwIwrRI4RpFQ1XsIKppF0eyt9upWcXJVYuP91dHXFW7DME0H9M03LGiCLhYbEUmEI1q-4pYgGIYeN2BkaGwF3C60FBq2CXM8M-1WSYzzadvkwvg8TO5vu119iHimWsPZzKFZgpdclubGThgTbSd3gS8y4C_V38mXiGOj8RrV4",
      isOnline: true,
    },
    {
      id: "yuna",
      name: "Yuna",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDcGeVgBHHjHp0VDAX_TZ-mwcpWaBh53oWJ2cZFdejZRp2YfIJwLSKx37bvjO6NQDNfTKKdC7OU7cSUZHQ4T8BvxUs07NWomELTdajFQWWen12frWqDrxf00ChNdouM232AgmI3NxjWWxFIaCWeAJ6CeAzWGRPZKTK3_s2JedpDFZd5L7GLHEaz4YRzHIZo6atU9g-OQCgxBK_eeVkyWGPR3mFYNbi-ZFC_4lawCy8Sx-Gm8xu0kw3ONHaKEAJyebxNtkj8klBiyO8",
      isOnline: true,
    },
    {
      id: "sora",
      name: "Sora",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBYUcbkdnWcKECtUAueoTWHqof53p1xRDgKqyChNT05vltykUlFfcJ5-uuz4FdcU-rryd-IKxZcMJ9K_uYB-uuCCcKT6ZzMWRySK3cgLnCMLT0gbMJZQd5lBwFa6HA_pIhMInDejfMRpZNBfG_gPGVd9aFM8kYCeZyAsmhwQvK4B4x9e37obyyaJBdsMJPpKh0B8zBjS3rsf1Ba0-Bu0FdUk5j0W31NDUxIT4l4DlhAxWY6vMQHJO2mLMrLidQ88ndK5DXzWqqkuKo",
      isOnline: false,
    },
    {
      id: "rina",
      name: "Rina",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBsPL5vOgr3ghnxRebShKndSKh-9PtlXg80mlkWKPkFVl4A5pAkkd_FfqFuNhAzjzq1-gXfgxWogLRVdQ5VlanxtP5yECG3c2N-9yi-YgDl2HnAj1dkobE3S405g4rusYIOCMSmqJloSoaA_XjQYkrOd9s_vGfJcbvzOcy1rH3bohcoziN0NUDbMDdJ6LnWGHoUGLiBRsF48rmKt6FTStF8iCrI_eEQhpqoFGRLWGKii2y9_Egzm-MN9MzsxshLh_f6VE4NxDFsEto",
      isOnline: false,
    },
    {
      id: "hana",
      name: "Hana",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAiCiL8icj8x6dKJLHVARRgW2ecR6c9iPhq5pJhuDoyiXUto2x46i0xibYi2aqJY1KGb_Z0gv3bzl52XxXOXK8LWi3UgHMCcyo6SC8chSm9gXpBc1SWyZJifDGEZQTA4GwDig6rFhShAIROU4xSXp8ZYobyq8-jJ8r7mrmZuJ9ScMAMHN_zjQaicgWKxSxK5_DhYrnqPGVmf3BwyEU30k23n6zt6gxqv0LcJfBJppY7MbAa8sJNvy1yP5Oil2sHJ4SQsZl5fGnkLKI",
      isOnline: false,
    },
  ];

  const chats = [
    {
      id: "mina",
      name: "Mina",
      lastMessage: "Did you eat lunch yet? Don't skip meals! 🍱",
      timestamp: "2m ago",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBRacfNvd6pod7eV1xa3mAZYSbYZtXrzvxn24bSODGryQiW75cgPFHklL_nmeMh5c88dvNUcdZcnHgZJwjuH_dlpapDVMyfCkoaN-1Cu_Jov3LCZHwCeTDEkeVDEnAIbUDPEwN46C-YlhcWjWaSvO4blYSrynHTb4gS9HHfsbyBHiPv1iIl9rwdAzftzXnqZOYH8dn5RE8BLg290uGmTJCl4-d3rrE8gMthQsl8OrSmhzMwjM2WhfSJKT2V731V8KAZtbU8YZ7ZqM8",
      unreadCount: 2,
      isRead: false,
      isOnline: true,
      messageType: "voice" as const,
    },
    {
      id: "yuna",
      name: "Yuna",
      lastMessage: "I was thinking about our conversation yesterday...",
      timestamp: "1h ago",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAdmKt733dYkdgpcx-NaIAieCHmCRhuBpgvQsx_ukXhu5z7-IFkVnCpeGvXxcwSH1tXMObs9sKnkegQYV3RoGMJgvgKU19D5tPaqVNJyBFFv40NHmLmKNXQRpmX9tM2rt0UFxkB-4HO-iGVK1KRH2gn38Z3eWViL7fbo8lRE_f-yXknyI7yJuYlBN6zm6uKU8Is0E5mMbulkpli1VO41shdJoN0G6z_4vy9_Kp6fV3Pt7XHaEvbb03bL19g4F7cGHOwFvIbpeISzbM",
      unreadCount: 1,
      isRead: false,
      isOnline: true,
      messageType: "music" as const,
    },
    {
      id: "sora",
      name: "Sora",
      lastMessage: "Thank you for cheering me on! 💖",
      timestamp: "Yesterday",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDOjrsEBs9QagTIrlePj-yfRwUWQkABT1anBTpJ99vKy_QXSl-N0mLpvebYh3G5DvoNs3zmv7zoqC08QALWqDrEga-vIb2a5E7QuwiAKqIkH5Adwzdo5kZAbu-llgGt4I96JHqY9g77l4dzx9_AGvjYm79hh9kDYfqDpMQoa6K66JWSSgDqxv2SjZ3KUtUXvrUx8wKsUdjL5wAnpRRnSMzdj8lATKw31fhLHyu2KGH6Yc7aWfth6kuxACuB9yLRH10JcmU0geVyzeo",
      isRead: true,
      isOnline: false,
    },
    {
      id: "rina",
      name: "Rina",
      lastMessage: "Sent a photo 📷",
      timestamp: "Yesterday",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBiTFT-kf8h6aQdjG-h80WmvT78Y0NC95oxshX_TeF4nKAt9EFtDTQU46bpFRrKV-r_w5Q9FtdENTZFitH73hh27Wm6rR5LG_8TCxuqWAjF6fQg2gSAt4pcALyYH_l7lz38V9ZZ5hlmYh6IJyCO1wJPZZFoM_ZGOmw7utCCp-z7G6IKSSpCraJDhobhpJgl0q59qNjTEausu6Oojvy0ARGb1sHVBHJuYuHj93P1d3UFM7sCLfeYlWjzcH8K2MegHMPQZnFYr56gvwo",
      isRead: true,
      isOnline: false,
      messageType: "photo" as const,
    },
    {
      id: "hana",
      name: "Hana",
      lastMessage: "I'll release a new cover song soon...",
      timestamp: "2 days ago",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDcJn5WTVd2bk4g49l7LDyHoozhCGk7SjZOHDQb-q6z4Y3Am_ScmyU5THpThALK6-mk-WJUype7kJNHaAxhmlysd8svlhckgKDeAsUhL1aLieNpKFBv3vxUBLyasJXot2qXHgJz1KR-ymytETpxpjE1IHlkYRKZXKbwaftt2sH1bmiH3JRgAkoVCTTGSOJC2J1gGhRR1-Nwx4MupnI-JzyjH4W3Vr4he8UCC-bwqpmcBmw5hMknJN3OIJ1L-Mi-Awcr-R3C5qJYup4",
      isRead: true,
      isOnline: false,
    },
  ];

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
        onIdolClick={(id) => {
          // TODO: 채팅 화면으로 이동
          console.log("Navigate to chat:", id);
        }}
        onAddClick={() => {
          // TODO: 새 채팅 시작
          console.log("Start new chat");
        }}
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
        ) : (
          chats.map((chat) => <ChatListItem key={chat.id} {...chat} />)
        )}
      </main>

      <button className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
        <span className="material-symbols-outlined text-2xl">add_comment</span>
      </button>

      <BottomNavigation />

      <div className="pointer-events-none fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent z-10" />
    </div>
  );
}

