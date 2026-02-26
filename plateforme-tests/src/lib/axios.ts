import axios from "axios";
import { API_URL } from "./constants";
import { getToken, getRefreshToken, setToken, logout } from "./auth";

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
    // Log request for debugging
    console.log('[Axios Request]', config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      data: config.data,
    });
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
    console.log('[Axios Response]', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('[Axios Response Error]', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };

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
