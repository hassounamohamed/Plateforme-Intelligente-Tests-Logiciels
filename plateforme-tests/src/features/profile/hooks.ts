import { useState, useEffect } from "react";
import { UserProfile, getMyProfileApi, updateMyProfileApi, changePasswordApi, UpdateProfileData, ChangePasswordData } from "./api";

/**
 * Hook to get and update user profile
 */
export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMyProfileApi();
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<boolean> => {
    try {
      setError(null);
      const updatedProfile = await updateMyProfileApi(data);
      setProfile(updatedProfile);
      return true;
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Erreur lors de la mise à jour du profil");
      return false;
    }
  };

  const changePassword = async (data: ChangePasswordData): Promise<boolean> => {
    try {
      setError(null);
      await changePasswordApi(data);
      return true;
    } catch (err) {
      console.error("Failed to change password:", err);
      setError("Erreur lors du changement de mot de passe");
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    changePassword,
    refetch: fetchProfile,
  };
};
