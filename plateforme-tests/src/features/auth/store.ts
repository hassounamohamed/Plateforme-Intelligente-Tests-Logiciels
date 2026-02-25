"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { User } from "@/types";
import { setToken, setRefreshToken, removeTokens, getToken } from "@/lib/auth";
import { getMeApi } from "./api";

// ─── State ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: User }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true until bootstrap resolves
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGOUT":
      return { user: null, isAuthenticated: false, isLoading: false };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  signIn: (user: User, accessToken: string, refreshToken: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Bootstrap: re-hydrate session from stored token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    getMeApi()
      .then((user) => dispatch({ type: "SET_USER", payload: user }))
      .catch(() => {
        removeTokens();
        dispatch({ type: "LOGOUT" });
      });
  }, []);

  const signIn = useCallback(
    (user: User, accessToken: string, refreshToken: string) => {
      setToken(accessToken);
      setRefreshToken(refreshToken);
      dispatch({ type: "SET_USER", payload: user });
    },
    []
  );

  const signOut = useCallback(() => {
    removeTokens();
    dispatch({ type: "LOGOUT" });
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { ...state, signIn, signOut } },
    children
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthStore must be used within <AuthProvider>");
  return ctx;
}
