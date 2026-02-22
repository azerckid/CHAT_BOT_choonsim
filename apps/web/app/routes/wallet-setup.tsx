// app/routes/wallet-setup.tsx
import { redirect } from "react-router";
import type { Route } from "./+types/wallet-setup";
import { auth } from "~/lib/auth.server";
import { ensureNearWalletAsync } from "~/lib/near/wallet.server";
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
        console.log(`[Wallet Setup] Starting async setup for ${session.user.email}`);
        const accountId = await ensureNearWalletAsync(session.user.id);

        if (accountId) {
            console.log(`[Wallet Setup] Queued for ${session.user.email}, account: ${accountId}`);
            // DB 커밋 완료 후 서버 사이드 리다이렉트 → home loader가 nearAccountId를 확실히 읽음
            return redirect("/home");
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
    const [isStarted, setIsStarted] = useState(false);

    // Initial Trigger - 페이지 진입 시 즉시 비동기 지갑 생성 요청
    useEffect(() => {
        if (!isStarted && fetcher.state === "idle" && !fetcher.data) {
            setIsStarted(true);
            fetcher.submit({}, { method: "post" });
        }
    }, [isStarted, fetcher]);

    const error = fetcher.data?.error;
    // action이 redirect("/home")를 반환하면 React Router가 자동으로 처리
    const isLoading = fetcher.state !== "idle";

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center">
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
                                <span className="text-2xl">!</span>
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
                            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl">
                                <p className="text-white text-lg font-bold leading-snug">
                                    지갑을 준비하고 있습니다...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-in zoom-in-95 duration-300">
                                <p className="font-bold mb-1">문제가 발생했습니다</p>
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
