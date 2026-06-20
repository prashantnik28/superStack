import { create } from 'zustand';
import api from '../lib/api';

const CATEGORY_COLORS = {
  school:   '#6C63FF',
  health:   '#4CAF82',
  family:   '#FF6B9D',
  shopping: '#FFB347',
  home:     '#9C27B0',
  fitness:  '#F59E0B',
  reminder: '#EF4444',
  work:     '#3B82F6',
  other:    '#6B7280',
};

function fmt12(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Map category to glance type
const CATEGORY_TYPE = {
  school: 'routine', fitness: 'routine', home: 'routine',
  health: 'wellbeing',
  reminder: 'reminder', shopping: 'reminder',
  family: 'event', work: 'event',
};

function mapEvent(e) {
  const start = new Date(e.startTime);
  const end   = e.endTime ? new Date(e.endTime) : null;
  const cat   = e.category || 'family';
  return {
    id:              String(e._id || e.id),
    title:           e.title,
    description:     e.description  || '',
    location:        e.location     || '',
    phoneNumber:     e.phoneNumber  || '',
    sub:             [e.description, e.location].filter(Boolean).join(' · '),
    time:            fmt12(start),
    end:             end ? fmt12(end) : '',
    color:           e.color || CATEGORY_COLORS[cat] || '#6C63FF',
    icon:            e.icon || 'calendar',
    date:            start.getDate(),
    month:           start.getMonth(),
    year:            start.getFullYear(),
    category:        cat,
    type:            CATEGORY_TYPE[cat] || 'event',
    reminderMinutes: e.reminderMinutes ?? 30,
    completed:       e.completed       || false,
  };
}

export const useCalendarStore = create((set, get) => ({
  events:       [],
  todayGlance:  [],
  loading:      false,
  error:        null,
  editingEvent: null,

  setEditingEvent:   (event) => set({ editingEvent: event }),
  clearEditingEvent: ()      => set({ editingEvent: null }),

  fetchTodayGlance: async () => {
    const now = new Date();
    try {
      const { data } = await api.get('/calendar', {
        params: { month: now.getMonth() + 1, year: now.getFullYear() },
      });
      const today = now.getDate();
      const todayEvents = (data.data || [])
        .map(mapEvent)
        .filter(e => e.date === today || e.date === today + 1); // today + tomorrow events
      set({ todayGlance: todayEvents });
      return todayEvents;
    } catch {
      return [];
    }
  },

  markComplete: async (id) => {
    set(s => ({
      todayGlance: s.todayGlance.map(e => e.id === id ? { ...e, completed: true } : e),
      events:      s.events.map(e => e.id === id ? { ...e, completed: true } : e),
    }));
    try {
      await api.patch(`/calendar/${id}`, { completed: true });
    } catch {
      // rollback
      set(s => ({
        todayGlance: s.todayGlance.map(e => e.id === id ? { ...e, completed: false } : e),
      }));
    }
  },

  snoozeItem: async (id, minutes) => {
    await api.patch(`/calendar/${id}`, { reminderMinutes: minutes, reminderSent: false });
    set(s => ({
      todayGlance: s.todayGlance.map(e => e.id === id ? { ...e, reminderMinutes: minutes } : e),
    }));
  },

  fetchEvents: async (month, year) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/calendar', {
        params: { month: month + 1, year },
      });
      set({ events: (data.data || []).map(mapEvent), loading: false });
    } catch (e) {
      set({ error: e?.message || 'Failed to load events', loading: false });
    }
  },

  createEvent: async (dto) => {
    const { data } = await api.post('/calendar', dto);
    const newEvent = mapEvent(data.data);
    set((s) => ({ events: [...s.events, newEvent] }));
    return newEvent;
  },

  updateEvent: async (id, dto) => {
    // Optimistic — apply change immediately so UI responds instantly
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...dto } : e)),
    }));
    const { data } = await api.patch(`/calendar/${id}`, dto);
    const updated = mapEvent(data.data);
    set((s) => ({ events: s.events.map((e) => (e.id === id ? updated : e)) }));
    return updated;
  },

  deleteEvent: async (id) => {
    // Optimistic — remove immediately so UI responds instantly
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    await api.delete(`/calendar/${id}`);
  },
}));
