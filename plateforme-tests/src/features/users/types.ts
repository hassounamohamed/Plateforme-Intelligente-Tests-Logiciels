import type { User } from "@/types";

export type CreateUserPayload = {
  nom: string;
  email: string;
  motDePasse: string;
  telephone?: string;
  role_id: number;
};

export type UpdateUserPayload = {
  nom?: string;
  telephone?: string;
  actif?: boolean;
  role_id?: number;
};

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdatePasswordPayload {
  ancien_mot_de_passe: string;
  nouveau_mot_de_passe: string;
}
