import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
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

function extractApiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
    if (typeof err.message === "string" && err.message.trim().length > 0) {
      return err.message;
    }
  }

  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }

  return fallback;
}

// ─── useLogin ────────────────────────────────────────────────────────────────

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { signIn } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
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
        actif: true
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
    } catch (err: unknown) {
      const errorMessage = extractApiError(
        err,
        "Email ou mot de passe incorrect."
      );

      const lower = errorMessage.toLowerCase();
      const isAccountNotFound =
        lower.includes("n'existe pas") ||
        lower.includes("email non trouvé") ||
        lower.includes("email introuvable");

      if (isAccountNotFound) {
        setInfoMessage("Ce compte n'existe pas. Veuillez vous inscrire.");
      } else {
        console.error('[Login] Error:', err);
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error, infoMessage };
}

// ─── useRegister ─────────────────────────────────────────────────────────────

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const isEmailAlreadyExistsError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("email deja utilise") ||
      normalized.includes("email déjà utilisé") ||
      normalized.includes("email already") ||
      (normalized.includes("email") && normalized.includes("existe"))
    );
  };

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

      if (isEmailAlreadyExistsError(errorMessage)) {
        const emailQuery = encodeURIComponent(payload.email);
        router.replace(`${ROUTES.LOGIN}?email_exists=1&email=${emailQuery}`);
        return;
      }

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
      setError(extractApiError(err, "La demande a échoué."));
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
      setError(extractApiError(err, "La réinitialisation a échoué."));
    } finally {
      setIsLoading(false);
    }
  };

  return { handleResetPassword, isLoading, error, success };
}
