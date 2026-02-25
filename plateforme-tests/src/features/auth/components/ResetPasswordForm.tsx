"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useResetPassword } from "../hooks";

export function ResetPasswordForm() {
  const { handleResetPassword, isLoading, error } = useResetPassword();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    handleResetPassword({ token, password });
  };

  const displayError = localError ?? error;

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {/* New Password */}
      <div className="flex flex-col gap-2">
        <label
          className="text-slate-300 text-sm font-semibold leading-normal"
          htmlFor="new-password"
        >
          New Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] pointer-events-none">
            lock
          </span>
          <input
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary-600/70 border border-white/10 bg-[#0f1218] focus:border-primary h-12 pl-11 pr-12 placeholder:text-slate-500 text-sm font-normal leading-normal transition-all"
            id="new-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-2">
        <label
          className="text-slate-300 text-sm font-semibold leading-normal"
          htmlFor="confirm-password"
        >
          Confirm Password
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] pointer-events-none">
            lock_reset
          </span>
          <input
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary-600/70 border border-white/10 bg-[#0f1218] focus:border-primary h-12 pl-11 pr-4 placeholder:text-slate-500 text-sm font-normal leading-normal transition-all"
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <p className="text-sm text-red-400 bg-red-950/30 rounded-lg px-3 py-2">
          {displayError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-12 px-5 bg-primary text-primary-foreground hover:bg-primary-600 text-base font-bold leading-normal tracking-[0.015em] shadow-md shadow-primary/25 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-lg">
            progress_activity
          </span>
        )}
        <span className="truncate">
          {isLoading ? "Updating…" : "Update Password"}
        </span>
      </button>
    </form>
  );
}
