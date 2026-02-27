export interface Permission {
  id: number;
  nom: string;
  resource: string;
  action: string;
  description?: string;
}

export interface RoleDefinition {
  id: number;
  nom: string;
  code: string;
  description?: string;
  niveau_acces: number;
  permissions: Permission[];
}

export type CreateRolePayload = {
  nom: string;
  code: string;
  description?: string;
  niveau_acces: number;
};

export type UpdateRolePayload = {
  nom?: string;
  description?: string;
  niveau_acces?: number;
};

export type AssignPermissionsPayload = {
  permission_ids: number[];
};

export type AssignRoleToUserPayload = {
  user_id: number;
  role_id: number;
};
