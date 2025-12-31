import { cn } from "~/lib/utils";

interface MessageBubbleProps {
  content: string;
  sender: "user" | "ai";
  senderName?: string;
  timestamp?: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  className?: string;
}

export function MessageBubble({
  content,
  sender,
  senderName,
  timestamp,
  avatarUrl,
  showAvatar = true,
  className,
}: MessageBubbleProps) {
  const isUser = sender === "user";

  if (isUser) {
    return (
      <div className={cn("flex items-end gap-3 justify-end group", className)}>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary p-1 order-1">
          <span className="material-symbols-outlined text-[18px]">favorite</span>
        </button>
        <div className="flex flex-col gap-1 items-end max-w-[75%] order-2">
          <div className="px-5 py-3 bg-slate-900 dark:bg-primary text-white rounded-2xl rounded-tr-sm shadow-md dark:shadow-primary-glow text-[15px] leading-relaxed">
            {content}
          </div>
          {timestamp && (
            <span className="text-[11px] text-gray-400 dark:text-white/30 mr-1">
              {timestamp}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-3 group", className)}>
      {showAvatar && (
        <div className="w-10 h-10 shrink-0 rounded-full bg-gray-300 dark:bg-surface-dark overflow-hidden border border-white/10 relative">
          {avatarUrl ? (
            <img
              alt={senderName || "AI profile"}
              className="w-full h-full object-cover"
              src={avatarUrl}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
          )}
        </div>
      )}
      <div className="flex flex-col gap-1 items-start max-w-[75%]">
        {senderName && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
            {senderName}
          </span>
        )}
        <div className="px-5 py-3 bg-gray-100 dark:bg-surface-dark rounded-2xl rounded-tl-sm text-slate-800 dark:text-gray-100 shadow-sm text-[15px] leading-relaxed relative">
          {content}
        </div>
      </div>
      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-600 hover:text-primary dark:hover:text-primary p-1">
        <span className="material-symbols-outlined text-[18px]">favorite</span>
      </button>
    </div>
  );
}

