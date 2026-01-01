import { Link } from "react-router";

interface ChatHeaderProps {
  characterName: string;
  characterId?: string;
  isOnline?: boolean;
  statusText?: string;
  onBack?: () => void;
  onDeleteChat?: () => void;
  onResetChat?: () => void;
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function ChatHeader({
  characterName,
  characterId,
  isOnline = true,
  statusText = "Online now",
  onBack,
  onDeleteChat,
  onResetChat,
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
            {characterId ? (
              <Link
                to={`/character/${characterId}`}
                className="text-lg font-bold leading-tight hover:underline"
              >
                {characterName}
              </Link>
            ) : (
              <h1 className="text-lg font-bold leading-tight">{characterName}</h1>
            )}
            {isOnline && (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            )}
          </div>
          <span className="text-[11px] text-primary font-bold uppercase tracking-widest mt-0.5">
            {statusText}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex items-center justify-center text-slate-600 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDeleteChat} variant="destructive">
              <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
              대화방 삭제
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onResetChat}>
              <span className="material-symbols-outlined mr-2 text-[18px]">restart_alt</span>
              대화 초기화 (기억 포함)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

