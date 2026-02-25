import { useState, useEffect, useCallback } from "react";
import {
  getRolesApi,
  getRoleByIdApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from "./api";
import type { RoleDefinition, CreateRolePayload, UpdateRolePayload } from "./types";

// ─── useRoles ────────────────────────────────────────────────────────────────

export function useRoles() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRoles(await getRolesApi());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { roles, isLoading, error, refetch: fetch };
}

// ─── useRole (single) ────────────────────────────────────────────────────────

export function useRole(id: string) {
  const [role, setRole] = useState<RoleDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getRoleByIdApi(id)
      .then(setRole)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to fetch role")
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  return { role, isLoading, error };
}

// ─── useCreateRole ───────────────────────────────────────────────────────────

export function useCreateRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (
    payload: CreateRolePayload
  ): Promise<RoleDefinition | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await createRoleApi(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create role");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { create, isLoading, error };
}

// ─── useUpdateRole ───────────────────────────────────────────────────────────

export function useUpdateRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (
    id: string,
    payload: UpdateRolePayload
  ): Promise<RoleDefinition | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await updateRoleApi(id, payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update role");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { update, isLoading, error };
}

// ─── useDeleteRole ───────────────────────────────────────────────────────────

export function useDeleteRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteRoleApi(id);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { remove, isLoading, error };
}
