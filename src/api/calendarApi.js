import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL;

async function headers() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiCreateEvent(payload) {
  const h = await headers();
  const { data } = await axios.post(`${BASE}/api/calendar`, payload, { headers: h });
  return data.data;
}

export async function apiGetEvents(params = {}) {
  const h = await headers();
  const { data } = await axios.get(`${BASE}/api/calendar`, { headers: h, params });
  return data.data;
}

export async function apiUpdateEvent(id, payload) {
  const h = await headers();
  const { data } = await axios.patch(`${BASE}/api/calendar/${id}`, payload, { headers: h });
  return data.data;
}

export async function apiDeleteEvent(id) {
  const h = await headers();
  await axios.delete(`${BASE}/api/calendar/${id}`, { headers: h });
}
