"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { selectOAuthRoleApi } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";

const ROLE_OPTIONS = [
	{ code: "DEVELOPPEUR", label: "Developpeur" },
	{ code: "TESTEUR_QA", label: "Testeur QA" },
	{ code: "PRODUCT_OWNER", label: "Product Owner" },
	{ code: "SCRUM_MASTER", label: "Scrum Master" },
];

function getRoleRoute(role?: string): string {
	const roleRoutes: Record<string, string> = {
		DEVELOPPEUR: ROUTES.DEVELOPER,
		PRODUCT_OWNER: ROUTES.PRODUCT_OWNER,
		TESTEUR_QA: ROUTES.QA,
		SCRUM_MASTER: ROUTES.SCRUM_MASTER,
		SUPER_ADMIN: ROUTES.SUPER_ADMIN,
	};
	return role ? roleRoutes[role] ?? ROUTES.DASHBOARD : ROUTES.DASHBOARD;
}

export default function SelectRolePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { signIn } = useAuthStore();

	const userId = useMemo(() => Number(searchParams.get("user_id") || "0"), [searchParams]);

	const [selectedRole, setSelectedRole] = useState<string>(ROLE_OPTIONS[0].code);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!userId) {
			setError("Missing user_id from OAuth flow");
			return;
		}

		setError(null);
		setIsSubmitting(true);

		try {
			const response = await selectOAuthRoleApi({ user_id: userId, role: selectedRole });

			// Check if account is pending activation
			if (response.pending_activation) {
				setError(response.message || "Your account is pending activation by a super admin. Please check back later.");
				setIsSubmitting(false);
				// Redirect to login after 3 seconds
				setTimeout(() => {
					router.replace(ROUTES.LOGIN);
				}, 3000);
				return;
			}

			signIn(
				{
					id: response.user.id,
					nom: response.user.nom || response.user.email.split("@")[0] || "User",
					email: response.user.email,
					actif: true,
					role: response.user.role
						? {
								id: 0,
								nom: response.user.role,
								code: response.user.role,
								niveau_acces: 0,
								permissions: [],
							}
						: undefined,
				},
				response.access_token,
				""
			);

			router.replace(getRoleRoute(response.user.role));
		} catch (err: any) {
			const detail = err?.response?.data?.detail;
			setError(typeof detail === "string" ? detail : "Unable to save role");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="min-h-screen bg-background-light dark:bg-background-dark px-6 py-12 grid place-items-center">
			<form
				onSubmit={onSubmit}
				className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#3b4754] bg-white dark:bg-surface-dark p-6 shadow-lg ring-1 ring-inset ring-primary-100 dark:ring-primary-900/40"
			>
				<div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
					<span className="material-symbols-outlined text-[26px]">person</span>
				</div>
				<h1 className="text-xl font-semibold text-slate-900 dark:text-white">Choisissez votre role</h1>
				<p className="mt-2 text-sm text-slate-600 dark:text-[#9dabb9]">
					Votre compte a ete cree avec OAuth. Selectionnez votre role pour terminer la configuration.
				</p>

				<div className="mt-5 space-y-3">
					{ROLE_OPTIONS.map((option) => (
						<label
							key={option.code}
							className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-all ${
								selectedRole === option.code
									? "border-primary/60 bg-primary/10"
									: "border-slate-200 dark:border-[#3b4754] bg-white dark:bg-surface-dark hover:border-primary/40"
							}`}
						>
							<input
								type="radio"
								name="role"
								value={option.code}
								checked={selectedRole === option.code}
								onChange={(e) => setSelectedRole(e.target.value)}
								className="h-4 w-4 border-slate-300 dark:border-[#4a5866] text-primary focus:ring-primary"
							/>
							<span className="text-sm font-medium text-slate-800 dark:text-white">{option.label}</span>
						</label>
					))}
				</div>

				{error && (
					<p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
				)}

				<button
					type="submit"
					disabled={isSubmitting}
					className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Enregistrement..." : "Continuer"}
				</button>
			</form>
		</main>
	);
}
