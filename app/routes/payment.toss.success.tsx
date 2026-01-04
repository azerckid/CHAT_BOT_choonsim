import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { requireUserId } from "~/lib/auth.server";
import { confirmTossPayment, processSuccessfulTossPayment } from "~/lib/toss.server";
import { useEffect } from "react";
import { toast } from "sonner";

export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    if (!userId) {
        return redirect("/login");
    }

    const url = new URL(request.url);
    const paymentKey = url.searchParams.get("paymentKey");
    const orderId = url.searchParams.get("orderId");
    const amount = Number(url.searchParams.get("amount"));
    const creditsGranted = Number(url.searchParams.get("creditsGranted"));
    const packageId = url.searchParams.get("packageId");

    if (!paymentKey || !orderId || !amount || !creditsGranted) {
        return { error: "Missing required payment information" };
    }

    try {
        // 1. 토스 승인
        const paymentData = await confirmTossPayment(paymentKey, orderId, amount);

        // 2. DB 처리
        await processSuccessfulTossPayment(userId, paymentData, creditsGranted);

        return { success: true, creditsGranted };
    } catch (error: any) {
        console.error("Toss Success Loader Error:", error);
        return { error: error.message || "결제 승인 처리 중 오류가 발생했습니다." };
    }
}

export default function TossSuccessPage() {
    const data = useLoaderData<typeof loader>();

    useEffect(() => {
        if (data.success) {
            toast.success(`${data.creditsGranted} 크레딧이 충전되었습니다!`);
            // 3초 후 이동
            const timer = setTimeout(() => {
                window.location.href = "/profile/subscription";
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [data]);

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="bg-surface-dark border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
                {data.error ? (
                    <>
                        <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                        </div>
                        <h1 className="text-xl font-bold text-white">결제 처리 실패</h1>
                        <p className="text-white/60 text-sm">{data.error}</p>
                        <button
                            onClick={() => window.location.href = "/profile/subscription"}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                        >
                            돌아가기
                        </button>
                    </>
                ) : (
                    <>
                        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">결제 완료!</h1>
                        <p className="text-white/60">
                            잠시 후 자동으로 대시보드로 이동합니다...
                        </p>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
