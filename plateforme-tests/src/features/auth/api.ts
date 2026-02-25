import axiosInstance from "@/lib/axios";
import type {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthTokens,
  User,
} from "@/types";

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/login",
    payload
  );
  return data;
}

export async function registerApi(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/register",
    payload
  );
  return data;
}

export async function forgotPasswordApi(
  payload: ForgotPasswordPayload
): Promise<void> {
  await axiosInstance.post("/auth/forgot-password", payload);
}

export async function resetPasswordApi(
  payload: ResetPasswordPayload
): Promise<void> {
  await axiosInstance.post("/auth/reset-password", payload);
}

export async function getMeApi(): Promise<User> {
  const { data } = await axiosInstance.get<User>("/auth/me");
  return data;
}

export async function logoutApi(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}
