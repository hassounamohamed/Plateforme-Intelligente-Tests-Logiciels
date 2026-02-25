"use client";

export default function RegisterPage() {
	return (
		<div className="min-h-screen bg-linear-to-b from-primary-50 via-white to-primary-100 dark:from-primary-950 dark:via-[#151219] dark:to-[#0f0b13]">
			{/* Navbar */}
			<header className="w-full flex items-center justify-between border-b border-primary-100/70 dark:border-primary-900/50 px-6 py-4 lg:px-40 bg-white/90 dark:bg-[#151219]">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center size-8 rounded-lg bg-primary-500/20 text-primary-700 dark:text-primary-200">
						<span className="material-symbols-outlined">
							dataset
						</span>
					</div>
					<h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
						AgileQA
					</h2>
				</div>
				<div className="flex items-center gap-4">
					<span className="hidden sm:inline text-sm text-slate-500 dark:text-slate-400">
						Already have an account?
					</span>
					<a className="text-sm font-semibold text-primary-700 hover:text-primary-600 transition-colors" href="/auth/login">
						Sign in
					</a>
				</div>
			</header>
			{/* Main Content */}
			<main className="grow flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">
				{/* Background decorative elements */}
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-[100px] -z-10 pointer-events-none" />
				<div className="absolute bottom-0 right-1/4 w-125 h-125 bg-primary-300/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
				<div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
					{/* Left Column: Form */}
					<div className="w-full max-w-lg mx-auto lg:mx-0">
						<div className="mb-8">
							<h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
								Create your account
							</h1>
							<p className="text-slate-600 dark:text-slate-400 text-base lg:text-lg">
								Start managing your Agile projects today.
							</p>
						</div>
						<form className="space-y-5 bg-white/95 dark:bg-[#1c2127] p-6 sm:p-8 rounded-xl border border-primary-100/70 dark:border-primary-900/50 shadow-xl shadow-black/5 dark:shadow-black/20">
							{/* Full Name */}
							<div>
								<label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="full_name">
									Full Name
								</label>
								<div className="relative">
									<input className="w-full h-12 px-4 rounded-lg bg-white/90 dark:bg-[#1c2127] border border-primary-200 dark:border-primary-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-primary-600/60 focus:border-primary transition-all" id="full_name" placeholder="Jane Doe" type="text" />
								</div>
							</div>
							{/* Work Email */}
							<div>
								<label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="email">
									Work Email
								</label>
								<div className="relative">
									<input className="w-full h-12 px-4 pr-10 rounded-lg bg-white/90 dark:bg-[#1c2127] border border-primary-200 dark:border-primary-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-primary-600/60 focus:border-primary transition-all" id="email" placeholder="jane@company.com" type="email" />
									<span className="absolute right-3 top-3 text-slate-400 material-symbols-outlined text-[20px]">
										mail
									</span>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
								{/* Company Name */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="company">
										Company Name
									</label>
									<input className="w-full h-12 px-4 rounded-lg bg-white/90 dark:bg-[#1c2127] border border-primary-200 dark:border-primary-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-primary-600/60 focus:border-primary transition-all" id="company" placeholder="Acme Inc." type="text" />
								</div>
								{/* Role Selection */}
								<div>
									<label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="role">
										Role
									</label>
									<div className="relative">
										<select className="w-full h-12 px-4 pr-10 rounded-lg bg-white/90 dark:bg-[#1c2127] border border-primary-200 dark:border-primary-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-primary-600/60 focus:border-primary transition-all outline-none appearance-none cursor-pointer" id="role" defaultValue="">
											<option disabled={true} value="">
												Select a role
											</option>
											<option value="owner">
												Product Owner
											</option>
											<option value="scrum_master">
												Scrum Master
											</option>
											<option value="developer">
												Developer
											</option>
											<option value="tester">
												Tester
											</option>
										</select>
										<span className="absolute right-3 top-3.5 text-slate-400 material-symbols-outlined text-[20px] pointer-events-none">
											expand_more
										</span>
									</div>
								</div>
							</div>
							{/* Password */}
							<div>
								<label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5" htmlFor="password">
									Password
								</label>
								<div className="relative">
									<input className="w-full h-12 px-4 rounded-lg bg-white/90 dark:bg-[#1c2127] border border-primary-200 dark:border-primary-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-0 focus:ring-2 focus:ring-primary-600/60 focus:border-primary transition-all" id="password" placeholder="••••••••" type="password" />
									<button className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" type="button">
										<span className="material-symbols-outlined text-[20px]">
											visibility
										</span>
									</button>
								</div>
								{/* Strength Indicator */}
								<div className="flex gap-1 mt-2">
									<div className="h-1 flex-1 rounded-full bg-primary-500" />
									<div className="h-1 flex-1 rounded-full bg-primary-500" />
									<div className="h-1 flex-1 rounded-full bg-primary-200 dark:bg-primary-900/60" />
									<div className="h-1 flex-1 rounded-full bg-primary-200 dark:bg-primary-900/60" />
								</div>
								<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
									Make sure it&#39;s at least 8 characters including a number and a symbol.
								</p>
							</div>
							<div className="pt-2">
								<button className="w-full h-12 bg-primary hover:bg-primary-600 text-primary-foreground font-bold rounded-lg transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2" type="button">
									<span>
										Create Account
									</span>
									<span className="material-symbols-outlined text-sm">
										arrow_forward
									</span>
								</button>
							</div>
							<p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
								By clicking "Create Account", you agree to our
								<a className="text-primary-700 hover:underline ml-1" href="#">
									Terms of Service
								</a>
								<span className="mx-1">and</span>
								<a className="text-primary-700 hover:underline" href="#">
									Privacy Policy
								</a>
								.
							</p>
						</form>
					</div>
					{/* Right Column: Marketing/Features */}
					<div className="hidden lg:flex flex-col justify-center gap-8 pl-10">
						<div className="relative">
							{/* Abstract visual representation of dashboard */}
							<div className="rounded-2xl overflow-hidden shadow-2xl border border-primary-100/70 dark:border-primary-900/50 bg-white/95 dark:bg-[#1c2127] relative aspect-video group">
								{/* Decorative Header within Card */}
								<div className="h-12 border-b border-primary-100/70 dark:border-primary-900/50 flex items-center px-4 gap-2">
									<div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
									<div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
									<div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
								</div>
								<div className="p-6 grid grid-cols-3 gap-4">
									{/* Fake Chart Area */}
									<div className="col-span-2 space-y-3">
										<div className="h-8 w-24 bg-primary-100/80 dark:bg-primary-900/40 rounded" />
										<div className="flex items-end gap-2 h-32 pt-4">
											<div className="w-full bg-primary-200 rounded-t h-[60%] relative group-hover:h-[70%] transition-all duration-700" />
											<div className="w-full bg-primary-300 rounded-t h-[80%] relative group-hover:h-[90%] transition-all duration-700 delay-75" />
											<div className="w-full bg-primary rounded-t h-[50%] relative group-hover:h-full transition-all duration-700 delay-150" />
											<div className="w-full bg-primary-400 rounded-t h-[70%] relative group-hover:h-[80%] transition-all duration-700 delay-100" />
										</div>
									</div>
									{/* Fake Stats */}
									<div className="col-span-1 space-y-3">
										<div className="p-3 bg-primary-50/80 dark:bg-[#151219] rounded-lg border border-primary-100/70 dark:border-primary-900/50">
											<div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-600 mb-2">
												<span className="material-symbols-outlined text-sm">
													check_circle
												</span>
											</div>
											<div className="h-2 w-12 bg-primary-200/80 dark:bg-primary-900/50 rounded mb-1" />
											<div className="h-4 w-8 bg-primary-300/80 dark:bg-primary-800/60 rounded" />
										</div>
										<div className="p-3 bg-primary-50/80 dark:bg-[#151219] rounded-lg border border-primary-100/70 dark:border-primary-900/50">
											<div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-600 mb-2">
												<span className="material-symbols-outlined text-sm">
													bug_report
												</span>
											</div>
											<div className="h-2 w-12 bg-primary-200/80 dark:bg-primary-900/50 rounded mb-1" />
											<div className="h-4 w-8 bg-primary-300/80 dark:bg-primary-800/60 rounded" />
										</div>
									</div>
								</div>
								{/* Floating Badge */}
								<div className="absolute -bottom-6 -right-6 bg-white dark:bg-[#1c2127] p-4 rounded-xl shadow-xl border border-primary-100/70 dark:border-primary-900/50 flex items-center gap-3">
									<div className="flex -space-x-2">
										<div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white dark:border-[#1c2127] overflow-hidden">
											<img alt="User avatar" className="w-full h-full object-cover" data-alt="Portrait of a female user" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaXx0zG97GpQ55lQUskvJ2_uJvL5ry4pdel4ETlxqw08HZmtla3zbanHyACI6O3w42G8BW6BxxG5Qkla9fO1pzq7hPl_zlsS0theebrv5bBj7Bnp_NasSS8AKKydFY_68W633vE6tLflQHOdPwxsWFrrXOG22Df88_2HQk43uc4NtUmccmzD1a-9WFjUOHVVhGQUd1S6eIero63brRuvnlKg9ioLDS18MqtucdU-WyDrwnVEXe1xXSDG_NlDPr-Tfpp1BbMW8yCKw" />
										</div>
										<div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white dark:border-[#1c2127] overflow-hidden">
											<img alt="User avatar" className="w-full h-full object-cover" data-alt="Portrait of a male user" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOO7Ys11I6ZjYvBlVHG_KMELv5_GucRetdQCdS6WUQeyx5nSfqSAqi7x24bQdX9Bad7CvzYB6aVW-9ko4zO6lRBhYZnvRhybMbXU9K-hRL2P9HPBkBSX462x0rMfnRadsSO82pwQSMBCLOBdj-2mws2XowgfEeX9fLd2SNBADMnHieKSAy99k_rBT0QNRngNa6sFRtaZwvNeBbkGwZjw1x2jXQqRxCGoT-VDpYd4COqvIxFbghDVtXgeqih4DhdgK_UKusN3LsjtU" />
										</div>
										<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-[#1c2127]">
											+4k
										</div>
									</div>
									<div className="flex flex-col">
										<span className="text-xs font-bold text-slate-900 dark:text-white">
											Active Testers
										</span>
										<span className="text-[10px] text-slate-500 dark:text-slate-400">
											Join the community
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="max-w-md">
							<h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
								<span className="material-symbols-outlined text-primary">
									auto_mode
								</span>
								Automate your QA workflow
							</h3>
							<ul className="space-y-3">
								<li className="flex items-start gap-3">
									<span className="material-symbols-outlined text-primary-600 mt-0.5 text-lg">
										check
									</span>
									<span className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
										Integrated testing dashboard for all your agile sprints.
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="material-symbols-outlined text-primary-600 mt-0.5 text-lg">
										check
									</span>
									<span className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
										Role-based access control for Developers, QAs, and PMs.
									</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="material-symbols-outlined text-primary-600 mt-0.5 text-lg">
										check
									</span>
									<span className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
										Real-time reporting and defect tracking.
									</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
