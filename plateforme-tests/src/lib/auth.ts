import { TOKEN_KEY, REFRESH_TOKEN_KEY, ROUTES } from "./constants";

// ─── Cookie helpers (readable by middleware) ────────────────────────────────

function setCookie(name: string, value: string, days?: number | null): void {
  if (typeof document === "undefined") return;
  if (days == null) {
    // Session cookie (no Expires)
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
    return;
  }
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ─── Token accessors ────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // Prefer sessionStorage (current session) then fallback to localStorage
  try {
    const s = sessionStorage.getItem(TOKEN_KEY);
    if (s) return s;
  } catch {}
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string, remember = false): void {
  if (typeof window === "undefined") return;
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
      setCookie(TOKEN_KEY, token, 7);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
      // session cookie
      setCookie(TOKEN_KEY, token, null);
    }
  } catch {}
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const s = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (s) return s;
  } catch {}
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string, remember = false): void {
  if (typeof window === "undefined") return;
  try {
    if (remember) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      try { sessionStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
    } else {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
    }
  } catch {}
}

export function removeTokens(): void {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { localStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    try { sessionStorage.removeItem(REFRESH_TOKEN_KEY); } catch {}
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
