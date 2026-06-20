import { create } from 'zustand';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API = `${process.env.EXPO_PUBLIC_API_URL}/api`;

// Always fetch token from SecureStore as source of truth (survives hot reloads)
async function getToken() {
  return (await SecureStore.getItemAsync('accessToken')) || null;
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrating: true,

  // Called once on app start — restores session from SecureStore
  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const token = await getToken();
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
        return false;
      }
      const { data } = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ user: data.data, token, isAuthenticated: true, isHydrating: false });
      return true;
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
      return false;
    }
  },

  register: async (userData) => {
    const { data } = await axios.post(`${API}/auth/register`, userData);
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.accessToken, isAuthenticated: true });
  },

  login: async (identifier, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { identifier, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.accessToken, isAuthenticated: true });
  },

  googleLogin: async (googleAccessToken) => {
    const { data } = await axios.post(`${API}/auth/google/token`, { accessToken: googleAccessToken });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.accessToken, isAuthenticated: true });
  },

  logout: async () => {
    try {
      const token = get().token || await getToken();
      if (token) await axios.post(`${API}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (_) {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const token = get().token || await getToken();
    if (!token) return;
    try {
      const { data } = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((s) => ({ user: { ...s.user, ...data.data }, token }));
    } catch (_) {}
  },

  updateProfile: async (updates) => {
    const token = get().token || await getToken();
    const { data } = await axios.patch(`${API}/users/me`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    set((s) => ({ user: { ...s.user, ...data.data } }));
    return data.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const token = get().token || await getToken();
    const { data } = await axios.patch(
      `${API}/auth/change-password`,
      { oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return data;
  },
}));
