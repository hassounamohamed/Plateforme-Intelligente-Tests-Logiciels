import axios from "@/lib/axios";

/**
 * API Key Status Response interface
 */
export interface APIKeyStatus {
  has_custom_key: boolean;
  use_custom_api_key: boolean;
  provider: string;
  masked_key: string | null;
  api_key_created_at: string | null;
  api_key_last_used: string | null;
}

/**
 * API Key Quota Response interface
 */
export interface APIKeyQuota {
  quota_limit_free: number;
  quota_used: number;
  quota_remaining: number;
  quota_percentage: number;
  quota_exhausted: boolean;
  has_custom_key: boolean;
  next_reset_date: string | null;
}

/**
 * Request to save API key
 */
export interface APIKeyCreateRequest {
  api_key: string;
  provider?: string;
}

/**
 * Get API key status for current user
 */
export const getAPIKeyStatusApi = async (): Promise<APIKeyStatus> => {
  const response = await axios.get("/users/me/api-key/status");
  return response.data;
};

/**
 * Save or update user's custom API key
 */
export const saveAPIKeyApi = async (data: APIKeyCreateRequest): Promise<APIKeyStatus> => {
  const response = await axios.post("/users/me/api-key", {
    api_key: data.api_key,
    provider: data.provider || "openrouter",
  });
  return response.data;
};

/**
 * Toggle between custom and platform API key
 */
export const toggleAPIKeyApi = async (useCustom: boolean): Promise<APIKeyStatus> => {
  const response = await axios.patch("/users/me/api-key/toggle", {
    use_custom_api_key: useCustom,
  });
  return response.data;
};

/**
 * Delete user's custom API key
 */
export const deleteAPIKeyApi = async (): Promise<{ message: string; use_custom_api_key: boolean }> => {
  const response = await axios.delete("/users/me/api-key");
  return response.data;
};

/**
 * Get API key quota status
 */
export const getAPIKeyQuotaApi = async (): Promise<APIKeyQuota> => {
  const response = await axios.get("/users/me/api-key/quota");
  return response.data;
};
