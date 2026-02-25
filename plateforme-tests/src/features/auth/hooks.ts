import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
} from "./api";
import { useAuthStore } from "./store";
import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@/types";
import { ROUTES } from "@/lib/constants";

// ─── useLogin ────────────────────────────────────────────────────────────────

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const { tokens, user } = await loginApi(payload);
      signIn(user, tokens.accessToken, tokens.refreshToken);

      const roleRoutes: Record<string, string> = {
        DEVELOPER: ROUTES.DEVELOPER,
        PRODUCT_OWNER: ROUTES.PRODUCT_OWNER,
        QA: ROUTES.QA,
        SCRUM_MASTER: ROUTES.SCRUM_MASTER,
        SUPER_ADMIN: ROUTES.SUPER_ADMIN,
      };
      router.push(roleRoutes[user.role] ?? ROUTES.DASHBOARD);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Identifiants incorrects."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error };
}

// ─── useRegister ─────────────────────────────────────────────────────────────

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await registerApi(payload);
      router.push(ROUTES.LOGIN + "?registered=1");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'inscription."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { handleRegister, isLoading, error };
}

// ─── useForgotPassword ───────────────────────────────────────────────────────

export function useForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (payload: ForgotPasswordPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await forgotPasswordApi(payload);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "La demande a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  return { handleForgotPassword, isLoading, error, success };
}

// ─── useResetPassword ────────────────────────────────────────────────────────

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (payload: ResetPasswordPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      await resetPasswordApi(payload);
      setSuccess(true);
      router.push(ROUTES.LOGIN + "?reset=1");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "La réinitialisation a échoué."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { handleResetPassword, isLoading, error, success };
}
