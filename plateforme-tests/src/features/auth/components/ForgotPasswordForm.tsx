"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useForgotPassword } from "../hooks";
import { ROUTES } from "@/lib/constants";

export function ForgotPasswordForm() {
  const { handleForgotPassword, isLoading, error, success } =
    useForgotPassword();
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleForgotPassword({ email });
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center py-4">
        <div className="size-12 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">
            check_circle
          </span>
        </div>
        <p className="text-white font-semibold">Check your inbox!</p>
        <p className="text-slate-400 text-sm leading-relaxed">
          We sent a password reset link to{" "}
          <span className="text-white font-medium">{email}</span>.
        </p>
        <Link
          href={ROUTES.LOGIN}
          className="mt-2 inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary-300 hover:text-primary-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {/* Email Input */}
      <div className="flex flex-col gap-2">
        <label
          className="text-slate-300 text-sm font-semibold leading-normal"
          htmlFor="forgot-email"
        >
          Email Address
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] pointer-events-none">
            mail
          </span>
          <input
            className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary-600/70 border border-white/10 bg-[#0f1218] focus:border-primary h-12 pl-11 pr-4 placeholder:text-slate-500 text-sm font-normal leading-normal transition-all"
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 rounded-lg px-3 py-2">
          {error}
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
          {isLoading ? "Sending…" : "Send Reset Link"}
        </span>
      </button>
    </form>
  );
}
