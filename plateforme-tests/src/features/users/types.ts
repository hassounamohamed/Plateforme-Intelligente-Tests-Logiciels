import type { User, Role } from "@/types";

export type CreateUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
};

export type UpdateUserPayload = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt"> & { password?: string }
>;

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}
