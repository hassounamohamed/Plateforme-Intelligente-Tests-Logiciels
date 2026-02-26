export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export const TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export const ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  DASHBOARD: "/dashboard",
  DEVELOPER: "/dashboard/developer",
  PRODUCT_OWNER: "/dashboard/product-owner",
  QA: "/dashboard/qa",
  SCRUM_MASTER: "/dashboard/scrum-master",
  SUPER_ADMIN: "/dashboard/super-admin",
} as const;

export const ROLES = {
  DEVELOPPEUR: "DEVELOPPEUR",
  PRODUCT_OWNER: "PRODUCT_OWNER",
  TESTEUR_QA: "TESTEUR_QA",
  SCRUM_MASTER: "SCRUM_MASTER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
