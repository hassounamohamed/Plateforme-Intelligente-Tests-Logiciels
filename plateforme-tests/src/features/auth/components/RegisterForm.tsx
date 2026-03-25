"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRegister } from "../hooks";
import { getOAuthLoginUrl } from "../api";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const { handleRegister, isLoading, error, success, successMessage } = useRegister();
  const [form, setForm] = useState({
    nom: "",
    email: "",
    phone: "",
    role: "2", // Default: Développeur (ID 2 dans la BD)
    password: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const markOAuthRegisterIntent = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("oauth_intent", "register");
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    // Backend expects exact field names: nom, email, motDePasse, telephone, role_id
    const payload = {
      nom: form.nom.trim(),
      email: form.email,
      motDePasse: form.password,
      telephone: form.phone.trim() || undefined, // Send undefined if empty
      role_id: parseInt(form.role, 10), // Convert string to number
    };
    handleRegister(payload);
  };

  const displayError = localError ?? error;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Personal Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label
            htmlFor="nom"
            className="text-slate-700 dark:text-white text-sm font-medium pb-2"
          >
            Full Name
          </label>
          <input
            id="nom"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.nom}
            onChange={set("nom")}
            className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="reg-email"
            className="text-slate-700 dark:text-white text-sm font-medium pb-2"
          >
            Work Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={set("email")}
            className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div className="flex flex-col">
        <label
          htmlFor="reg-phone"
          className="text-slate-700 dark:text-white text-sm font-medium pb-2"
        >
          Phone Number
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1234567890"
          value={form.phone}
          onChange={set("phone")}
          className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>

      {/* Role Selection */}
      <div className="flex flex-col">
        <label className="text-slate-700 dark:text-white text-sm font-medium pb-3">
          Your Role
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="cursor-pointer group">
            <input
              className="hidden peer"
              name="role"
              type="radio"
              value="4"
              checked={form.role === "4"}
              onChange={set("role")}
            />
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all text-center">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary dark:text-[#9dabb9] mb-1">
                strategy
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                PO
              </span>
            </div>
          </label>
          <label className="cursor-pointer group">
            <input
              className="hidden peer"
              name="role"
              type="radio"
              value="5"
              checked={form.role === "5"}
              onChange={set("role")}
            />
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all text-center">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary dark:text-[#9dabb9] mb-1">
                groups
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Scrum
              </span>
            </div>
          </label>
          <label className="cursor-pointer group">
            <input
              className="hidden peer"
              name="role"
              type="radio"
              value="2"
              checked={form.role === "2"}
              onChange={set("role")}
            />
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all text-center">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary dark:text-[#9dabb9] mb-1">
                code
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Dev
              </span>
            </div>
          </label>
          <label className="cursor-pointer group">
            <input
              className="hidden peer"
              name="role"
              type="radio"
              value="3"
              checked={form.role === "3"}
              onChange={set("role")}
            />
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10 transition-all text-center">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-primary dark:text-[#9dabb9] mb-1">
                fact_check
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                QA
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Password Field */}
      <div className="flex flex-col">
        <label
          htmlFor="reg-password"
          className="text-slate-700 dark:text-white text-sm font-medium pb-2"
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
            className="form-input w-full rounded-lg text-slate-900 dark:text-white border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark h-12 px-4 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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

      {/* Success */}
      {success && successMessage && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-lg">
            check_circle
          </span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error */}
      {displayError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {displayError}
        </p>
      )}

      {/* CTA Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full flex h-12 items-center justify-center rounded-lg bg-primary text-white text-base font-bold transition-all hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading && (
            <span className="material-symbols-outlined animate-spin text-lg mr-2">
              progress_activity
            </span>
          )}
          {success ? "Redirecting…" : isLoading ? "Creating account…" : "Create My Account"}
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
          By clicking &quot;Create My Account&quot;, you agree to our{" "}
          <a className="text-primary hover:underline" href="#">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="text-primary hover:underline" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Social Divider */}
      <div className="relative flex items-center py-4">
        <div className="grow border-t border-slate-200 dark:border-[#283039]"></div>
        <span className="shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
          Or continue with
        </span>
        <div className="grow border-t border-slate-200 dark:border-[#283039]"></div>
      </div>

      {/* Social Auth */}
      <div className="grid grid-cols-2 gap-4">
        <a
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          href={getOAuthLoginUrl("google", "register")}
          onClick={markOAuthRegisterIntent}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </a>
        <a
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-[#3b4754] bg-white dark:bg-surface-dark text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          href={getOAuthLoginUrl("github", "register")}
          onClick={markOAuthRegisterIntent}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          GitHub
        </a>
      </div>

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
