/**
 * X402 클라이언트 인터셉터
 * 클라이언트에서 발생하는 모든 fetch 요청을 감시하고, 
 * 402 Payment Required가 발생하면 결제 시트를 띄우거나 자동 결제를 처리합니다.
 */

export interface X402Invoice {
    recipient: string;
    amount: string;
    currency: string;
    tokenContract: string;
}

export interface X402Allowance {
    canAutoPay: boolean;
    remainingAllowance?: number;
}

/**
 * 402 응답에서 X402 메타데이터를 추출합니다.
 */
export function parseX402Headers(response: Response) {
    const token = response.headers.get("X-x402-Token");
    const invoiceRaw = response.headers.get("X-x402-Invoice");
    const allowanceRaw = response.headers.get("X-x402-Allowance");

    if (!token || !invoiceRaw) return null;

    try {
        const invoice: X402Invoice = JSON.parse(invoiceRaw);
        let allowance: X402Allowance | null = null;
        
        if (allowanceRaw) {
            try {
                allowance = JSON.parse(allowanceRaw);
            } catch (e) {
                console.warn("Failed to parse X402 Allowance header", e);
            }
        }
        
        return { token, invoice, allowance };
    } catch (e) {
        console.error("Failed to parse X402 Invoice header", e);
        return null;
    }
}

/**
 * X402 전용 fetch 래퍼
 * 이 함수를 통해 API를 호출하면 402 결제 프로세스가 자동으로 가동됩니다.
 */
export async function x402Fetch(
    url: string | URL | Request,
    options: RequestInit = {},
    onPaymentRequired?: (data: { token: string; invoice: X402Invoice; retry: () => Promise<Response> }) => void
): Promise<Response> {
    const response = await fetch(url, options);

    if (response.status === 402) {
        const x402Data = parseX402Headers(response);

        if (x402Data && onPaymentRequired) {
            return new Promise((resolve) => {
                onPaymentRequired({
                    ...x402Data,
                    retry: async () => {
                        // 결제 완료 후 헤더를 포함하여 재요청
                        // (헤더에 결제 증명 토큰을 넣을 수도 있고, 서버가 세션/DB로 이미 알고 있을 수도 있음)
                        return x402Fetch(url, options, onPaymentRequired);
                    }
                });
            });
        }
    }

    return response;
}
