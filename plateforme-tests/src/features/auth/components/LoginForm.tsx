"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useLogin } from "../hooks";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const { handleLogin, isLoading, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleLogin({ email, password });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-3"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-3"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border-0 h-12 px-4 pr-12 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Options row */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input type="checkbox" className="rounded accent-primary" />
          Remember me
        </label>
        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 h-12 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-lg">
            progress_activity
          </span>
        )}
        {isLoading ? "Signing in…" : "Sign in"}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.REGISTER}
          className="font-semibold text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
