import type { Role } from "@/types";

export interface Permission {
  id: string;
  action: string; // e.g. "create:test", "read:sprint"
  resource: string;
}

export interface RoleDefinition {
  id: string;
  name: Role;
  description: string;
  permissions: Permission[];
}

export type CreateRolePayload = Omit<RoleDefinition, "id">;
export type UpdateRolePayload = Partial<CreateRolePayload>;
