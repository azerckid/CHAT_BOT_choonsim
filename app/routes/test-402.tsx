import { createX402Invoice, createX402Response } from "../lib/near/x402.server";

/**
 * 402 에러 수동 발생 테스트 페이지
 */
export async function loader() {
    // 테스트용 인보이스 생성
    const testUserId = "manual-test-user";
    const { token, invoice } = await createX402Invoice(testUserId, 0.1);

    // 402 응답 반환
    return createX402Response(token, invoice);
}

export default function Test402Page() {
    return (
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-4">X402 Interceptor Test Page</h1>
            <p>이 페이지는 로딩 시 402 에러를 던집니다.</p>
            <p>인터셉터가 정상 작동한다면 아래에서 결제 시트가 올라와야 합니다.</p>
        </div>
    );
}
