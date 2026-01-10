import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, ArrowRight, Wallet } from "lucide-react";

interface PaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    invoice: {
        recipient: string;
        amount: string;
        currency: string;
        tokenContract: string;
    };
    onSuccess: (txHash: string) => void;
}

export function PaymentSheet({
    isOpen,
    onClose,
    token,
    invoice,
    onSuccess
}: PaymentSheetProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'review' | 'success'>('review');
    const [txHash, setTxHash] = useState("");

    if (!isOpen) return null;

    const handlePay = async () => {
        setIsProcessing(true);
        try {
            // 임시 결제 시뮬레이션 (실제로는 임베디드 지갑의 ft_transfer 호출)
            console.log("Processing payment for invoice:", invoice);

            // 2초 대기
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 시뮬레이션된 Tx Hash
            const fakeTxHash = "Hq8k..." + Math.random().toString(36).substring(7);

            // 서버에 결제 검증 요청
            const res = await fetch("/api/x402/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, txHash: fakeTxHash })
            });

            if (res.ok) {
                setTxHash(fakeTxHash);
                setStep('success');
                setTimeout(() => {
                    onSuccess(fakeTxHash);
                }, 1500);
            } else {
                alert("결제 검증에 실패했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("결제 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="payment-sheet-overlay">
            <div className={`payment-sheet ${isOpen ? 'open' : ''}`}>
                <div className="sheet-header">
                    <h3>{step === 'review' ? 'CHOCO 결제 승인' : '결제 완료!'}</h3>
                    <button className="close-btn" onClick={onClose} disabled={isProcessing}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sheet-content">
                    {step === 'review' ? (
                        <>
                            <div className="invoice-summary">
                                <div className="amount-display">
                                    <span className="price">{invoice.amount}</span>
                                    <span className="unit">{invoice.currency}</span>
                                </div>
                                <p className="description">AI 에이전트 서비스 이용권</p>
                            </div>

                            <div className="payment-info card">
                                <div className="info-row">
                                    <span className="label">결제 수단</span>
                                    <span className="value flex-center">
                                        <Wallet size={14} className="mr-4" /> 춘심 지갑 (NEAR)
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="label">수신처</span>
                                    <span className="value truncate">{invoice.recipient}</span>
                                </div>
                            </div>

                            <div className="security-badge">
                                <ShieldCheck size={16} className="text-success" />
                                <span>온체인 보안 기술로 보호되는 안전한 거래입니다.</span>
                            </div>

                            <button
                                className={`pay-button ${isProcessing ? 'loading' : ''}`}
                                onClick={handlePay}
                                disabled={isProcessing}
                            >
                                {isProcessing ? '트랜잭션 승인 중...' : '결제하기'}
                                {!isProcessing && <ArrowRight size={18} />}
                            </button>
                        </>
                    ) : (
                        <div className="success-view">
                            <div className="success-icon-wrapper">
                                <CheckCircle2 size={64} className="text-success pulse" />
                            </div>
                            <h4>결제가 정상적으로 처리되었습니다.</h4>
                            <p className="tx-text">TxID: {txHash}</p>
                            <div className="auto-close-hint">잠시 후 계속됩니다...</div>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .payment-sheet-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }

                .payment-sheet {
                    width: 100%;
                    max-width: 500px;
                    background: #1a1a1a;
                    border-radius: 24px 24px 0 0;
                    padding: 24px;
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-bottom: none;
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
                }

                .payment-sheet.open {
                    transform: translateY(0);
                }

                .sheet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }

                .sheet-header h3 {
                    font-size: 18px;
                    font-weight: 700;
                    color: white;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .invoice-summary {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .amount-display {
                    display: flex;
                    align-items: baseline;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }

                .amount-display .price {
                    font-size: 42px;
                    font-weight: 800;
                    color: #ec4899;
                }

                .amount-display .unit {
                    font-size: 18px;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                }

                .description {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .payment-info.card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    font-size: 14px;
                }

                .info-row:not(:last-child) {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                }

                .info-row .label { opacity: 0.5; }
                .info-row .value { font-weight: 500; }

                .security-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.4);
                    justify-content: center;
                    margin-bottom: 24px;
                }

                .text-success { color: #10b981; }

                .pay-button {
                    width: 100%;
                    height: 56px;
                    background: linear-gradient(135deg, #ec4899, #be185d);
                    border: none;
                    border-radius: 16px;
                    color: white;
                    font-size: 16px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: transform 0.1s;
                }

                .pay-button:active { transform: scale(0.98); }
                .pay-button:disabled { opacity: 0.6; cursor: not-allowed; }

                .success-view {
                    text-align: center;
                    padding: 20px 0;
                }

                .success-icon-wrapper {
                    margin-bottom: 20px;
                }

                .tx-text {
                    font-family: monospace;
                    font-size: 12px;
                    opacity: 0.5;
                    margin-top: 12px;
                }

                .auto-close-hint {
                    margin-top: 24px;
                    font-size: 12px;
                    opacity: 0.3;
                }

                .mr-4 { margin-right: 4px; }
                .flex-center { display: flex; align-items: center; }
                .truncate { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse { animation: pulse 2s infinite ease-in-out; }
            ` }} />
        </div>
    );
}
