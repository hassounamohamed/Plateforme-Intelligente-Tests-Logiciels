import axios from "@/lib/axios";

export interface UserProfile {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  role_id: number;
  actif: boolean;
  role?: {
    id: number;
    nom: string;
    code: string;
    description?: string;
    niveau_acces?: number;
    permissions?: Array<{
      id: number;
      nom: string;
      resource: string;
      action: string;
    }>;
  };
}

export interface UpdateProfileData {
  nom?: string;
  telephone?: string;
}

export interface ChangePasswordData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

const isEncryptedLikeValue = (value?: string): boolean => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.startsWith("gAAAA") && trimmed.length > 80;
};

const sanitizeProfile = (profile: UserProfile): UserProfile => {
  if (!isEncryptedLikeValue(profile.telephone)) {
    return profile;
  }

  return {
    ...profile,
    telephone: "",
  };
};

/**
 * Get current user profile
 */
export const getMyProfileApi = async (): Promise<UserProfile> => {
  const response = await axios.get("/auth/me");
  return sanitizeProfile(response.data);
};

/**
 * Update current user profile
 */
export const updateMyProfileApi = async (data: UpdateProfileData): Promise<UserProfile> => {
  const response = await axios.patch("/users/me/profile", data);
  return sanitizeProfile(response.data);
};

/**
 * Change password for current user
 */
export const changePasswordApi = async (data: ChangePasswordData): Promise<void> => {
  await axios.patch("/users/me/password", {
    ancien_mot_de_passe: data.ancienMotDePasse,
    nouveau_mot_de_passe: data.nouveauMotDePasse,
  });
};
