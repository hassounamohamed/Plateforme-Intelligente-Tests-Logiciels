import axios from "axios";
import { API_URL } from "./constants";
import { getToken, getRefreshToken, setToken, logout } from "./auth";

// Extend Axios config to support custom suppressErrorLog flag
declare module "axios" {
  export interface AxiosRequestConfig {
    suppressErrorLog?: boolean;
  }
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request: attach Bearer token ───────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Axios Request]', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// ─── Response: silent token refresh on 401 ──────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Axios Response]', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Check if error logging should be suppressed for this request
    const suppressErrorLog = error.config?.suppressErrorLog;
    
    if (!suppressErrorLog) {
      console.error('[Axios Response Error]', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
    }

    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };

    const requestUrl = String(original?.url ?? "");
    const isPublicAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/request-reset-password") ||
      requestUrl.includes("/auth/reset-password") ||
      requestUrl.includes("/auth/select-role");

    // Never force logout/reload for login/register/reset flows.
    // These endpoints legitimately return 401/4xx for invalid credentials or validation errors.
    if (error.response?.status === 401 && isPublicAuthRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        setToken(data.accessToken);
        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return axiosInstance(original);
      } catch {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
