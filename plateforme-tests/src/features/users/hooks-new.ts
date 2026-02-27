import { useState, useEffect, useCallback } from "react";
import {
  getUsersApi,
  getPendingUsersApi,
  createUserApi,
  updateUserApi,
  activateUserApi,
  deactivateUserApi,
  deleteUserApi,
} from "./api";
import type { User } from "@/types";
import type { CreateUserPayload, UpdateUserPayload } from "./types";

// ─── useUsers (all users) ────────────────────────────────────────────────────

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { users, isLoading, error, refetch: fetch };
}

// ─── usePendingUsers ─────────────────────────────────────────────────────────

export function usePendingUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPendingUsersApi();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch pending users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { users, isLoading, error, refetch: fetch };
}

// ─── useCreateUser ───────────────────────────────────────────────────────────

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (payload: CreateUserPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await createUserApi(payload);
      return user;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading, error };
}

// ─── useUpdateUser ───────────────────────────────────────────────────────────

export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: number, payload: UpdateUserPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await updateUserApi(id, payload);
      return user;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update user";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading, error };
}

// ─── useActivateUser ─────────────────────────────────────────────────────────

export function useActivateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await activateUserApi(id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to activate user";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { activate, isLoading, error };
}

// ─── useDeactivateUser ───────────────────────────────────────────────────────

export function useDeactivateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivate = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await deactivateUserApi(id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to deactivate user";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { deactivate, isLoading, error };
}

// ─── useDeleteUser ───────────────────────────────────────────────────────────

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteUserApi(id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete user";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteUser, isLoading, error };
}
