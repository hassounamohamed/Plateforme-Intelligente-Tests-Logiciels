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
      console.log('[Login] Attempting login with:', { username: payload.username });
      const response = await loginApi(payload);
      console.log('[Login] Response received:', response);
      
      // Convert backend response to User format
      const user = {
        id: response.user_id,
        nom: response.nom,
        email: response.email,
        role: response.role,
      };
      
      signIn(user, response.access_token, ""); // No refresh token in backend
      
      // Redirect based on role code
      const roleRoutes: Record<string, string> = {
        DEVELOPPEUR: ROUTES.DEVELOPER,
        PRODUCT_OWNER: ROUTES.PRODUCT_OWNER,
        TESTEUR_QA: ROUTES.QA,
        SCRUM_MASTER: ROUTES.SCRUM_MASTER,
        SUPER_ADMIN: ROUTES.SUPER_ADMIN,
      };
      
      const roleCode = response.role?.code || "DEVELOPPEUR";
      const targetRoute = roleRoutes[roleCode] ?? ROUTES.DASHBOARD;
      console.log('[Login] Redirecting to:', targetRoute);
      router.replace(targetRoute);
    } catch (err: any) {
      console.error('[Login] Error:', err);
      const errorMessage = err.response?.data?.detail || err.message || "Identifiants incorrects.";
      setError(errorMessage);
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
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      console.log('[Register] Attempting registration with:', payload);
      const response = await registerApi(payload);
      console.log('[Register] Response:', response);
      
      // Afficher le message de succès
      setSuccess(true);
      setSuccessMessage(response.message || "Utilisateur créé avec succès");
      
      // Rediriger après 2 secondes pour que l'utilisateur puisse voir le message
      setTimeout(() => {
        router.push(ROUTES.LOGIN + "?registered=1");
      }, 2000);
    } catch (err: any) {
      console.error('[Register] Error:', err);
      console.error('[Register] Error response:', err.response);
      const errorMessage = err.response?.data?.detail || err.message || "Erreur lors de l'inscription.";
      console.error('[Register] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleRegister, isLoading, error, success, successMessage };
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
