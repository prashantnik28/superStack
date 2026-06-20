import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/useAuthStore';

const BASE = `${process.env.EXPO_PUBLIC_API_URL}/api`;

const api = axios.create({ baseURL: BASE });

// ── Request: attach access token ─────────────────────────────────────────────
api.interceptors.request.use(async (cfg) => {
  const { token } = useAuthStore.getState();
  const resolved = token || (await SecureStore.getItemAsync('accessToken'));
  if (resolved) cfg.headers.Authorization = `Bearer ${resolved}`;
  return cfg;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const { user } = useAuthStore.getState();
      if (!refreshToken || !user?._id) throw new Error('no refresh token');

      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        userId: user._id,
        refreshToken,
      });

      const newToken = data.accessToken;
      await SecureStore.setItemAsync('accessToken', newToken);
      useAuthStore.setState({ token: newToken });

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — clear session and redirect to login
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
