"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRegister } from "../hooks";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const { handleRegister, isLoading, error } = useRegister();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    const { confirmPassword: _, ...payload } = form;
    void _;
    handleRegister(payload);
  };

  const displayError = localError ?? error;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Name row */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="firstName"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"
          >
            First name
          </label>
          <input
            id="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="John"
            value={form.firstName}
            onChange={set("firstName")}
            className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="lastName"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"
          >
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Doe"
            value={form.lastName}
            onChange={set("lastName")}
            className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"
        >
          Email Address
        </label>
        <input
          id="reg-email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@company.com"
          value={form.email}
          onChange={set("email")}
          className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set("password")}
            className="block w-full rounded-xl border-0 h-12 px-4 pr-12 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3"
        >
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
        />
      </div>

      {/* Error */}
      {displayError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {displayError}
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
        {isLoading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href={ROUTES.LOGIN}
          className="font-semibold text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
