import { useState, useCallback } from "react";
import {
  APIKeyStatus,
  APIKeyQuota,
  APIKeyCreateRequest,
  getAPIKeyStatusApi,
  saveAPIKeyApi,
  toggleAPIKeyApi,
  deleteAPIKeyApi,
  getAPIKeyQuotaApi,
} from "./api-key-api";

/**
 * Hook to manage user's custom API key
 */
export const useAPIKey = () => {
  const [apiKeyStatus, setAPIKeyStatus] = useState<APIKeyStatus | null>(null);
  const [apiKeyQuota, setAPIKeyQuota] = useState<APIKeyQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Fetch API key status and quota
   */
  const fetchAPIKeyStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statusData, quotaData] = await Promise.all([
        getAPIKeyStatusApi(),
        getAPIKeyQuotaApi(),
      ]);
      setAPIKeyStatus(statusData);
      setAPIKeyQuota(quotaData);
    } catch (err) {
      console.error("Failed to fetch API key status:", err);
      setError("Erreur lors du chargement du statut de la clé API");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save or update API key
   */
  const saveAPIKey = useCallback(async (apiKey: string): Promise<boolean> => {
    try {
      setError(null);
      const data: APIKeyCreateRequest = {
        api_key: apiKey,
        provider: "openrouter",
      };
      const result = await saveAPIKeyApi(data);
      setAPIKeyStatus(result);
      setSuccessMessage("Clé API sauvegardée avec succès");
      setTimeout(() => setSuccessMessage(null), 5000);
      return true;
    } catch (err) {
      console.error("Failed to save API key:", err);
      setError("Erreur lors de la sauvegarde de la clé API");
      return false;
    }
  }, []);

  /**
   * Toggle API key usage
   */
  const toggleAPIKeyUsage = useCallback(async (useCustom: boolean): Promise<boolean> => {
    try {
      setError(null);
      const result = await toggleAPIKeyApi(useCustom);
      setAPIKeyStatus(result);
      const message = useCustom
        ? "Passage à votre clé API personnalisée"
        : "Passage à la clé API de la plateforme";
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 5000);
      return true;
    } catch (err) {
      console.error("Failed to toggle API key:", err);
      setError("Erreur lors du changement de clé API");
      return false;
    }
  }, []);

  /**
   * Delete API key
   */
  const deleteAPIKey = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      await deleteAPIKeyApi();
      if (apiKeyStatus) {
        setAPIKeyStatus({
          ...apiKeyStatus,
          has_custom_key: false,
          use_custom_api_key: false,
          masked_key: null,
          api_key_created_at: null,
          api_key_last_used: null,
        });
      }
      setSuccessMessage("Clé API supprimée avec succès");
      setTimeout(() => setSuccessMessage(null), 5000);
      return true;
    } catch (err) {
      console.error("Failed to delete API key:", err);
      setError("Erreur lors de la suppression de la clé API");
      return false;
    }
  }, [apiKeyStatus]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear success message
   */
  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    apiKeyStatus,
    apiKeyQuota,
    isLoading,
    error,
    successMessage,
    fetchAPIKeyStatus,
    saveAPIKey,
    toggleAPIKeyUsage,
    deleteAPIKey,
    clearError,
    clearSuccess,
  };
};
