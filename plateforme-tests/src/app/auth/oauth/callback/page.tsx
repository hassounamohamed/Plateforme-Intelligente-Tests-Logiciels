"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/features/auth/store";

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

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    const needRole = searchParams.get("need_role") === "true";
    const userId = Number(searchParams.get("user_id") || "0");
    const accessToken = searchParams.get("access_token") || "";
    const tokenType = searchParams.get("token_type") || "bearer";
    const email = searchParams.get("email") || "";
    const nom = searchParams.get("nom") || "";
    const role = searchParams.get("role") || "";
    return { needRole, userId, accessToken, tokenType, email, nom, role };
  }, [searchParams]);

  useEffect(() => {
    const oauthIntent =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("oauth_intent")
        : null;

    if (!payload.userId) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oauth_intent");
      }
      setError("Invalid OAuth callback payload");
      return;
    }

    if (payload.needRole) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oauth_intent");
      }
      router.replace(`${ROUTES.SELECT_ROLE}?user_id=${payload.userId}`);
      return;
    }

    if (oauthIntent === "register" && payload.email) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oauth_intent");
      }
      const encodedEmail = encodeURIComponent(payload.email);
      router.replace(`${ROUTES.LOGIN}?email_exists=1&email=${encodedEmail}`);
      return;
    }

    if (!payload.accessToken) {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("oauth_intent");
      }
      setError("OAuth login succeeded but no access token was returned");
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("oauth_intent");
    }

    signIn(
      {
        id: payload.userId,
        nom: payload.nom || payload.email.split("@")[0] || "User",
        email: payload.email,
        actif: true,
        role: payload.role
          ? {
              id: 0,
              nom: payload.role,
              code: payload.role,
              niveau_acces: 0,
              permissions: [],
            }
          : undefined,
      },
      payload.accessToken,
      ""
    );

    if (payload.tokenType.toLowerCase() !== "bearer") {
      console.warn("Unexpected token type from OAuth callback:", payload.tokenType);
    }

    router.replace(getRoleRoute(payload.role));
  }, [payload, router, signIn]);

  if (error) {
    return (
      <main className="min-h-screen grid place-items-center px-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-700">OAuth Error</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-white"
            onClick={() => router.replace(ROUTES.LOGIN)}
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600">Finalizing OAuth login...</p>
      </div>
    </main>
  );
}
