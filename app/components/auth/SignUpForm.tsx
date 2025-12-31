import { useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface SignUpFormProps {
  onSubmit?: (email: string, nickname: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function SignUpForm({
  onSubmit,
  isLoading = false,
  error,
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    if (!agreeToTerms) {
      return;
    }
    
    if (onSubmit && email && nickname && password) {
      onSubmit(email, nickname, password);
    }
  };

  const isPasswordMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid = email && nickname && password && confirmPassword && agreeToTerms && isPasswordMatch;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <label className="flex flex-col w-full">
        <p className="text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1">
          Email / ID
        </p>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-[#67324d] bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all"
            disabled={isLoading}
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined text-[20px]">
            mail
          </span>
        </div>
      </label>

      <label className="flex flex-col w-full">
        <p className="text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1">
          Nickname
        </p>
        <div className="relative">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="What should she call you?"
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-[#67324d] bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all"
            disabled={isLoading}
            required
          />
          <span
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 text-green-400 material-symbols-outlined text-[20px] transition-opacity",
              nickname ? "opacity-100" : "opacity-0"
            )}
          >
            check_circle
          </span>
        </div>
      </label>

      <label className="flex flex-col w-full">
        <p className="text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1">
          Password
        </p>
        <div className="relative group/pass">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-[#67324d] bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all"
            disabled={isLoading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-text-muted hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
      </label>

      <label className="flex flex-col w-full">
        <p className="text-slate-700 dark:text-white text-sm font-semibold leading-normal pb-2 pl-1">
          Confirm Password
        </p>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className={cn(
              "form-input flex w-full min-w-0 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border bg-white dark:bg-surface-dark focus:border-primary h-14 placeholder:text-slate-400 dark:placeholder:text-text-muted px-[15px] text-base font-normal leading-normal transition-all",
              confirmPassword
                ? isPasswordMatch
                  ? "border-green-500 dark:border-green-500"
                  : "border-red-500 dark:border-red-500"
                : "border-slate-200 dark:border-[#67324d]"
            )}
            disabled={isLoading}
            required
          />
          {confirmPassword && (
            <span
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px]",
                isPasswordMatch ? "text-green-400" : "text-red-400"
              )}
            >
              {isPasswordMatch ? "check_circle" : "cancel"}
            </span>
          )}
        </div>
        {confirmPassword && !isPasswordMatch && (
          <p className="text-red-500 text-xs mt-1 pl-1">Passwords do not match</p>
        )}
      </label>

      <div className="flex items-start gap-3 mt-2 px-1">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id="terms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-[#67324d] bg-white dark:bg-surface-dark checked:border-primary checked:bg-primary transition-all"
            disabled={isLoading}
            required
          />
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100">
            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
          </span>
        </div>
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-tight text-slate-600 dark:text-text-muted cursor-pointer select-none"
        >
          I agree to the{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-4 px-6 text-base font-bold text-white shadow-[0_4px_14px_0_rgba(238,43,140,0.39)] hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(238,43,140,0.23)] hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Creating account...
          </>
        ) : (
          "Start Chatting"
        )}
      </button>

      <p className="text-center text-sm font-medium text-slate-500 dark:text-text-muted mt-2">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline ml-1">
          Log in
        </Link>
      </p>
    </form>
  );
}

