import { create } from 'zustand';
import api from '../lib/api';

const MEMBER_COLORS = [
  '#6C63FF', '#FF6B9D', '#4CAF82', '#FFB347', '#3B82F6', '#9C27B0', '#26C6DA',
];

// Dev default data — stays visible when no real family exists yet
const DEFAULT_MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', status: 'At School',   age: 9,  gender: 'male',   role: 'member', uniqueId: '', avatar: null, email: '',
    lastLocation: { latitude: 28.4810, longitude: 77.5122 }, lastLocationAt: new Date().toISOString() },
  { id: '2', name: 'Myra',  color: '#FF6B9D', status: 'Dance Class', age: 7,  gender: 'female', role: 'member', uniqueId: '', avatar: null, email: '',
    lastLocation: { latitude: 28.4680, longitude: 77.4968 }, lastLocationAt: new Date().toISOString() },
  { id: '3', name: 'Rajan', color: '#4CAF82', status: 'At Work',     age: 38, gender: 'male',   role: 'admin',  uniqueId: '', avatar: null, email: '',
    lastLocation: { latitude: 28.4900, longitude: 77.5085 }, lastLocationAt: new Date().toISOString() },
];

const DEFAULT_FAMILY = {
  _id: 'dev',
  name: 'Singh Family',
  plan: 'free',
  inviteCode: 'DEVMODE1',
  adminId: '3',
  memberCount: 3,
  limit: 5,
  canAddMore: true,
  needsUpgrade: false,
  atAbsoluteMax: false,
};

function colorFromIndex(i) {
  return MEMBER_COLORS[i % MEMBER_COLORS.length];
}

function mapMember(u, i) {
  return {
    id: String(u._id),
    uniqueId: u.uniqueId || '',
    username: u.username || '',
    name: u.name || 'Unknown',
    email: u.email || '',
    avatar: u.avatar || null,
    role: u.role || 'member',
    color: colorFromIndex(i),
    status: 'Active',
  };
}

export const useFamilyStore = create((set, get) => ({
  family: DEFAULT_FAMILY,
  members: DEFAULT_MEMBERS,
  isAdmin: true,
  loading: false,
  error: null,

  fetchFamily: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/family');
      const { family, members, isAdmin } = data.data;
      set({
        family,
        members: members.map(mapMember),
        isAdmin,
        loading: false,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        // No real family yet — fall back to dev defaults so screen isn't empty
        set({ family: DEFAULT_FAMILY, members: DEFAULT_MEMBERS, isAdmin: true, loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },

  createFamily: async (name) => {
    const { data } = await api.post('/family', { name });
    const { family, members, isAdmin } = data.data;
    set({ family, members: members.map(mapMember), isAdmin });
    return data.data;
  },

  searchUser: async (query) => {
    const { data } = await api.get(`/family/search?q=${encodeURIComponent(query)}`);
    return data.data;
  },

  addMember: async (userId) => {
    const { data } = await api.post('/family/members', { userId });
    const { family, members } = data.data;
    set({ family, members: members.map(mapMember) });
    return data.data;
  },

  removeMember: async (memberId) => {
    const prev = get().members;
    set({ members: prev.filter((m) => m.id !== memberId) });
    try {
      const { data } = await api.delete(`/family/members/${memberId}`);
      set({ members: data.data.members.map(mapMember) });
    } catch (err) {
      set({ members: prev });
      throw err;
    }
  },

  updateFamily: async (updates) => {
    const { data } = await api.patch('/family', updates);
    set({ family: data.data });
    return data.data;
  },

  joinFamily: async (inviteCode) => {
    const { data } = await api.post('/family/join', { inviteCode });
    const { family, members, isAdmin } = data.data;
    set({ family, members: members.map(mapMember), isAdmin });
    return data.data;
  },

  leaveFamily: async () => {
    await api.delete('/family/leave');
    set({ family: DEFAULT_FAMILY, members: DEFAULT_MEMBERS, isAdmin: true });
  },

  setMembers: (members) => set({ members }),
}));
