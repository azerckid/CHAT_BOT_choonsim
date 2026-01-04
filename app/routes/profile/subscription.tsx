
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useFetcher } from "react-router";
import { auth } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
// @ts-ignore
import type { Payment } from "@prisma/client";
import { TokenTopUpModal } from "~/components/payment/TokenTopUpModal";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response(null, { status: 302, headers: { Location: "/login" } });
  }

  const userId = session.user.id;

  // 사용자 정보 및 결제 내역 조회
  const [user, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        subscriptionId: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // 최근 20개 내역
    }),
  ]);

  const paypalClientId = process.env.PAYPAL_CLIENT_ID;

  return Response.json({ user, payments, paypalClientId });
}

type LoaderData = {
  user: {
    credits: number;
    subscriptionTier: string | null;
    subscriptionStatus: string | null;
    currentPeriodEnd: Date | string | null;
    subscriptionId: string | null;
  } | null;
  payments: Payment[]; // Prisma Client에서 가져온 Payment 타입 사용
  paypalClientId?: string;
};

export default function SubscriptionManagementPage() {
  const { user, payments, paypalClientId } = useLoaderData<typeof loader>() as unknown as LoaderData;
  const navigate = useNavigate();
  const fetcher = useFetcher<{ success: boolean; error?: string }>();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  const isActive = user?.subscriptionStatus === "ACTIVE";
  const isCancelled = user?.subscriptionStatus === "CANCELLED";
  const tier = user?.subscriptionTier || "FREE";

  // 날짜 포맷팅
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "-";
    return DateTime.fromISO(dateString.toString()).setLocale('ko').toFormat('yyyy. MM. dd');
  };

  const handleCancelSubscription = () => {
    fetcher.submit({}, { method: "POST", action: "/api/payment/cancel-subscription" });
  };

  if (fetcher.data?.success && isActive) {
    toast.success("구독이 취소되었습니다.");
  } else if (fetcher.data?.error) {
    toast.error(fetcher.data.error);
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-foreground flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center text-white/80 hover:text-primary transition-colors size-10 rounded-full hover:bg-white/5"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-base font-bold tracking-tight text-white/90">충전 및 결제 관리</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-4 space-y-6 pb-24 overflow-y-auto">
        {/* 1. Subscription Card */}
        <section>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">현재 멤버십</h2>
          <div className={cn(
            "relative rounded-2xl p-6 border overflow-hidden",
            isActive ? "bg-surface-dark border-primary/30" : "bg-surface-dark border-white/5"
          )}>
            {/* Background Gradient */}
            {isActive && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white tracking-tight uppercase">
                      {tier} PLAN
                    </h3>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30">
                        ACTIVE
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                        CANCELLED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/50">
                      보유 크레딧: <span className="text-primary font-bold">{user?.credits.toLocaleString()}</span>
                    </p>
                    <button
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 transition-colors flex items-center gap-1 cursor-pointer z-20 relative"
                    >
                      <span className="material-symbols-outlined text-[10px]">bolt</span>
                      충전
                    </button>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="material-symbols-outlined text-white/70">
                    {tier === "ULTIMATE" ? "crown" : (tier === "PREMIUM" ? "diamond" : "bolt")}
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">다음 결제일 (만료일)</span>
                <span className="text-white font-medium">{formatDate(user?.currentPeriodEnd)}</span>
              </div>

              <div className="flex gap-2 mt-2">
                {/* Upgrade/Change Plan Button */}
                <button
                  onClick={() => navigate("/pricing")}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10 cursor-pointer relative z-20"
                >
                  {tier === "FREE" ? "멤버십 시작하기" : "멤버십 변경"}
                </button>

                {/* Cancel Subscription Button (Only if Active) */}
                {isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-medium transition-colors border border-red-500/20 cursor-pointer relative z-20">
                        구독 해지
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-surface-dark border-white/10 text-white rounded-2xl max-w-xs">
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 구독을 해지하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          구독을 해지하더라도 현재 기간이 끝날 때까지({formatDate(user?.currentPeriodEnd)})는 혜택이 유지됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-white">닫기</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-red-600 hover:bg-red-700 text-white border-0"
                        >
                          해지 확정
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Payment History */}
        <section>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 ml-2">결제 내역</h2>
          <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
            {payments.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">
                <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">receipt_long</span>
                결제 내역이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0",
                        payment.status === "COMPLETED" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        <span className="material-symbols-outlined text-[20px]">
                          {payment.type.includes("SUBSCRIPTION") ? "autorenew" : "payments"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{payment.description || "Credit Top-up"}</p>
                        <p className="text-xs text-white/50">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {payment.amount > 0 ? `$${payment.amount}` : "Free"}
                      </p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase",
                        payment.status === "COMPLETED" ? "text-green-500" : "text-red-500"
                      )}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <TokenTopUpModal
        open={isTopUpModalOpen}
        onOpenChange={setIsTopUpModalOpen}
        paypalClientId={paypalClientId}
      />
    </div>
  );
}
