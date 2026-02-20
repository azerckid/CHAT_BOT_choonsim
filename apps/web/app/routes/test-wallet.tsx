import { useState } from "react";
import { useFetcher } from "react-router";

export default function TestWalletPage() {
    const fetcher = useFetcher();
    const [result, setResult] = useState<any>(null);

    const handleCheck = async () => {
        const res = await fetch("/api/test-wallet");
        const data = await res.json();
        setResult(data);
    };

    const handleCreate = async () => {
        const res = await fetch("/api/test-wallet", { method: "POST" });
        const data = await res.json();
        setResult(data);
        
        // 성공 시 다시 상태 확인
        if (data.success) {
            setTimeout(() => handleCheck(), 1000);
        }
    };

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">NEAR 지갑 생성 테스트</h1>
            
            <div className="space-y-4 mb-6">
                <button
                    onClick={handleCheck}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    현재 지갑 상태 확인 (GET)
                </button>
                
                <button
                    onClick={handleCreate}
                    disabled={fetcher.state === "submitting"}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
                >
                    {fetcher.state === "submitting" ? "생성 중..." : "지갑 생성 시도 (POST)"}
                </button>
            </div>

            {result && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4">결과:</h2>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-600 rounded">
                <h3 className="font-semibold mb-2">중요:</h3>
                <p className="text-sm">
                    지갑 생성 로그는 <strong>서버 터미널</strong>에서 확인할 수 있습니다.
                    <br />
                    "지갑 생성 시도" 버튼을 클릭한 후, <code>npm run dev</code>를 실행한 터미널 창을 확인하세요.
                    <br />
                    <code className="text-xs">[Wallet] Creating invisible wallet...</code> 또는 <code className="text-xs">[Wallet] Failed to create wallet...</code> 메시지가 나타납니다.
                </p>
            </div>
        </div>
    );
}
