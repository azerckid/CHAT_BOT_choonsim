import { useState } from "react";
import { useNavigate } from "react-router";
import { cn } from "~/lib/utils";

type PersonaMode = "idol" | "lover" | "hybrid";

interface PersonaOption {
  id: PersonaMode;
  title: string;
  description: string;
  example: string;
  icon: string;
  gradient: string;
}

const personaOptions: PersonaOption[] = [
  {
    id: "idol",
    title: "아이돌 모드",
    description: "팬과 아이돌의 관계로 대화합니다",
    example: "오늘 공연 어땠어요? 팬 여러분 덕분에 힘이 났어요!",
    icon: "star",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    id: "lover",
    title: "애인 모드",
    description: "연인처럼 친밀하게 대화합니다",
    example: "오늘 하루는 어땠어? 많이 힘들진 않았어?",
    icon: "favorite",
    gradient: "from-pink-500/20 to-red-500/20",
  },
  {
    id: "hybrid",
    title: "하이브리드 모드",
    description: "상황에 따라 자연스럽게 전환됩니다",
    example: "공연도 좋지만, 너와의 시간이 더 소중해 💕",
    icon: "auto_awesome",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
];

export default function PersonaSelectionScreen() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<PersonaMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (mode: PersonaMode) => {
    setSelectedMode(mode);
  };

  const handleConfirm = async () => {
    if (!selectedMode) return;

    setIsSubmitting(true);
    
    try {
      // TODO: 페르소나 모드 저장 (Phase 2)
      console.log("Selected persona mode:", selectedMode);
      
      // 임시: 성공 시 채팅 화면으로 이동
      setTimeout(() => {
        setIsSubmitting(false);
        navigate("/chats");
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Failed to save persona mode:", err);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md p-4 justify-between border-b border-gray-200 dark:border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10">
          페르소나 모드 선택
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              어떤 관계로 대화하고 싶어?
            </h2>
            <p className="text-slate-600 dark:text-gray-400">
              원하는 모드를 선택하면 춘심이 그에 맞게 대화할 거야
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {personaOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={isSubmitting}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 transition-all text-left",
                  "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                  selectedMode === option.id
                    ? "border-primary bg-primary/10 shadow-lg scale-[1.02]"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-surface-dark",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      option.gradient,
                      selectedMode === option.id && "ring-2 ring-primary"
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined text-3xl",
                        selectedMode === option.id ? "text-primary" : "text-gray-400 dark:text-gray-500"
                      )}
                      style={
                        selectedMode === option.id
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {option.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-xs text-slate-500 dark:text-gray-400 italic">
                      "{option.example}"
                    </div>
                  </div>
                  {selectedMode === option.id && (
                    <div className="shrink-0">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        check_circle
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedMode || isSubmitting}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>설정 중...</span>
              </>
            ) : (
              <>
                <span>시작하기</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

