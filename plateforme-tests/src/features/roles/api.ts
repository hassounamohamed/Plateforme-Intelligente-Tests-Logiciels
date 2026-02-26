import axiosInstance from "@/lib/axios";
import type {
  RoleDefinition,
  Permission,
  CreateRolePayload,
  UpdateRolePayload,
  AssignPermissionsPayload,
  AssignRoleToUserPayload,
} from "./types";

// Get all roles
export async function getRolesApi(): Promise<RoleDefinition[]> {
  const { data } = await axiosInstance.get<RoleDefinition[]>("/roles");
  return data;
}

// Get role by ID
export async function getRoleByIdApi(id: number): Promise<RoleDefinition> {
  const { data } = await axiosInstance.get<RoleDefinition>(`/roles/${id}`);
  return data;
}

// Create role
export async function createRoleApi(
  payload: CreateRolePayload
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.post<RoleDefinition>("/roles", payload);
  return data;
}

// Update role
export async function updateRoleApi(
  id: number,
  payload: UpdateRolePayload
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.put<RoleDefinition>(
    `/roles/${id}`,
    payload
  );
  return data;
}

// Delete role
export async function deleteRoleApi(id: number): Promise<void> {
  await axiosInstance.delete(`/roles/${id}`);
}

// Get all permissions
export async function getPermissionsApi(): Promise<Permission[]> {
  const { data } = await axiosInstance.get<Permission[]>("/roles/permissions");
  return data;
}

// Create permission
export async function createPermissionApi(
  nom: string,
  resource: string,
  action: string,
  description?: string
): Promise<Permission> {
  const { data } = await axiosInstance.post<Permission>("/roles/permissions", {
    nom,
    resource,
    action,
    description,
  });
  return data;
}

// Assign permissions to role
export async function assignPermissionsToRoleApi(
  roleId: number,
  payload: AssignPermissionsPayload
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.post<RoleDefinition>(
    `/roles/${roleId}/permissions`,
    payload
  );
  return data;
}

// Remove permission from role
export async function removePermissionFromRoleApi(
  roleId: number,
  permissionId: number
): Promise<RoleDefinition> {
  const { data } = await axiosInstance.delete<RoleDefinition>(
    `/roles/${roleId}/permissions/${permissionId}`
  );
  return data;
}

// Assign role to user
export async function assignRoleToUserApi(
  payload: AssignRoleToUserPayload
): Promise<void> {
  await axiosInstance.post("/roles/assign-user", payload);
}

// Get user role
export async function getUserRoleApi(userId: number): Promise<RoleDefinition> {
  const { data } = await axiosInstance.get<RoleDefinition>(`/roles/user/${userId}/role`);
  return data;
}
