import axios from "axios";
import { API_URL } from "./constants";
import { getToken, getRefreshToken, setToken, logout } from "./auth";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request: attach Bearer token ───────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response: silent token refresh on 401 ──────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = getRefreshToken();
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        setToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosInstance(original);
      } catch {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
