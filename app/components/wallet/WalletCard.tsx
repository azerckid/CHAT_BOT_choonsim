import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Copy, Wallet, RefreshCw, QrCode, History, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

interface WalletCardProps {
    chocoBalance: string | null;
    nearBalance: string;
    nearAccountId: string | null;
    depositDialogOpen: boolean;
    swapDialogOpen: boolean;
    historyDialogOpen: boolean;
    onDepositDialogChange: (open: boolean) => void;
    onSwapDialogChange: (open: boolean) => void;
    onHistoryDialogChange: (open: boolean) => void;
    onScanDeposits: () => Promise<void>;
    isScanning: boolean;
    history: any[];
    onCopyAddress: () => void;
}

export function WalletCard({
    chocoBalance,
    nearBalance,
    nearAccountId,
    depositDialogOpen,
    swapDialogOpen,
    historyDialogOpen,
    onDepositDialogChange,
    onSwapDialogChange,
    onHistoryDialogChange,
    onScanDeposits,
    isScanning,
    history,
    onCopyAddress,
}: WalletCardProps) {

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="px-4 pb-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white shadow-xl ring-1 ring-white/10 relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 rounded-full bg-black/10 blur-xl"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-xs text-indigo-200 font-medium mb-1 tracking-wider uppercase">My Wallet</p>
                            <div className="flex items-baseline gap-1.5">
                                <h3 className="text-3xl font-bold tracking-tight">{parseInt(chocoBalance || "0").toLocaleString()}</h3>
                                <span className="text-sm font-semibold text-indigo-200">CHOCO</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="text-sm text-indigo-100 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                                    <span className="font-medium">≈ {nearBalance} NEAR</span>
                                </div>
                                <span className="text-[10px] text-indigo-300 bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-400/20">
                                    가스비 무료
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            {/* History Button (Small) */}
                            <button
                                onClick={() => onHistoryDialogChange(true)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                                <History className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Address Display (Priority 2) */}
                    <div className="mb-6 flex items-center gap-2 bg-black/20 p-2 rounded-lg cursor-pointer hover:bg-black/30 transition-colors" onClick={onCopyAddress}>
                        <div className="p-1.5 bg-white/10 rounded-md">
                            <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <code className="text-xs font-mono text-indigo-100 flex-1 truncate">
                            {nearAccountId || "지갑 주소 없음"}
                        </code>
                        <Copy className="w-3.5 h-3.5 text-indigo-300 mr-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Deposit Button */}
                        <Button
                            onClick={() => onDepositDialogChange(true)}
                            size="lg"
                            className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold shadow-sm"
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            입금 (Receive)
                        </Button>

                        {/* Swap Button */}
                        <Button
                            onClick={() => onSwapDialogChange(true)}
                            size="lg"
                            className="bg-indigo-800/50 hover:bg-indigo-800/70 text-indigo-100 border border-indigo-500/30 shadow-sm backdrop-blur-sm"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            환전 (Swap)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Deposit Dialog */}
            <Dialog open={depositDialogOpen} onOpenChange={onDepositDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>입금 받기 (NEAR)</DialogTitle>
                        <DialogDescription>아래 QR 코드를 스캔하거나 주소를 복사하여 NEAR를 입금하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                        <div className="p-4 bg-white rounded-xl shadow-inner border mx-auto">
                            {nearAccountId && (
                                <QRCode value={nearAccountId} size={160} />
                            )}
                        </div>
                        <div className="text-center w-full px-4">
                            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                                <code className="flex-1 text-xs font-mono break-all text-left text-slate-600 dark:text-slate-300">
                                    {nearAccountId}
                                </code>
                                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCopyAddress}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-300 text-center w-full max-w-xs">
                            입금 확인 시 5,000 CHOCO/NEAR 비율로 자동 환전됩니다.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Swap Dialog */}
            <Dialog open={swapDialogOpen} onOpenChange={onSwapDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>토큰 환전 (Auto-Swap)</DialogTitle>
                        <DialogDescription>입금된 NEAR를 감지하여 CHOCO로 변환합니다.</DialogDescription>
                    </DialogHeader>
                    <div className="py-8 text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                            <div className="relative p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-500 mb-2">현재 적용 환율</p>
                                <div className="flex items-center justify-center gap-3 text-2xl font-bold text-slate-900 dark:text-white">
                                    <span>1 NEAR</span>
                                    <span className="material-symbols-outlined text-slate-400">arrow_right_alt</span>
                                    <span className="text-primary">5,000 CHOCO</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            NEAR를 입금하셨나요?<br />
                            아래 버튼을 누르면 <b>최신 입금 내역</b>을 확인하고<br />
                            자동으로 환전하여 지갑에 넣어드립니다.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={onScanDeposits} disabled={isScanning} className="w-full h-12 text-base">
                            {isScanning ? (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                    블록체인 스캔 중...
                                </>
                            ) : (
                                "입금 확인 및 환전 실행"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={onHistoryDialogChange}>
                <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>사용 내역 (History)</DialogTitle>
                        <DialogDescription>최근 환전 및 사용 기록입니다.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-60">
                                <History className="w-12 h-12" />
                                <p className="text-sm">아직 기록이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-6">
                                {history.map((log) => (
                                    <div key={log.id} className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 gap-3 border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${log.fromChain === 'NEAR'
                                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                        : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {log.fromChain === 'NEAR' ? '환전 (Swap)' : '사용'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {formatDate(log.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">+{parseInt(log.toAmount).toLocaleString()}</p>
                                                <p className="text-xs text-slate-400">{log.toToken}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs bg-slate-100 dark:bg-black/20 p-2 rounded-lg">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <span>환율: 1:{log.rate}</span>
                                                <span className="w-px h-2.5 bg-slate-300 dark:bg-slate-700"></span>
                                                <span className="text-slate-400">{log.fromAmount} {log.fromChain}</span>
                                            </div>
                                            <a
                                                href={`https://testnet.nearblocks.io/txns/${log.txHash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
                                            >
                                                Tx 확인 <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" onClick={() => onHistoryDialogChange(false)} className="w-full">
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
