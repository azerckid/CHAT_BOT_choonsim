import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2, Copy, ExternalLink, ShieldCheck } from "lucide-react";

interface NearPayButtonProps {
    amount: number;
    credits: number;
    description?: string;
    onSuccess?: () => void;
}

export const NearPayButton: React.FC<NearPayButtonProps> = ({
    amount,
    credits,
    description,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"IDLE" | "PENDING" | "VERIFYING" | "COMPLETED">("IDLE");
    const [paymentData, setPaymentData] = useState<{
        paymentId: string;
        recipient: string;
        nearAmount: string;
    } | null>(null);

    const [txHash, setTxHash] = useState("");
    const [accountId, setAccountId] = useState("");

    const initiatePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/payment/near/create-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, credits, description }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to initiate NEAR payment");

            setPaymentData(data);
            setStatus("PENDING");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async () => {
        if (!txHash || !accountId) {
            toast.error("송금하신 Transaction Hash와 계정 ID를 입력해 주세요.");
            return;
        }

        setLoading(true);
        setStatus("VERIFYING");
        try {
            const response = await fetch("/api/payment/near/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    txHash,
                    accountId,
                    paymentId: paymentData?.paymentId,
                }),
            });

            const data = await response.json();
            if (data.status === "COMPLETED") {
                setStatus("COMPLETED");
                toast.success(`${credits} CHOCO가 충전되었습니다!`);
                if (onSuccess) onSuccess();
            } else {
                throw new Error(data.error || "결제 확인에 실패했습니다. 다시 시도해 주세요.");
            }
        } catch (error: any) {
            toast.error(error.message);
            setStatus("PENDING");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label}가 복사되었습니다.`);
    };

    if (status === "COMPLETED") {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 rounded-2xl border border-green-500/20 text-center">
                <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">결제 완료!</h3>
                <p className="text-green-200/80">NEAR 결제가 성공적으로 확인되었습니다.</p>
            </div>
        );
    }

    if (status === "PENDING" || status === "VERIFYING") {
        return (
            <div className="flex flex-col space-y-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="space-y-4">
                    <div className="p-4 bg-black/30 rounded-xl space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">보낼 주소</span>
                            <button
                                onClick={() => copyToClipboard(paymentData?.recipient || "", "지갑 주소")}
                                className="text-[10px] text-blue-400 flex items-center gap-1"
                            >
                                <Copy className="w-3 h-3" /> 복사
                            </button>
                        </div>
                        <p className="text-white font-mono break-all text-sm">{paymentData?.recipient}</p>

                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-xs text-slate-400">금액</span>
                            <span className="text-white font-bold">{paymentData?.nearAmount} NEAR</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs text-slate-400 text-center">송금 후 아래 정보를 입력해 주세요.</p>
                        <input
                            type="text"
                            placeholder="본인 NEAR 계정 ID (예: user.near)"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Transaction Hash"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            value={txHash}
                            onChange={(e) => setTxHash(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={verifyPayment}
                    disabled={loading}
                    className="w-full h-12 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <ShieldCheck className="w-5 h-5" /> 결제 확인하기 </>}
                </button>

                <button
                    onClick={() => setStatus("IDLE")}
                    className="text-slate-500 text-xs text-center hover:text-slate-400"
                >
                    취소
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={initiatePayment}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-black hover:bg-slate-900 border border-white/20 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
        >
            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <>
                    <img src="https://cryptologos.cc/logos/near-protocol-near-logo.png" alt="NEAR" className="w-6 h-6 invert" />
                    <span>NEAR Protocol로 결제</span>
                </>
            )}
        </button>
    );
};
