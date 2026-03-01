import axiosInstance from "@/lib/axios";
import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  LoginResponse,
  RegisterResponse,
  User,
} from "@/types";

/**
 * Login endpoint
 * Backend expects OAuth2PasswordRequestForm (form-data with username/password)
 */
export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  // Convert to form data format for OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append("username", payload.username);
  formData.append("password", payload.password);

  const { data } = await axiosInstance.post<LoginResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return data;
}

/**
 * Register endpoint
 */
export async function registerApi(
  payload: RegisterPayload
): Promise<RegisterResponse> {
  const { data } = await axiosInstance.post<RegisterResponse>(
    "/auth/register",
    payload
  );
  return data;
}

/**
 * Forgot password endpoint (to implement on backend)
 */
export async function forgotPasswordApi(
  payload: ForgotPasswordPayload
): Promise<void> {
  await axiosInstance.post("/auth/forgot-password", payload);
}

/**
 * Reset password endpoint (to implement on backend)
 */
export async function resetPasswordApi(
  payload: ResetPasswordPayload
): Promise<void> {
  await axiosInstance.post("/auth/reset-password", payload);
}

/**
 * Get current user profile
 */
export async function getMeApi(): Promise<User> {
  const { data } = await axiosInstance.get<User>("/auth/me");
  return data;
}

/**
 * Logout endpoint (to implement on backend if needed)
 */
export async function logoutApi(): Promise<void> {
  // For now, just clear local storage
  // If backend implements logout endpoint, uncomment:
  // await axiosInstance.post("/auth/logout");
}
