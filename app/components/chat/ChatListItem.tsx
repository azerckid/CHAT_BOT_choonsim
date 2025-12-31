import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface ChatListItemProps {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatarUrl: string;
  unreadCount?: number;
  isRead?: boolean;
  isOnline?: boolean;
  messageType?: "text" | "voice" | "music" | "photo";
  className?: string;
}

export function ChatListItem({
  id,
  name,
  lastMessage,
  timestamp,
  avatarUrl,
  unreadCount,
  isRead = false,
  isOnline = false,
  messageType = "text",
  className,
}: ChatListItemProps) {
  const getMessageTypeIcon = () => {
    switch (messageType) {
      case "voice":
        return "mic";
      case "music":
        return "music_note";
      case "photo":
        return "image";
      default:
        return null;
    }
  };

  const icon = getMessageTypeIcon();
  const iconColorClass =
    messageType === "voice"
      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
      : messageType === "music"
        ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300"
        : "";

  return (
    <Link
      to={`/chat/${id}`}
      className={cn(
        "group relative flex items-center gap-4 p-3 rounded-2xl hover:bg-white hover:shadow-sm dark:hover:bg-surface-dark dark:hover:shadow-none transition-all cursor-pointer mb-1",
        className
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-14 h-14 rounded-xl bg-cover bg-center",
            !isOnline && "grayscale-[20%]"
          )}
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
        {icon && (
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark p-[2px] rounded-full">
            <span
              className={cn(
                "material-symbols-outlined text-sm rounded-full p-0.5",
                iconColorClass
              )}
              style={{ fontSize: "14px" }}
            >
              {icon}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3
            className={cn(
              "text-base font-bold truncate",
              isRead
                ? "text-slate-700 dark:text-gray-200"
                : "text-slate-900 dark:text-white"
            )}
          >
            {name}
          </h3>
          <span
            className={cn(
              "text-xs font-medium",
              isRead
                ? "text-gray-400 dark:text-gray-500"
                : "text-slate-900 dark:text-primary"
            )}
          >
            {timestamp}
          </span>
        </div>
        <p
          className={cn(
            "text-sm font-medium truncate",
            isRead
              ? "text-slate-400 dark:text-gray-500"
              : "text-slate-600 dark:text-gray-300"
          )}
        >
          {lastMessage}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {unreadCount && unreadCount > 0 ? (
          <div className="w-5 h-5 bg-slate-900 dark:bg-primary rounded-full flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{unreadCount}</span>
          </div>
        ) : isRead ? (
          <span className="material-symbols-outlined text-base text-gray-400 dark:text-gray-600">
            done_all
          </span>
        ) : null}
      </div>
    </Link>
  );
}

