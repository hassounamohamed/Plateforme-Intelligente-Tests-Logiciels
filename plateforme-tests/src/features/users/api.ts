import axiosInstance from "@/lib/axios";
import type { User } from "@/types";
import type { CreateUserPayload, UpdateUserPayload, PaginatedUsers } from "./types";

export async function getUsersApi(
  page = 1,
  limit = 10
): Promise<PaginatedUsers> {
  const { data } = await axiosInstance.get<PaginatedUsers>("/users", {
    params: { page, limit },
  });
  return data;
}

export async function getUserByIdApi(id: string): Promise<User> {
  const { data } = await axiosInstance.get<User>(`/users/${id}`);
  return data;
}

export async function createUserApi(payload: CreateUserPayload): Promise<User> {
  const { data } = await axiosInstance.post<User>("/users", payload);
  return data;
}

export async function updateUserApi(
  id: string,
  payload: UpdateUserPayload
): Promise<User> {
  const { data } = await axiosInstance.patch<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUserApi(id: string): Promise<void> {
  await axiosInstance.delete(`/users/${id}`);
}
