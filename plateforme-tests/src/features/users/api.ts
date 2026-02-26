import axiosInstance from "@/lib/axios";
import type { User } from "@/types";
import type { CreateUserPayload, UpdateUserPayload, UpdatePasswordPayload } from "./types";

// Get all users (Super Admin only)
export async function getUsersApi(): Promise<User[]> {
  const { data } = await axiosInstance.get<User[]>("/users");
  return data;
}

// Get pending users (Super Admin only)
export async function getPendingUsersApi(): Promise<User[]> {
  const { data } = await axiosInstance.get<User[]>("/users/pending");
  return data;
}

// Get user by ID
export async function getUserByIdApi(id: number): Promise<User> {
  const { data } = await axiosInstance.get<User>(`/users/${id}`);
  return data;
}

// Create user (Super Admin only)
export async function createUserApi(payload: CreateUserPayload): Promise<User> {
  const { data } = await axiosInstance.post<User>("/auth/register", payload);
  return data;
}

// Update user (Super Admin only)
export async function updateUserApi(
  id: number,
  payload: UpdateUserPayload
): Promise<User> {
  const { data } = await axiosInstance.patch<User>(`/users/${id}`, payload);
  return data;
}

// Activate user (Super Admin only)
export async function activateUserApi(id: number): Promise<void> {
  await axiosInstance.patch(`/users/${id}/activate`);
}

// Deactivate user (Super Admin only)
export async function deactivateUserApi(id: number): Promise<void> {
  await axiosInstance.patch(`/users/${id}/deactivate`);
}

export async function deleteUserApi(id: number): Promise<void> {
  await axiosInstance.delete(`/users/${id}`);
}

// Change password (current user)
export async function changePasswordApi(payload: UpdatePasswordPayload): Promise<void> {
  await axiosInstance.patch("/users/me/password", payload);
}

// Update profile (current user)
export async function updateProfileApi(payload: { nom?: string; telephone?: string }): Promise<void> {
  await axiosInstance.patch("/users/me/profile", payload);
}
