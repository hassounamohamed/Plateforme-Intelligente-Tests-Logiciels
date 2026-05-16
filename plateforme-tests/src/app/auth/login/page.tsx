import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { API_URL } from "@/lib/constants";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full">
    {/* Left Section: Form */}
    <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-[45%] xl:w-[40%] bg-linear-to-b from-primary-50 via-white to-primary-100 dark:from-primary-950 dark:via-[#151219] dark:to-[#0f0b13] border-r border-primary-100/70 dark:border-primary-900/50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
                <Image
                    src="/favicon-32x32.png"
                    alt="FlowPilot logo"
                    width={48}
                    height={48}
                    className="rounded-2xl shadow-lg"
                    priority
                />
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    FlowPilot
                </span>
            </div>
            {/* Heading */}
            <div className="mb-10">
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                    Welcome back
                </h2>
                <p className="mt-3 text-base text-slate-600 dark:text-[#9dabb9]">
                    Manage your sprints and automate your QA workflows.
                </p>
            </div>
            {/* Login Form */}
            <div className="mt-10">
                <Suspense fallback={<div className="h-[520px]" />}>
                    <LoginForm />
                </Suspense>
                {/* Divider */}
                <div className="mt-10">
                    <div className="relative">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-primary-100/80 dark:border-primary-900/50" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white/80 dark:bg-[#151219] px-4 text-slate-600 dark:text-slate-400 font-medium">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    {/* Social Buttons */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <a className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-surface-dark px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 hover:bg-primary-50/70 dark:hover:bg-[#252b33] focus-visible:ring-2 focus-visible:ring-primary transition-all active:scale-95" href={`${API_URL}/auth/oauth/google/login?intent=login`}>
                            <svg
                                aria-hidden="true"
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
                            <span className="text-sm font-medium">
                                Google
                            </span>
                        </a>
                        <a className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-surface-dark px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 hover:bg-primary-50/70 dark:hover:bg-[#252b33] focus-visible:ring-2 focus-visible:ring-primary transition-all active:scale-95" href={`${API_URL}/auth/oauth/github/login?intent=login`}>
                            <svg aria-hidden="true" className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">
                                GitHub
                            </span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/* Right Section: Illustration */}
    <div className="relative hidden w-0 flex-1 lg:block bg-background-dark">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-primary-400/30 via-primary-900/30 to-background-dark/70 mix-blend-overlay z-10" />
        {/* Main Image */}
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" data-alt="abstract 3d geometric blue nodes and connecting lines illustrating network automation" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD46DymSVCOgzFTBVL1TLJIe9KUhFIhNLjW14retyV2cjLVdT_TWwarjkerY-8tQZCQIzvWO6bH0pO6nkSWp6z-HThiwqzP8F_Cez6g8qewf4-tthD3prZMA5eAXe3-ihsR6B1GSw3YqcySGeTik94NY51wvcj2oAlY0FMHEq8H__iKXo6EbLNBhhATuzNrpQ3gDhi9Kl4h8IMHYB8h1KC0F1IXda3PhPkKiqwdH_3_Llsxmhf4TUlWojtQeq1_Wkke23dKqPLXZWM" />
        {/* Floating Card/Content over image (Optional polish) */}
        <div className="absolute bottom-10 left-10 right-10 z-20">
            <div className="backdrop-blur-md bg-black/30 border border-white/10 p-6 rounded-2xl max-w-lg">
                <div className="flex gap-4 items-start">
                    <div className="bg-primary-500/20 p-2 rounded-lg text-primary-200">
                        <span className="material-symbols-outlined text-3xl">
                            rocket_launch
                        </span>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">
                            Automate Faster
                        </h3>
                        <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                            Join 10,000+ agile teams deploying safer code with our automated QA pipelines.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
        </div>
    );
}