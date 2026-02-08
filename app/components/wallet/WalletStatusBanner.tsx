import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

interface WalletStatusBannerProps {
    initialStatus: string | null;
}

/**
 * 지갑 생성 상태를 폴링하여 배너로 표시합니다.
 * PENDING/CREATING: "지갑 준비 중" 배너 표시
 * FAILED: "지갑 생성 실패" 배너 + 재시도 안내
 * READY/null: 배너 숨김
 */
export function WalletStatusBanner({ initialStatus }: WalletStatusBannerProps) {
    const fetcher = useFetcher();
    const [status, setStatus] = useState(initialStatus);
    const [dismissed, setDismissed] = useState(false);

    // 5초마다 상태 폴링 (READY가 아닌 경우에만)
    useEffect(() => {
        if (status === "READY" || status === null || dismissed) return;

        const interval = setInterval(() => {
            fetcher.load("/api/wallet/status");
        }, 5000);

        return () => clearInterval(interval);
    }, [status, dismissed]);

    // 폴링 결과 반영
    useEffect(() => {
        if (fetcher.data?.status) {
            setStatus(fetcher.data.status);

            // READY가 되면 페이지 새로고침 (채팅 활성화를 위해)
            if (fetcher.data.isReady) {
                window.location.reload();
            }
        }
    }, [fetcher.data]);

    // READY이거나 숨김 처리된 경우 표시하지 않음
    if (status === "READY" || status === null || dismissed) return null;

    return (
        <div className="mx-4 mt-2">
            <div className="flex items-center gap-3 rounded-xl bg-surface-dark border border-white/10 p-3">
                {(status === "PENDING" || status === "CREATING") && (
                    <>
                        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold">
                                {status === "PENDING" ? "지갑 생성 대기 중..." : "지갑 생성 중..."}
                            </p>
                            <p className="text-white/40 text-xs">
                                완료되면 자동으로 채팅이 활성화됩니다
                            </p>
                        </div>
                    </>
                )}
                {status === "FAILED" && (
                    <>
                        <div className="h-8 w-8 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-sm font-bold">!</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold">지갑 생성에 문제가 발생했습니다</p>
                            <p className="text-white/40 text-xs">자동으로 재시도 중입니다</p>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="text-white/30 hover:text-white/60 transition-colors"
                        >
                            <span className="text-lg leading-none">&times;</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
