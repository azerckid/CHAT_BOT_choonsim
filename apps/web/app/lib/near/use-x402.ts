import { useState, useCallback, useEffect } from "react";
import { parseX402Headers, type X402Invoice, type X402Allowance } from "./x402-client";
import { transferChocoTokenGasless, requestWalletConnection, isWalletConnected, getCurrentAccountId } from "./wallet-client";

export function useX402() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState<X402Invoice | null>(null);
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [activeAllowance, setActiveAllowance] = useState<X402Allowance | null>(null);
    const [retryFn, setRetryFn] = useState<(() => void) | null>(null);

    /**
     * 전역 fetch 인터셉터 설치
     */
    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const response = await originalFetch(input, init);

            if (response.status === 402) {
                const x402 = parseX402Headers(response);
                if (x402) {
                    // 한도 내 자동 결제 시도
                    if (x402.allowance?.canAutoPay && x402.invoice) {
                        try {
                            const connected = await isWalletConnected();
                            if (!connected) {
                                // 지갑 연결 필요 - 결제 시트 표시
                                return handlePaymentSheet(x402, originalFetch, input, init);
                            }

                            // 계정 ID 가져오기
                            const accountId = await getCurrentAccountId();
                            if (!accountId) {
                                // 계정 ID 없음 - 결제 시트 표시
                                return handlePaymentSheet(x402, originalFetch, input, init);
                            }

                            // 자동 결제 실행 (가스비 대납 사용)
                            const txHash = await transferChocoTokenGasless(
                                accountId,
                                x402.invoice.recipient,
                                x402.invoice.amount,
                                x402.invoice.tokenContract
                            );

                            // 결제 검증
                            const verifyRes = await fetch("/api/x402/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ token: x402.token, txHash }),
                            });

                            if (verifyRes.ok) {
                                // 원래 요청 재시도
                                return originalFetch(input, init);
                            } else {
                                // 검증 실패 시 결제 시트 표시
                                return handlePaymentSheet(x402, originalFetch, input, init);
                            }
                        } catch (error) {
                            console.error("Auto payment failed:", error);
                            // 자동 결제 실패 시 결제 시트 표시
                            return handlePaymentSheet(x402, originalFetch, input, init);
                        }
                    } else {
                        // 한도 초과 또는 한도 없음 - 결제 시트 표시
                        return handlePaymentSheet(x402, originalFetch, input, init);
                    }
                }
            }

            return response;
        };

        const handlePaymentSheet = (
            x402: { token: string; invoice: X402Invoice; allowance?: X402Allowance | null },
            originalFetch: typeof fetch,
            input: RequestInfo | URL,
            init?: RequestInit
        ): Promise<Response> => {
            return new Promise((resolve) => {
                setActiveInvoice(x402.invoice);
                setActiveToken(x402.token);
                setActiveAllowance(x402.allowance || null);
                setIsOpen(true);

                // 결제 성공 후 실행할 재시도 함수 정의
                setRetryFn(() => async () => {
                    const retriedResponse = await originalFetch(input, init);
                    resolve(retriedResponse);
                });
            });
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const handleSuccess = useCallback((txHash: string) => {
        console.log("X402 Payment Success:", txHash);
        setIsOpen(false);
        if (retryFn) {
            retryFn(); // 원래 요청 재시도
            setRetryFn(null);
        }
    }, [retryFn]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        // 결제 취소 시 에러 처리가 필요할 경우 여기서 수행
    }, []);

    return {
        isOpen,
        token: activeToken,
        invoice: activeInvoice,
        allowance: activeAllowance,
        handleSuccess,
        handleClose
    };
}
