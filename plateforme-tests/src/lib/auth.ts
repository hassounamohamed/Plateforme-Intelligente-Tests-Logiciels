import { TOKEN_KEY, REFRESH_TOKEN_KEY, ROUTES } from "./constants";

// ─── Cookie helpers (readable by middleware) ────────────────────────────────

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ─── Token accessors ────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  setCookie(TOKEN_KEY, token); // keep cookie in sync for middleware
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function removeTokens(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  removeCookie(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function logout(): void {
  removeTokens();
  window.location.href = ROUTES.LOGIN;
}

// ─── JWT decode (client-side only, no verification) ─────────────────────────

export function decodeToken<T = Record<string, unknown>>(
  token: string
): T | null {
  try {
    return JSON.parse(atob(token.split(".")[1])) as T;
  } catch {
    return null;
  }
}
