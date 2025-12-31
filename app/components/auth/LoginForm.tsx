import { useState } from "react";
import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
  onSocialLogin?: (provider: "x" | "google" | "apple" | "kakao") => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({
  onSubmit,
  onSocialLogin,
  isLoading = false,
  error,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && email && password) {
      onSubmit(email, password);
    }
  };

  return (
    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm mb-2">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="group relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary">
          <span className="material-symbols-outlined">mail</span>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email or ID"
          className="w-full h-14 bg-surface-dark-input border border-[#67324d]/30 text-white placeholder:text-white/30 text-base font-medium rounded-2xl pl-12 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:font-normal"
          disabled={isLoading}
          required
        />
      </div>

      {/* Password Field */}
      <div className="group relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-primary">
          <span className="material-symbols-outlined">lock</span>
        </div>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full h-14 bg-surface-dark-input border border-[#67324d]/30 text-white placeholder:text-white/30 text-base font-medium rounded-2xl pl-12 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all placeholder:font-normal"
          disabled={isLoading}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
        >
          <span className="material-symbols-outlined">
            {showPassword ? "visibility" : "visibility_off"}
          </span>
        </button>
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end mt-1">
        <Link
          to="/forgot-password"
          className="text-sm font-semibold text-white/60 hover:text-primary transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="mt-4 w-full h-14 bg-primary hover:bg-[#d61c78] active:scale-[0.98] text-white text-lg font-bold rounded-2xl shadow-[0_8px_20px_-6px_rgba(238,43,140,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Logging in...</span>
          </>
        ) : (
          <>
            <span>Log In</span>
            <span className="material-symbols-outlined text-[20px]">login</span>
          </>
        )}
      </button>

      {/* Social Login Area */}
      <div className="mt-8">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-full h-px bg-white/10" />
          <span className="relative bg-background-dark px-4 text-xs font-medium text-white/40 uppercase tracking-widest">
            Or login with
          </span>
        </div>
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => onSocialLogin?.("google")}
            disabled={isLoading}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all duration-300 group disabled:opacity-50"
            title="Login with Google"
          >
            <span className="material-symbols-outlined text-white/80 group-hover:text-white">language</span>
          </button>
          <button
            type="button"
            onClick={() => onSocialLogin?.("apple")}
            disabled={isLoading}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all duration-300 group disabled:opacity-50"
            title="Login with Apple"
          >
            <span className="material-symbols-outlined text-white/80 group-hover:text-white">phone_iphone</span>
          </button>
          <button
            type="button"
            onClick={() => onSocialLogin?.("kakao")}
            disabled={isLoading}
            className="w-14 h-14 rounded-full bg-[#fae100] border border-[#fae100] flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(250,225,0,0.2)] disabled:opacity-50"
            title="Login with Kakao"
          >
            <span className="material-symbols-outlined text-[#371d1e]">chat_bubble</span>
          </button>
        </div>
        <p className="text-center mt-8 text-white/50 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-bold hover:underline ml-1">
            Sign Up
          </Link>
        </p>
      </div>
    </form>
  );
}

