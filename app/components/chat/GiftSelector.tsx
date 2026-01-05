import { useState } from "react";
import { cn } from "~/lib/utils";
import { ITEMS } from "~/lib/items";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface GiftSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onGift: (itemId: string, amount: number) => Promise<void>;
    onOpenStore: () => void;
    ownedHearts?: number;
}

export function GiftSelector({
    isOpen,
    onClose,
    onGift,
    onOpenStore,
    ownedHearts = 0
}: GiftSelectorProps) {
    const [selectedAmount, setSelectedAmount] = useState(1);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const item = ITEMS.HEART;
    const hasEnough = ownedHearts >= selectedAmount;

    const handleAction = async () => {
        if (!hasEnough) {
            onOpenStore();
            return;
        }

        setIsSending(true);
        try {
            await onGift(item.id, selectedAmount);
            onClose();
        } catch (error) {
            console.error("Gift error:", error);
            toast.error("선물 발송에 실패했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="absolute bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-[#1A1821]/95 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none">
                            Send <span className="text-primary">{item.name}</span>
                        </h3>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">
                            보유 수량: <span className="text-primary">{ownedHearts}개</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-6 relative z-10">
                    {/* Item Preview with Glow */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all" />
                        <div className="relative w-24 h-24 rounded-[30px] bg-[#2d1622] border border-white/5 flex items-center justify-center p-5 shadow-inner">
                            <span className="material-symbols-outlined text-primary text-5xl group-hover:scale-110 transition-transform duration-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {item.iconUrl}
                            </span>
                        </div>
                    </div>

                    {/* Amount Selector */}
                    <div className="grid grid-cols-4 gap-3 w-full">
                        {[1, 10, 50, 100].map((num) => (
                            <button
                                key={num}
                                onClick={() => setSelectedAmount(num)}
                                className={cn(
                                    "py-3 rounded-[18px] text-[11px] font-black tracking-tighter transition-all border",
                                    selectedAmount === num
                                        ? "bg-primary border-primary text-black shadow-[0_0_20px_rgba(238,43,140,0.4)] scale-105"
                                        : "bg-white/3 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                x{num}
                            </button>
                        ))}
                    </div>

                    <div className="w-full space-y-4 pt-2">
                        {/* Status Message */}
                        {!hasEnough && (
                            <p className="text-center text-[10px] font-bold text-red-500/80 bg-red-500/5 py-2 rounded-xl border border-red-500/10">
                                보유한 하트가 부족합니다. 충전 후 선물해주세요.
                            </p>
                        )}

                        <button
                            onClick={handleAction}
                            disabled={isSending}
                            className={cn(
                                "w-full h-15 rounded-[20px] font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95",
                                hasEnough
                                    ? "bg-primary text-black shadow-primary/20 hover:shadow-primary/40"
                                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                            )}
                        >
                            {isSending ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {hasEnough ? "send" : "add_circle"}
                                    </span>
                                    {hasEnough ? "선물 보내기" : "하트 충전하러 가기"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
