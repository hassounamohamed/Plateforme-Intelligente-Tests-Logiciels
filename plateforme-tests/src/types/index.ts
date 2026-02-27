// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role =
  | "DEVELOPPEUR"
  | "PRODUCT_OWNER"
  | "TESTEUR_QA"
  | "SCRUM_MASTER"
  | "SUPER_ADMIN";

// ─── User ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: number;
  nom: string;
  resource: string;
  action: string;
}

export interface RoleDetails {
  id: number;
  nom: string;
  code: string;
  description?: string;
  niveau_acces: number;
  permissions?: Permission[];
}

export interface User {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role_id?: number;
  actif: boolean;
  dateCreation?: string;
  derniereConnexion?: string;
  role?: RoleDetails;
}

// ─── Auth payloads ───────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string; // Optional car le backend n'utilise pas de refresh token
}

export interface LoginPayload {
  username: string; // Backend utilise OAuth2PasswordRequestForm qui attend 'username'
  password: string;
}

export interface RegisterPayload {
  nom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  role_id?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// ─── Auth responses ──────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  nom: string;
  email: string;
  role?: RoleDetails;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  role_id?: number;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// ─── Generic API response ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
