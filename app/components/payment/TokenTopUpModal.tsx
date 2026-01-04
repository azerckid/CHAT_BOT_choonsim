import { useState, useEffect } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { useFetcher, useRevalidator } from "react-router";
import { CREDIT_PACKAGES } from "~/lib/subscription-plans";
import { cn } from "~/lib/utils";

interface TokenTopUpModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    paypalClientId?: string; // Optional since it comes from loader
}

export function TokenTopUpModal({
    open,
    onOpenChange,
    trigger,
    paypalClientId,
}: TokenTopUpModalProps) {
    const [selectedPackageId, setSelectedPackageId] = useState<string>(
        CREDIT_PACKAGES[1].id
    ); // Default to Medium pack
    const fetcher = useFetcher<{ success: boolean; newCredits?: number; error?: string }>();
    const revalidator = useRevalidator();

    // fetcher 결과 모니터링 및 처리
    // useEffect를 사용하여 렌더링 중 상태 업데이트 방지
    useEffect(() => {
        if (fetcher.data?.success) {
            toast.success(`Successfully added ${fetcher.data.newCredits} credits!`);
            if (onOpenChange) onOpenChange(false);

            // 명시적 데이터 갱신 (Optional, useFetcher가 자동으로 트리거하지만 확실하게 하기 위함)
            revalidator.revalidate();

            // 성공 후 fetcher 데이터 초기화 등이 필요하다면 여기서 처리 가능
            // 하지만 useFetcher는 다음 submit까지 데이터를 유지하므로 상관없음
        } else if (fetcher.data?.error) {
            toast.error(fetcher.data.error);
        }
    }, [fetcher.data, onOpenChange, revalidator]);

    const handleApprove = async (data: any, actions: any) => {
        // 캡쳐 API 호출
        const formData = new FormData();
        formData.append("orderId", data.orderID);
        formData.append("packageId", selectedPackageId);

        fetcher.submit(formData, {
            method: "post",
            action: "/api/payment/capture-order",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] bg-background-dark border-white/10 text-white p-0 gap-0 overflow-hidden shadow-2xl rounded-3xl">
                <DialogHeader className="p-6 bg-surface-dark/50 backdrop-blur-md border-b border-white/5">
                    <DialogTitle className="text-xl font-bold tracking-tight text-white">Top Up Credits</DialogTitle>
                    <DialogDescription className="text-white/50 text-sm">
                        AI 캐릭터와 대화하기 위한 크레딧을 충전하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
                    <div className="grid grid-cols-1 gap-3">
                        {CREDIT_PACKAGES.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={cn(
                                    "relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                                    selectedPackageId === pkg.id
                                        ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(238,43,140,0.15)]"
                                        : "bg-surface-dark border-white/5 hover:border-white/10 hover:bg-white/5"
                                )}
                                onClick={() => setSelectedPackageId(pkg.id)}
                            >
                                {pkg.isPopular && (
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
                                        Popular
                                    </div>
                                )}
                                <div className="flex flex-col gap-1">
                                    <span className={cn(
                                        "text-base font-bold transition-colors",
                                        selectedPackageId === pkg.id ? "text-primary" : "text-white"
                                    )}>
                                        {pkg.name}
                                    </span>
                                    {pkg.bonus > 0 && (
                                        <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">verified</span>
                                            +{pkg.bonus.toLocaleString()} Bonus
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-xl font-bold text-white tracking-tight">
                                            {pkg.credits.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-white/50">C</span>
                                    </div>
                                    <div className="text-sm font-semibold text-white/70">
                                        ${pkg.price}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-6">
                        {/* 결제 섹션: PayPal iframe의 흰색 배경을 자연스럽게 수용하기 위해 Light Card 스타일 적용 */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            {paypalClientId ? (
                                <PayPalScriptProvider options={{
                                    clientId: paypalClientId,
                                    currency: "USD",
                                    intent: "capture",
                                }}>
                                    <div className="relative z-0">
                                        <PayPalButtons
                                            style={{
                                                layout: "vertical",
                                                shape: "rect",
                                                borderRadius: 12,
                                                height: 48,
                                                color: "gold",
                                                label: "pay"
                                            }}
                                            className="relative z-0"
                                            forceReRender={[selectedPackageId]}
                                            createOrder={async (data, actions) => {
                                                const response = await fetch("/api/payment/create-order", {
                                                    method: "POST",
                                                    headers: {
                                                        "Content-Type": "application/x-www-form-urlencoded",
                                                    },
                                                    body: new URLSearchParams({
                                                        packageId: selectedPackageId
                                                    })
                                                });
                                                const result = await response.json();
                                                if (result.error) {
                                                    toast.error(result.error);
                                                    throw new Error(result.error);
                                                }
                                                return result.orderId;
                                            }}
                                            onApprove={handleApprove}
                                            onCancel={() => {
                                                toast.info("결제가 취소되었습니다.");
                                            }}
                                            onError={(err) => {
                                                console.error("PayPal Error:", err);
                                                toast.error("Payment failed. Please try again.");
                                            }}
                                        />
                                    </div>
                                </PayPalScriptProvider>
                            ) : (
                                <div className="text-center text-red-500 py-4 font-bold">
                                    PayPal 설정 오류: Client ID를 찾을 수 없습니다.
                                </div>
                            )}
                            <p className="text-center text-[10px] text-slate-400 mt-3 px-1">
                                결제 시 서비스 이용약관 및 환불 정책에 동의하게 됩니다.
                                <br />Sandbox 환경에서는 실제 비용이 청구되지 않습니다.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
