// app/routes/wallet-setup.tsx
import { redirect } from "react-router";
import type { Route } from "./+types/wallet-setup";
import { auth } from "~/lib/auth.server";
import { ensureNearWallet } from "~/lib/near/wallet.server";
import { LoadingSpinner } from "~/components/ui/LoadingSpinner";
import { useEffect, useState } from "react";
import { db } from "~/lib/db.server";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import { useFetcher } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return redirect("/login");

    const existingUser = await db.query.user.findFirst({
        where: eq(schema.user.id, session.user.id),
        columns: { nearAccountId: true }
    });

    if (existingUser?.nearAccountId) {
        return redirect("/home");
    }

    return { userId: session.user.id };
}

export async function action({ request }: Route.ActionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return { error: "Unauthorized" };

    try {
        console.log(`[Wallet Setup] Starting setup for ${session.user.email}`);
        const accountId = await ensureNearWallet(session.user.id);

        if (accountId) {
            console.log(`[Wallet Setup] Success for ${session.user.email}, account: ${accountId}`);
            return { success: true };
        } else {
            return { error: "지갑 생성에 실패했습니다. (No Account ID returned)" };
        }
    } catch (error: any) {
        console.error(`[Wallet Setup] Action Error:`, error);
        return { error: error.message || "지갑 생성 중 알 수 없는 오류가 발생했습니다." };
    }
}

export default function WalletSetupPage() {
    const fetcher = useFetcher<typeof action>();
    const [messageIndex, setMessageIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);

    // Initial Trigger
    useEffect(() => {
        if (!isStarted && fetcher.state === "idle" && !fetcher.data) {
            setIsStarted(true);
            fetcher.submit({}, { method: "post" });
        }
    }, [isStarted, fetcher]);

    // Redirect on Success
    useEffect(() => {
        if (fetcher.data?.success) {
            window.location.href = "/home";
        }
    }, [fetcher.data]);

    const messages = [
        "회원님만을 위한 안전한 블록체인 지갑을 생성 중입니다...",
        "가입 축하금 100 CHOCO를 지갑에 전송하고 있습니다...",
        "NEAR 네트워크와 데이터를 동기화하는 중입니다...",
        "거의 다 되었습니다. 곧 초춘심과의 대화가 시작됩니다!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const error = fetcher.data?.error;
    const isLoading = fetcher.state !== "idle" || (fetcher.data?.success && !error);

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10">
                <div className="relative mb-12">
                    <div className={`absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 ${isLoading ? "animate-pulse" : ""}`} />
                    <div className="relative flex items-center justify-center">
                        {isLoading ? (
                            <LoadingSpinner className="w-16 h-16 text-primary stroke-[3px]" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Setting up <span className="text-primary">Wallet</span>
                        </h1>
                        <p className="text-white/40 text-sm font-bold tracking-[0.2em] uppercase">Blockchain initialization</p>
                    </div>

                    <div className="max-w-xs mx-auto">
                        {isLoading ? (
                            <>
                                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                                    <p className="text-white text-lg font-bold leading-snug min-h-[3rem] transition-all duration-500">
                                        {messages[messageIndex]}
                                    </p>
                                </div>
                                <p className="mt-4 text-white/30 text-xs leading-relaxed">
                                    블록체인 네트워크 상황에 따라 약 10~20초 정도 소요될 수 있습니다. 창을 닫지 말고 잠시만 기다려 주세요.
                                </p>
                            </>
                        ) : error ? (
                            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-in zoom-in-95 duration-300">
                                <p className="font-bold mb-1">앗! 문제가 발생했습니다</p>
                                <p className="text-red-500/70">{error}</p>
                                <button
                                    onClick={() => fetcher.submit({}, { method: "post" })}
                                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-xs hover:bg-red-600 transition-colors"
                                >
                                    다시 시도하기
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
