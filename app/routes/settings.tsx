import { useState } from "react";
import { useNavigate } from "react-router";
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

export default function SettingsScreen() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현 (Phase 2)
    toast.success("로그아웃되었습니다");
    setLogoutDialogOpen(false);
    // navigate("/login");
  };

  const handleDeleteAccount = () => {
    // TODO: 계정 탈퇴 로직 구현 (Phase 2)
    toast.error("계정이 삭제되었습니다");
    setDeleteAccountDialogOpen(false);
    // navigate("/login");
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen selection:bg-primary selection:text-white">
      <div className="relative flex h-full w-full flex-col max-w-md mx-auto overflow-x-hidden min-h-screen pb-10 md:max-w-lg lg:max-w-xl">
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

        <div className="p-4 mt-2">
          <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-sm dark:shadow-none border border-black/5 dark:border-white/5">
            <div className="relative shrink-0">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCOz-ycctcRpqXk1y01dxqgp0snDjlfF-joCqG0CVQPw5ohSzu3AvTGunT5CJLn6jmmUrArbyvkZSfww_OY_DP6G1W69xzLPTJTsc3r4Cmmd_Y5upAGheZxCFXb-xlEiEMfR-C-lpw_3w8__RfjC2KevhMzQ8yYvdGnQgQpeQO8AoXgoQbbTmgFbxUFXr44lp-xfW1fL6RQTF-TkByk5PyDtvGVJ8H67dkeCltLiiTpvG9jjjrCReyH8mEAkCAm8q3TqLOz2S-vAWk")',
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
                박지민
              </p>
              <p className="text-primary text-sm font-medium leading-normal truncate">
                VVIP 팬 멤버십
              </p>
            </div>
            <button className="shrink-0 text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

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
              <DialogTrigger asChild>
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
              <DialogTrigger asChild>
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
    </div>
  );
}

