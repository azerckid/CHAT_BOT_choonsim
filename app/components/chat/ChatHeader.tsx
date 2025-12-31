import { Link } from "react-router";

interface ChatHeaderProps {
  characterName: string;
  isOnline?: boolean;
  statusText?: string;
  onBack?: () => void;
  onMenuClick?: () => void;
}

export function ChatHeader({
  characterName,
  isOnline = true,
  statusText = "Online now",
  onBack,
  onMenuClick,
}: ChatHeaderProps) {
  return (
    <header className="flex-none z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onBack}
          className="flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col items-center flex-1 mx-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold leading-tight">{characterName}</h1>
            {isOnline && (
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-primary font-medium tracking-wide">
            {statusText}
          </span>
        </div>
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
    </header>
  );
}

