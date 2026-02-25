"use client";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary-950 text-white">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-primary-600/20 blur-[140px]" />
        <div className="absolute inset-0 bg-linear-to-b from-primary-950 via-[#12131a] to-[#0b0b0f]" />
      </div>
      <div className="flex items-center justify-center p-4 relative z-10 w-full">
        <div className="w-full max-w-105 flex flex-col gap-6">
          {/* Brand / Logo Area */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 text-white">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                <svg
                  className="size-6 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                    fill="currentColor"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">
                AgilePlatform
              </span>
            </div>
          </div>
          {/* Main Card */}
          <div className="rounded-2xl border border-white/10 bg-[#171b22]/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-7 flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2 text-center">
                <div className="size-12 rounded-full bg-primary-500/15 text-primary-200 flex items-center justify-center mx-auto mb-2">
                  <span className="material-symbols-outlined text-[28px]">
                    lock_reset
                  </span>
                </div>
                <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-white">
                  Forgot Password?
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              {/* Form */}
              <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
                {/* Email Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-slate-300 text-sm font-semibold leading-normal" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[20px] pointer-events-none">
                      mail
                    </span>
                    <input
                      className="form-input flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-2 focus:ring-primary-600/70 border border-white/10 bg-[#0f1218] focus:border-primary h-12 pl-11 pr-4 placeholder:text-slate-500 text-sm font-normal leading-normal transition-all"
                      id="email"
                      placeholder="name@company.com"
                      required={true}
                      type="email"
                    />
                  </div>
                </div>
                {/* Submit Button */}
                <button className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-primary-foreground hover:bg-primary-600 text-base font-bold leading-normal tracking-[0.015em] shadow-md shadow-primary/25 transition-colors duration-200">
                  <span className="truncate">
                    Send Reset Link
                  </span>
                </button>
              </form>
            </div>
            {/* Footer / Back Link */}
            <div className="border-t border-white/10 bg-[#141820] p-4 text-center">
              <a className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-primary-200 text-sm font-semibold transition-colors duration-200 group" href="/auth/login">
                <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:-translate-x-1">
                  arrow_back
                </span>
                Back to Login
              </a>
            </div>
          </div>
          {/* Helper Links (Optional contextual help) */}
          <div className="flex justify-center gap-6 text-xs text-slate-500">
            <a className="hover:text-primary-200 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-primary-200 transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-primary-200 transition-colors" href="#">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}