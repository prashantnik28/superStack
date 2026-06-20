import { create } from 'zustand';
import api from '../lib/api';

const TYPE_META = {
  event_reminder:         { icon: 'alarm',                color: '#FFB347' },
  event_created:          { icon: 'calendar',             color: '#4CAF82' },
  event_updated:          { icon: 'create-outline',       color: '#3B82F6' },
  event_deleted:          { icon: 'trash-outline',        color: '#EF4444' },
  family_member_added:    { icon: 'person-add',           color: '#6C63FF' },
  family_member_removed:  { icon: 'person-remove-outline',color: '#EF4444' },
  family_joined:          { icon: 'people',               color: '#4CAF82' },
  expense_created:        { icon: 'wallet-outline',       color: '#FFB347' },
  budget_alert:           { icon: 'alert-circle-outline', color: '#EF4444' },
  kitchen_expiry:         { icon: 'time-outline',         color: '#FF6B6B' },
  kitchen_item_added:     { icon: 'cart',                 color: '#4CAF82' },
  wellbeing_checkin:      { icon: 'heart',                color: '#FF6B9D' },
  tracking_alert:         { icon: 'location',             color: '#3B82F6' },
  tracking_zone_entered:  { icon: 'enter-outline',        color: '#4CAF82' },
  tracking_zone_exited:   { icon: 'exit-outline',         color: '#FFB347' },
  system:                 { icon: 'notifications',        color: '#6C63FF' },
};

function relativeTime(date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000)      return 'Just now';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)} hr ago`;
  if (diff < 172_800_000) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapNotification(n) {
  const meta = TYPE_META[n.type] || TYPE_META.system;
  return {
    id:          n._id,
    icon:        meta.icon,
    color:       meta.color,
    title:       n.title,
    body:        n.body,
    sub:         n.body,
    time:        relativeTime(new Date(n.createdAt)),
    read:        n.read,
    actionRoute: n.actionRoute || null,
    createdAt:   n.createdAt,
  };
}

export const useNotificationsStore = create((set) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: (data.data || []).map(mapNotification), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      set({ unreadCount: data.data?.count ?? 0 });
    } catch {}
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        unreadCount:   Math.max(0, s.unreadCount - 1),
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount:   0,
      }));
    } catch {}
  },

  deleteNotification: async (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    try { await api.delete(`/notifications/${id}`); } catch {}
  },
}));
