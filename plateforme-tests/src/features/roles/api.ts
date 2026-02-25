import axiosInstance from "@/lib/axios";
import type { RoleDefinition, CreateRolePayload, UpdateRolePayload } from "./types";

export async function getRolesApi(): Promise<RoleDefinition[]> {
  const { data } = await axiosInstance.get<RoleDefinition[]>("/roles");
  return data;
}

export async function getRoleByIdApi(id: string): Promise<RoleDefinition> {
  const { data } = await axiosInstance.get<RoleDefinition>(`/roles/${id}`);
  return data;
}

export async function createRoleApi(
  payload: CreateRolePayload
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.post<RoleDefinition>("/roles", payload);
  return data;
}

export async function updateRoleApi(
  id: string,
  payload: UpdateRolePayload
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.patch<RoleDefinition>(
    `/roles/${id}`,
    payload
  );
  return data;
}

export async function deleteRoleApi(id: string): Promise<void> {
  await axiosInstance.delete(`/roles/${id}`);
}
