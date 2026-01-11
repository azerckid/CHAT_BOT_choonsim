
import { useState, useEffect } from "react";
import { useNavigate, useLoaderData } from "react-router";
import { db } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { signOut } from "~/lib/auth-client";
import type { LoaderFunctionArgs } from "react-router";
import { SettingsItem } from "~/components/settings/SettingsItem";
import { SettingsToggle } from "~/components/settings/SettingsToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { BottomNavigation } from "~/components/layout/BottomNavigation";
import * as schema from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { Input } from "~/components/ui/input";
import { Copy, AlertTriangle, Wallet, RefreshCw, QrCode, History, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";
import { getNearConnection } from "~/lib/near/client.server";
import { utils } from "near-api-js";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  // 1. DB User Info
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      nearAccountId: true,
      chocoBalance: true, // CHOCO Balance from DB
    },
  });

  // 2. Fetch Transaction History (Exchange Logs)
  const history = await db.query.exchangeLog.findMany({
    where: eq(schema.exchangeLog.userId, session.user.id),
    orderBy: [desc(schema.exchangeLog.createdAt)],
    limit: 20,
  });

  // 3. Live NEAR Balance via RPC
  let nearBalance = "0";
  if (user?.nearAccountId) {
    try {
      const near = await getNearConnection();
      const account = await near.account(user.nearAccountId);
      const balance = await account.getAccountBalance();
      nearBalance = utils.format.formatNearAmount(balance.available, 3); // 3 decimal places
    } catch (e) {
      console.error("Failed to fetch NEAR balance:", e);
    }
  }

  return Response.json({ user, nearBalance, history });
}

export default function SettingsScreen() {
  const { user, nearBalance, history } = useLoaderData<typeof loader>() as { user: any, nearBalance: string, history: any[] };
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [exportWalletDialogOpen, setExportWalletDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isLoadingPrivateKey, setIsLoadingPrivateKey] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);

  const handleScanDeposits = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/wallet/check-deposit", { method: "POST" });
      if (res.ok) {
        toast.success("입금 확인 및 자동 환전이 완료되었습니다.");
        // Refresh page data
        navigate(".", { replace: true });
        setSwapDialogOpen(false);
      } else {
        toast.error("확인 중 오류가 발생했습니다.");
      }
    } catch (e) {
      toast.error("서버 연결 실패");
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("로그아웃되었습니다");
            navigate("/home");
          },
        },
      });
    } catch (err) {
      toast.error("로그아웃 중 오류가 발생했습니다");
    }
  };

  const handleDeleteAccount = () => {
    // TODO: 계정 탈퇴 로직 구현 (Phase 2)
    toast.error("계정이 삭제되었습니다");
    setDeleteAccountDialogOpen(false);
    // navigate("/login");
  };

  const handleExportWallet = async () => {
    setIsLoadingPrivateKey(true);
    setExportError(null);
    setPrivateKey(null);

    try {
      const response = await fetch("/api/wallet/export-private-key");
      const data = await response.json();

      if (!response.ok) {
        setExportError(data.message || data.error || "프라이빗 키를 가져오는데 실패했습니다.");
        return;
      }

      setPrivateKey(data.privateKey);
      toast.success("프라이빗 키를 불러왔습니다. 안전하게 보관하세요.");
    } catch (error: any) {
      setExportError(error.message || "프라이빗 키를 가져오는데 실패했습니다.");
    } finally {
      setIsLoadingPrivateKey(false);
    }
  };

  const handleCopyPrivateKey = async () => {
    if (!privateKey) return;
    try {
      await navigator.clipboard.writeText(privateKey);
      toast.success("프라이빗 키가 클립보드에 복사되었습니다.");
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleCopyAddress = async () => {
    if (!user?.nearAccountId) return;
    try {
      await navigator.clipboard.writeText(user.nearAccountId);
      toast.success("주소가 복사되었습니다.");
    } catch (error) {
      toast.error("복사에 실패했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen selection:bg-primary selection:text-white">
      <div className="relative flex h-full w-full flex-col max-w-md mx-auto overflow-x-hidden min-h-screen pb-20 md:max-w-lg lg:max-w-xl">
        <header className="sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md p-4 justify-between border-b border-black/5 dark:border-white/5 transition-colors duration-300">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              arrow_back_ios_new
            </span>
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            설정
          </h2>
        </header>

        {/* --- Profile Section --- */}
        <div className="p-4 mt-2">
          <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <div className="relative shrink-0">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark"
                style={{
                  backgroundImage: `url(${user?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOz-ycctcRpqXk1y01dxqgp0snDjlfF-joCqG0CVQPw5ohSzu3AvTGunT5CJLn6jmmUrArbyvkZSfww_OY_DP6G1W69xzLPTJTsc3r4Cmmd_Y5upAGheZxCFXb-xlEiEMfR-C-lpw_3w8__RfjC2KevhMzQ8yYvdGnQgQpeQO8AoXgoQbbTmgFbxUFXr44lp-xfW1fL6RQTF-TkByk5PyDtvGVJ8H67dkeCltLiiTpvG9jjjrCReyH8mEAkCAm8q3TqLOz2S-vAWk'})`,
                }}
              />
              <div className="absolute bottom-0 right-0 bg-primary rounded-full p-1 border border-white dark:border-background-dark flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[12px]">
                  edit
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight truncate">
                {user?.name || "사용자"}
              </p>
              <p className="text-primary text-sm font-medium leading-normal truncate">
                {user?.id?.includes('-') ? "VVIP 팬 멤버십" : "Basic Member"}
              </p>
            </div>
          </div>
        </div>

        {/* --- Wallet Status Card (Improved) --- */}
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
                    <h3 className="text-3xl font-bold tracking-tight">{parseInt(user?.chocoBalance || "0").toLocaleString()}</h3>
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
                  <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
                        <History className="w-5 h-5" />
                      </button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>

              {/* Address Display (Priority 2) */}
              <div className="mb-6 flex items-center gap-2 bg-black/20 p-2 rounded-lg cursor-pointer hover:bg-black/30 transition-colors" onClick={handleCopyAddress}>
                <div className="p-1.5 bg-white/10 rounded-md">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <code className="text-xs font-mono text-indigo-100 flex-1 truncate">
                  {user?.nearAccountId || "지갑 주소 없음"}
                </code>
                <Copy className="w-3.5 h-3.5 text-indigo-300 mr-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Deposit Button */}
                <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 border-0 font-bold shadow-sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      입금 (Recevie)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>입금 받기 (NEAR)</DialogTitle>
                      <DialogDescription>아래 QR 코드를 스캔하거나 주소를 복사하여 NEAR를 입금하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-6">
                      <div className="p-4 bg-white rounded-xl shadow-inner border mx-auto">
                        {user?.nearAccountId && (
                          <QRCode value={user.nearAccountId} size={160} />
                        )}
                      </div>
                      <div className="text-center w-full px-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                          <code className="flex-1 text-xs font-mono break-all text-left text-slate-600 dark:text-slate-300">
                            {user?.nearAccountId}
                          </code>
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCopyAddress}>
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

                {/* Swap Button */}
                <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-indigo-800/50 hover:bg-indigo-800/70 text-indigo-100 border border-indigo-500/30 shadow-sm backdrop-blur-sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      환전 (Swap)
                    </Button>
                  </DialogTrigger>
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
                      <Button onClick={handleScanDeposits} disabled={isScanning} className="w-full h-12 text-base">
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
              </div>
            </div>
          </div>
        </div>

        {/* --- History Dialog (Priority 1) --- */}
        <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
          <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
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
              <Button variant="outline" onClick={() => setHistoryDialogOpen(false)} className="w-full">
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- App Settings --- */}
        <div className="px-4 pt-2 pb-2">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2">
            앱 설정
          </h3>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <SettingsItem
              icon="notifications"
              iconBgColor="bg-orange-400"
              label="알림 설정"
              rightElement={
                <SettingsToggle
                  checked={notificationsEnabled}
                  onChange={setNotificationsEnabled}
                />
              }
            />
            {/* ... rest of your code ... */}
            <SettingsItem
              icon="dark_mode"
              iconBgColor="bg-indigo-500"
              label="다크 모드"
              rightElement={
                <SettingsToggle
                  checked={darkModeEnabled}
                  onChange={setDarkModeEnabled}
                />
              }
            />
            <SettingsItem
              icon="chat_bubble"
              iconBgColor="bg-green-500"
              label="채팅 화면 설정"
              href="/settings/chat"
            />
          </div>
        </div>

        {/* --- Wallet Management (Legacy) --- */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2">
            고급설정 (Advanced)
          </h3>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <Dialog open={exportWalletDialogOpen} onOpenChange={setExportWalletDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500 flex items-center justify-center rounded-full bg-slate-100 shrink-0 size-8">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-slate-900 dark:text-white text-base font-medium">
                        지갑 키 관리
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">chevron_right</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>지갑 내보내기</DialogTitle>
                  <DialogDescription>
                    NEAR 지갑의 프라이빗 키를 확인하고 내보낼 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {user?.nearAccountId && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">지갑 주소</p>
                      <p className="text-sm font-mono text-slate-900 dark:text-white break-all">
                        {user.nearAccountId}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                          보안 경고
                        </h4>
                        <p className="text-xs text-red-800 dark:text-red-200">
                          프라이빗 키는 극비 정보입니다. 절대 공유하지 마시고, 안전한 곳에 보관하세요.
                          누군가 이 키를 알게 되면 지갑의 모든 자산을 제어할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!privateKey && !isLoadingPrivateKey && !exportError && (
                    <Button
                      onClick={handleExportWallet}
                      className="w-full"
                      variant="outline"
                    >
                      프라이빗 키 불러오기
                    </Button>
                  )}

                  {isLoadingPrivateKey && (
                    <div className="text-center py-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">프라이빗 키를 불러오는 중...</p>
                    </div>
                  )}

                  {exportError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                            오류
                          </h4>
                          <p className="text-xs text-red-800 dark:text-red-200">
                            {exportError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {privateKey && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                          프라이빗 키
                        </label>
                        <Button
                          onClick={handleCopyPrivateKey}
                          size="sm"
                          variant="outline"
                          className="h-7"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          복사
                        </Button>
                      </div>
                      <Input
                        type="text"
                        value={privateKey}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        프라이빗 키를 복사하여 안전한 곳에 보관하세요. 다른 지갑으로 자산을 옮기려면 이 키를 사용할 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExportWalletDialogOpen(false);
                      setPrivateKey(null);
                      setExportError(null);
                    }}
                  >
                    닫기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2">
            개인정보 및 보안
          </h3>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <SettingsItem
              icon="lock"
              iconBgColor="bg-blue-500"
              label="개인정보 처리방침"
              href="/privacy"
            />
            <SettingsItem
              icon="block"
              iconBgColor="bg-rose-500"
              label="차단 관리"
              href="/settings/blocked"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider px-2 pb-2">
            지원
          </h3>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <SettingsItem
              icon="help"
              iconBgColor="bg-slate-500"
              label="도움말 / FAQ"
              href="/help"
            />
            <SettingsItem
              icon="info"
              iconBgColor="bg-teal-500"
              label="오픈소스 라이선스"
              href="/license"
            />
          </div>
        </div>

        <div className="px-4 pt-4 pb-8">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <DialogTrigger>
                <button className="flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 shrink-0 size-8">
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                    </div>
                    <p className="text-primary text-base font-medium flex-1 truncate">
                      로그아웃
                    </p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>로그아웃</DialogTitle>
                  <DialogDescription>
                    정말 로그아웃하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setLogoutDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    로그아웃
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
              <DialogTrigger>
                <button className="flex items-center gap-4 p-4 min-h-14 justify-between border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 dark:text-slate-500 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 size-8">
                      <span className="material-symbols-outlined text-[18px]">person_off</span>
                    </div>
                    <p className="text-red-500 dark:text-red-400 text-base font-medium flex-1 truncate">
                      계정 탈퇴
                    </p>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>계정 삭제</DialogTitle>
                  <DialogDescription>
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    정말 계정을 삭제하시겠습니까?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteAccountDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button onClick={handleDeleteAccount} variant="destructive">
                    계정 삭제
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-center text-slate-400 dark:text-slate-600 text-xs mt-6">
            버전 1.2.0 (Build 302)
            <br />
            © 2024 AI Idol Chat Corp.
          </p>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
