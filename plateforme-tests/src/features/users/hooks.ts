import { useState, useEffect, useCallback } from "react";
import {
  getUsersApi,
  getUserByIdApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "./api";
import type { User } from "@/types";
import type {
  CreateUserPayload,
  UpdateUserPayload,
} from "./types";

// ─── useUsers (paginated list) ───────────────────────────────────────────────

export function useUsers() {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getUsersApi());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch users"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// ─── useUser (single) ────────────────────────────────────────────────────────

export function useUser(id: number) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getUserByIdApi(id)
      .then(setUser)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to fetch user")
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  return { user, isLoading, error };
}

// ─── useCreateUser ───────────────────────────────────────────────────────────

export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (payload: CreateUserPayload): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await createUserApi(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
      return null;
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

  const update = async (
    id: number,
    payload: UpdateUserPayload
  ): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await updateUserApi(id, payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading, error };
}

// ─── useDeleteUser ───────────────────────────────────────────────────────────

export function useDeleteUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteUserApi(id);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { remove, isLoading, error };
}
