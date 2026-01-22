import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // 환영 메시지가 나타난 후 춘심의 첫 인사 표시
    const timer1 = setTimeout(() => {
      setShowMessage(true);
    }, 1000);

    // 3초 후 메인 채팅 목록으로 이동 (기존 페르소나 선택 단계 제거)
    const timer2 = setTimeout(() => {
      navigate("/chats");
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [navigate]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-md mx-auto px-6 md:max-w-lg lg:max-w-xl">
        {/* 춘심 아바타 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-4 border-primary/30 overflow-hidden shadow-[0_0_30px_rgba(238,43,140,0.3)] animate-pulse-slow">
              <img
                alt="춘심"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8XkiSD530UZKl37CoghVbq1qhTYUznUuQFA8dC8rGZe9VuKJsQzUHPgEOQJgupAoHDwO_ZIMC3G_bFGNvaHQ6PSySe2kGq-OJg-IHNH36ByOLEdNchZk1bnNuAxFmnVtxRjKZ5r3Ig5IyQz_moPPFVxD9suAIS4970ggd9cHE5tiLupgMBUCcvc_nJZxpSztEWzQ8QH_JoQ88WdEig0P_Jnj66eHhxORy45NPUNxo-32nkwobvofGqKLRQ2xyrx2QdJZPnhDk4UA"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background-light dark:border-background-dark shadow-lg animate-pulse" />
          </div>
        </div>

        {/* 환영 메시지 */}
        <div
          className={cn(
            "text-center mb-8 transition-opacity duration-1000",
            showWelcome ? "opacity-100" : "opacity-0"
          )}
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
            환영해요! 🎉
          </h1>
          <p className="text-lg text-slate-600 dark:text-gray-400">
            춘심과의 특별한 만남이 시작됩니다
          </p>
        </div>

        {/* 춘심의 첫 인사 */}
        <div
          className={cn(
            "transition-all duration-1000",
            showMessage
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          )}
        >
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-surface-dark overflow-hidden border border-white/10 shrink-0">
                <img
                  alt="춘심"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8XkiSD530UZKl37CoghVbq1qhTYUznUuQFA8dC8rGZe9VuKJsQzUHPgEOQJgupAoHDwO_ZIMC3G_bFGNvaHQ6PSySe2kGq-OJg-IHNH36ByOLEdNchZk1bnNuAxFmnVtxRjKZ5r3Ig5IyQz_moPPFVxD9suAIS4970ggd9cHE5tiLupgMBUCcvc_nJZxpSztEWzQ8QH_JoQ88WdEig0P_Jnj66eHhxORy45NPUNxo-32nkwobvofGqKLRQ2xyrx2QdJZPnhDk4UA"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">춘심</p>
                <div className="px-5 py-3 bg-white dark:bg-surface-dark rounded-2xl rounded-tl-sm text-slate-800 dark:text-gray-100 shadow-sm text-[15px] leading-relaxed">
                  어? 왔어? 기다리고 있었잖아! 💕
                  <br />
                  <br />
                  이제부터 우리만의 특별한 시간을 가져볼까?
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

