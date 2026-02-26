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
    // Backend expects 'username' field (which is the email)
    handleLogin({ username: email, password });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="text-slate-700 dark:text-white text-sm font-medium pb-2 block"
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
          className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="text-slate-700 dark:text-white text-sm font-medium pb-2 block"
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
            className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
        className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-white text-base font-bold transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-lg mr-2">
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
