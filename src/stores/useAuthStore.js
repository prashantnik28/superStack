import { create } from 'zustand';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API = 'http://192.168.1.36:3000/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  register: async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, token: data.accessToken, isAuthenticated: true });
  },

  login: async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
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
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
