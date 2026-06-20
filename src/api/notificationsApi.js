import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL;

async function headers() {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGetNotifications() {
  const h = await headers();
  const { data } = await axios.get(`${BASE}/api/notifications`, { headers: h });
  return data.data;
}

export async function apiGetUnreadCount() {
  const h = await headers();
  const { data } = await axios.get(`${BASE}/api/notifications/unread-count`, { headers: h });
  return data.data.count;
}

export async function apiMarkAllRead() {
  const h = await headers();
  await axios.patch(`${BASE}/api/notifications/read-all`, {}, { headers: h });
}

export async function apiMarkRead(id) {
  const h = await headers();
  const { data } = await axios.patch(`${BASE}/api/notifications/${id}/read`, {}, { headers: h });
  return data.data;
}
