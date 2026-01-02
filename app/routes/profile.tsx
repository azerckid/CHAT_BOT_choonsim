import { BottomNavigation } from "~/components/layout/BottomNavigation";
import { auth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useNavigate } from "react-router";
import { signOut } from "~/lib/auth-client";
import { toast } from "sonner";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // TODO: 실제 통계 데이터 가져오기 (함께한 날, 친밀도, 하트 등)
  // 현재는 임시 데이터
  const stats = {
    daysTogether: 34,
    affinityLevel: 88,
    hearts: 1200,
  };

  return Response.json({ user, stats });
}

export default function ProfileScreen() {
  const { user, stats } = useLoaderData<typeof loader>() as { user: any; stats: any };
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("로그아웃되었습니다");
            navigate("/home");
          },
        },
      });
    } catch (err) {
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none z-0" />

      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-background-dark/70 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-base font-bold tracking-tight text-white/90">마이페이지</h1>
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col z-10 pb-24">
        {/* Profile Header */}
        <section className="flex flex-col items-center pt-8 pb-6 px-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-28 h-28 rounded-full p-[3px] bg-background-dark">
              <div
                className="w-full h-full rounded-full bg-cover bg-center overflow-hidden border-2 border-surface-highlight"
                style={{
                  backgroundImage: `url(${user?.avatarUrl || user?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCutVt4neD3mw-fGim_WdODfouQz3b0aaqpPfx1sNTt8N75jfKec3kNioEoZugl2D0eqVP5833PF21_hTqlDz38aVNUICprwHAM45vTdJeUPcA0mj_wzSgkMVSzYiv-RCJhNyAAZ0RlWSJQxzSa8Mi-yYPu-czB9WEbQsDFEjcAQwezmcZqtAbSB5bwyRhTTfr1y2rrxDHIFNN2G2fVmkHcCWo7uvVNjtAehxS8fgGKMbJgQ59q1ClGgD--3EuZR6f_esg0NbdGCao'})`,
                }}
              />
              {/* Edit Badge */}
              <button className="absolute bottom-0 right-0 p-2 bg-surface-highlight border-4 border-background-dark rounded-full text-white hover:bg-primary transition-colors shadow-lg">
                <span className="material-symbols-outlined text-[16px] block">edit</span>
              </button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              {user?.name || "사용자"}
            </h2>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center items-center mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                LUNA's Fan
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  diamond
                </span>
                Lv. 5 Soulmate
              </span>
            </div>
            <p className="text-white/60 text-sm mt-3 px-4 line-clamp-2">
              "오늘도 루나와 함께 힘내자! 🌙✨"
            </p>
          </div>
        </section>

        {/* Stats Dashboard */}
        <section className="px-4 mb-6">
          <div className="bg-surface-dark/50 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="flex flex-col items-center gap-1 px-2">
                <span className="text-2xl font-bold text-white tracking-tight">{stats.daysTogether}일</span>
                <span className="text-xs text-white/50 font-medium">함께한 날</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-2">
                <span className="text-2xl font-bold text-primary tracking-tight">Lv.{stats.affinityLevel}</span>
                <span className="text-xs text-white/50 font-medium">친밀도</span>
              </div>
              <div className="flex flex-col items-center gap-1 px-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {stats.hearts >= 1000 ? `${(stats.hearts / 1000).toFixed(1)}k` : stats.hearts}
                </span>
                <span className="text-xs text-white/50 font-medium">보유 하트</span>
              </div>
            </div>
          </div>
        </section>

        {/* Account Management Section */}
        <div className="px-4 space-y-6">
          {/* Group 1: Account & Payment */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">계정 관리</h3>
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
              {/* List Item */}
              <button
                onClick={() => navigate("/profile/edit")}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-10 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">프로필 수정</p>
                  <p className="text-xs text-white/50 truncate">닉네임, 상태메시지 변경</p>
                </div>
                <span className="material-symbols-outlined text-white/30">chevron_right</span>
              </button>
              <div className="h-px bg-white/5 mx-4" />
              {/* List Item */}
              <button
                onClick={() => navigate("/profile/subscription")}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-10 rounded-xl bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">구독 및 결제 관리</p>
                  <p className="text-xs text-white/50 truncate">Premium 멤버십 관리</p>
                </div>
                <span className="material-symbols-outlined text-white/30">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Group 2: Activity */}
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">나의 활동</h3>
            <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
              {/* List Item */}
              <button
                onClick={() => navigate("/profile/saved")}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-10 rounded-xl bg-pink-500/20 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">저장된 순간들</p>
                  <p className="text-xs text-white/50 truncate">좋아요한 대화 및 사진</p>
                </div>
                <span className="material-symbols-outlined text-white/30">chevron_right</span>
              </button>
              <div className="h-px bg-white/5 mx-4" />
              {/* List Item */}
              <button
                onClick={() => navigate("/chats")}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-10 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">대화 기록</p>
                  <p className="text-xs text-white/50 truncate">지난 대화 다시보기</p>
                </div>
                <span className="material-symbols-outlined text-white/30">chevron_right</span>
              </button>
              <div className="h-px bg-white/5 mx-4" />
              {/* List Item */}
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center justify-center shrink-0 size-10 rounded-xl bg-teal-500/20 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-white truncate">알림 설정</p>
                  <p className="text-xs text-white/50 truncate">캐릭터 메시지 알림</p>
                </div>
                <span className="material-symbols-outlined text-white/30">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-4 text-center text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            로그아웃
          </button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
