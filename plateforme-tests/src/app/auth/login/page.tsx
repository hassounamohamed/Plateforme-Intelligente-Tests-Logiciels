"use client";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full">
    {/* Left Section: Form */}
    <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-[45%] xl:w-[40%] bg-linear-to-b from-primary-50 via-white to-primary-100 dark:from-primary-950 dark:via-[#151219] dark:to-[#0f0b13] border-r border-primary-100/70 dark:border-primary-900/50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                    <span className="material-symbols-outlined text-2xl">
                        grid_view
                    </span>
                </div>
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    AgileFlow
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
                <form className="flex flex-col gap-6">
                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-3" htmlFor="email">
                            Email Address
                        </label>
                        <div className="mt-1">
                            <input autoComplete="email" className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm font-normal leading-normal transition-all" id="email" name="email" placeholder="name@company.com" required={true} type="email" />
                        </div>
                    </div>
                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-semibold leading-normal text-slate-700 dark:text-slate-200 mb-3" htmlFor="password">
                            Password
                        </label>
                        <div className="mt-1">
                            <input autoComplete="current-password" className="block w-full rounded-xl border-0 h-12 px-4 text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 bg-white/90 dark:bg-[#1c2127] placeholder:text-slate-400 dark:placeholder:text-[#9dabb9] focus:outline-0 focus:ring-2 focus:ring-inset focus:ring-primary-600 text-sm font-normal leading-normal transition-all" id="password" name="password" placeholder="Enter your password" required={true} type="password" />
                        </div>
                    </div>
                    {/* Checkbox & Forgot Password */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center">
                            <input className="h-5 w-5 rounded border-slate-300 dark:border-[#3b4754] text-primary focus:ring-primary-600 dark:bg-[#1c2127] accent-primary" id="remember-me" name="remember-me" type="checkbox" />
                            <label className="ml-3 block text-sm font-medium text-slate-900 dark:text-white" htmlFor="remember-me">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <a className="font-semibold text-primary-700 hover:text-primary-600 transition-colors" href="/auth/forgot-password">
                                Forgot password?
                            </a>
                        </div>
                    </div>
                    {/* Sign In Button */}
                    <div className="pt-2">
                        <button
                        className="flex items-center justify-center w-full rounded-xl bg-primary h-12 px-6 text-base font-bold leading-normal tracking-[0.015em] text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-300 active:scale-95"
                        type="submit"
                        >
                        Sign in
                        </button>
                    </div>
                </form>
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
                        <a className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-[#1c2127] px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 hover:bg-primary-50/70 dark:hover:bg-[#252b33] focus-visible:ring-2 focus-visible:ring-primary transition-all active:scale-95" href="#">
                            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.16-3.293 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.133H12.48z" />
                            </svg>
                            <span className="text-sm font-medium">
                                Google
                            </span>
                        </a>
                        <a className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-[#1c2127] px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-md ring-1 ring-inset ring-primary-200 dark:ring-primary-900/60 hover:bg-primary-50/70 dark:hover:bg-[#252b33] focus-visible:ring-2 focus-visible:ring-primary transition-all active:scale-95" href="#">
                            <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">
                                GitHub
                            </span>
                        </a>
                    </div>
                </div>
                {/* Footer */}
                <p className="mt-12 text-center text-sm text-slate-600 dark:text-[#9dabb9]">
                    Don't have an account?
                    <a className="ml-1 font-semibold leading-6 text-primary-700 hover:text-primary-600 transition-colors" href="/auth/register">
                        Sign up for free
                    </a>
                </p>
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