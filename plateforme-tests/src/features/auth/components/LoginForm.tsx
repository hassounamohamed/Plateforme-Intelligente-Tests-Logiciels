"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLogin } from "../hooks";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const { handleLogin, isLoading, error, infoMessage } = useLogin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const emailAlreadyExistsParam = searchParams.get("email_exists") === "1";
  const redirectedEmail = searchParams.get("email") ?? "";
  const oauthErrorParam = searchParams.get("oauth_error");
  const [email, setEmail] = useState(redirectedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailExistsPopup, setShowEmailExistsPopup] = useState(emailAlreadyExistsParam);
  const [showEmailExistsBanner] = useState(emailAlreadyExistsParam);
  const [oauthErrorMessage] = useState(() => {
    if (!oauthErrorParam) return "";
    try {
      return decodeURIComponent(oauthErrorParam);
    } catch {
      return oauthErrorParam;
    }
  });

  useEffect(() => {
    const hasAuthQueryParams =
      searchParams.has("oauth_error") ||
      searchParams.has("email_exists") ||
      searchParams.has("email");

    if (hasAuthQueryParams) {
      router.replace(pathname || ROUTES.LOGIN, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Backend expects 'username' field (which is the email)
    handleLogin({ username: email, password });
  };

  // Determine error type for better UX
  const isEmailNotFound = Boolean(infoMessage) || error?.includes("n'existe pas");
  const isPasswordWrong = error?.includes("Mot de passe");

  return (
    <>
      {showEmailExistsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-white dark:bg-surface-dark p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                warning
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Email deja utilise
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-[#9dabb9]">
                  Ce mail existe deja. Merci de faire Sign in avec ce mail.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailExistsPopup(false)}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

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
          className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-surface-dark placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
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
            className="block w-full rounded-xl border-0 h-12 px-4 pr-12 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-surface-dark placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm transition-all"
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
      {showEmailExistsBanner && (
        <div className="flex gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0">
            warning
          </span>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Ce mail est deja utilise. Merci de faire Sign in avec ce mail.
            </p>
          </div>
        </div>
      )}

      {/* Error - Email Not Found */}
      {isEmailNotFound && error && (
        <div className="flex gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0">
            info
          </span>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
              {error}
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              Create an account
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* Info - Account Not Found */}
      {infoMessage && (
        <div className="flex gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0">
            info
          </span>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
              {infoMessage}
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
            >
              Create an account
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error - Password Wrong */}
      {isPasswordWrong && error && (
        <div className="flex gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400 shrink-0">
            error
          </span>
          <div className="flex-1">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Generic Error */}
      {error && !infoMessage && !isEmailNotFound && !isPasswordWrong && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {oauthErrorMessage && !showEmailExistsBanner && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
          {oauthErrorMessage}
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
    </>
  );
}
