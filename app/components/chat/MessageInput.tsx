import { useState } from "react";
import { cn } from "~/lib/utils";

interface MessageInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MessageInput({
  onSend,
  placeholder = "메시지를 입력하세요...",
  disabled = false,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled && onSend) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer
      className={cn(
        "flex-none bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-white/5 pb-8 pt-2 px-3",
        className
      )}
    >
      <div className="flex items-end gap-2 p-2">
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[28px]">add_circle</span>
        </button>
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-[24px] min-h-[48px] flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors shadow-sm">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-none text-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 text-[15px] leading-normal p-0 font-display"
          />
          <button
            type="button"
            className="text-gray-400 hover:text-yellow-500 transition-colors ml-2 flex items-center justify-center"
          >
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
        </button>
      </div>
    </footer>
  );
}

