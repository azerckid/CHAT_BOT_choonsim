import { useState, useCallback, useEffect } from "react";
import { parseX402Headers, type X402Invoice } from "./x402-client";

export function useX402() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState<X402Invoice | null>(null);
    const [activeToken, setActiveToken] = useState<string | null>(null);
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
                    return new Promise((resolve) => {
                        setActiveInvoice(x402.invoice);
                        setActiveToken(x402.token);
                        setIsOpen(true);

                        // 결제 성공 후 실행할 재시도 함수 정의
                        setRetryFn(() => async () => {
                            const retriedResponse = await originalFetch(input, init);
                            resolve(retriedResponse);
                        });
                    });
                }
            }

            return response;
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
        handleSuccess,
        handleClose
    };
}
