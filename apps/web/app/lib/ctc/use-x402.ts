/**
 * X402 결제 훅 (CTC 오프체인 포인트 버전)
 * Phase 0-3: MetaTx / 레거시 지갑 로직 제거
 * 402 수신 시 CHOCO 잔액 부족 모달을 표시하고 /profile/subscription 으로 유도합니다.
 */
import { useState, useCallback, useEffect } from "react";

export function useX402() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const response = await originalFetch(input, init);

            if (response.status === 402) {
                setIsOpen(true);
                // 모달을 닫은 뒤 사용자가 충전하고 돌아오므로 여기서는 응답을 그대로 반환
                return response;
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    return { isOpen, handleClose };
}
