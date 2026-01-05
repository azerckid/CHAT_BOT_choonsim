import { useState } from "react";
import { cn } from "~/lib/utils";
import { ITEMS } from "~/lib/items";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface GiftSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onGift: (itemId: string, amount: number) => Promise<void>;
    userCredits: number;
    ownedHearts?: number;
}

export function GiftSelector({ isOpen, onClose, onGift, userCredits, ownedHearts = 0 }: GiftSelectorProps) {
    const [selectedAmount, setSelectedAmount] = useState(1);
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const item = ITEMS.HEART;

    // Logic: If user has enough hearts in inventory, cost is 0 credits.
    const useInventory = ownedHearts >= selectedAmount;
    const totalCost = useInventory ? 0 : item.priceCredits * selectedAmount;
    const canAfford = useInventory ? true : userCredits >= totalCost;

    const handleGift = async () => {
        // 1. Inventory Check
        if (useInventory) {
            setIsSending(true);
            try {
                await onGift(item.id, selectedAmount);
                onClose();
            } catch (error) {
                console.error("Gift error:", error);
                toast.error("Failed to send gift");
            } finally {
                setIsSending(false);
            }
            return;
        }

        // 2. Purchase Flow (if not using inventory)
        if (!canAfford) {
            toast.error("Not enough credits to purchase hearts.");
            return;
        }

        setIsSending(true);
        try {
            // A. Purchase Heart
            const purchaseRes = await fetch("/api/items/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id, quantity: selectedAmount })
            });

            if (!purchaseRes.ok) {
                const data = await purchaseRes.json();
                throw new Error(data.error || "Purchase failed");
            }

            // B. Send Gift (now we have inventory)
            await onGift(item.id, selectedAmount);
            onClose();
        } catch (error: any) {
            console.error("Transaction error:", error);
            toast.error(error.message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="absolute bottom-20 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white dark:bg-[#1A1821] border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h3 className="text-lg font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">
                            Send <span className="text-primary">{item.name}</span>
                        </h3>
                        <p className="text-xs text-gray-500 font-bold">
                            보유: <span className="text-primary">{ownedHearts}개</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-[30px] bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {item.iconUrl}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 w-full">
                        {[1, 5, 10, 50].map((num) => (
                            <button
                                key={num}
                                onClick={() => setSelectedAmount(num)}
                                className={cn(
                                    "py-3 rounded-2xl text-xs font-black transition-all border",
                                    selectedAmount === num
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105"
                                        : "bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-white/10"
                                )}
                            >
                                x{num}
                            </button>
                        ))}
                    </div>

                    <div className="w-full space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Cost</span>
                            <div className="flex items-center gap-1">
                                {useInventory ? (
                                    <span className="text-sm font-black italic text-green-500">
                                        보유 아이템 사용 ({ownedHearts}개 → {ownedHearts - selectedAmount}개)
                                    </span>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-yellow-500 text-sm">monetization_on</span>
                                        <span className={cn("text-sm font-black italic", canAfford ? "text-slate-900 dark:text-white" : "text-red-500")}>
                                            {totalCost.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">Credits</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleGift}
                            disabled={isSending || (!canAfford && !useInventory)}
                            className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-2xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                    {useInventory
                                        ? "SEND GIFT"
                                        : canAfford
                                            ? "BUY & SEND"
                                            : "INSUFFICIENT CREDITS"
                                    }
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
