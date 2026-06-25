import { create } from 'zustand';
import api from '../lib/api';

const MEMBER_COLORS = [
  '#6C63FF', '#FF6B9D', '#4CAF82', '#FFB347', '#3B82F6', '#9C27B0', '#26C6DA',
];


function colorFromIndex(i) { return MEMBER_COLORS[i % MEMBER_COLORS.length]; }

function mapMember(u, i) {
  return {
    id:        String(u._id),
    uniqueId:  u.uniqueId  || '',
    username:  u.username  || '',
    name:      u.name      || 'Unknown',
    email:     u.email     || '',
    avatar:    u.avatar    || null,
    role:      u.role      || 'member',
    color:     colorFromIndex(i),
    status:    'Active',
  };
}

function mapDependent(d, offset = 0) {
  return {
    id:       String(d.id || d._id),
    name:     d.name,
    age:      d.age    ?? null,
    gender:   d.gender ?? null,
    color:    d.color  || colorFromIndex(offset),
    emoji:    d.emoji  || '👶',
    role:     'child',
    avatar:   null,
    email:    '',
    status:   'At Home',
    uniqueId: '',
  };
}

export const useFamilyStore = create((set, get) => ({
  family:         null,
  members:        [],
  dependents:     [],
  pendingInvites: [],
  isAdmin:        true,
  loading:        false,
  error:          null,

  reset: () => set({
    family: null, members: [], dependents: [],
    pendingInvites: [], isAdmin: false, loading: false, error: null,
  }),

  // ── Family ─────────────────────────────────────────────────────────────────

  fetchFamily: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/family');
      const { family, members, dependents = [], isAdmin } = data.data;
      set({
        family,
        members:    members.map(mapMember),
        dependents: dependents.map((d, i) => mapDependent(d, members.length + i)),
        isAdmin,
        loading: false,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        set({ family: null, members: [], dependents: [], isAdmin: false, loading: false });
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },

  createFamily: async (name) => {
    const { data } = await api.post('/family', { name });
    const { family, members, dependents = [], isAdmin } = data.data;
    set({ family, members: members.map(mapMember), dependents: dependents.map(mapDependent), isAdmin });
    return data.data;
  },

  updateFamily: async (updates) => {
    const { data } = await api.patch('/family', updates);
    set({ family: data.data });
    return data.data;
  },

  leaveFamily: async () => {
    await api.delete('/family/leave');
    set({ family: null, members: [], dependents: [], isAdmin: false });
  },

  // ── Search ─────────────────────────────────────────────────────────────────

  searchUser: async (query) => {
    const { data } = await api.get(`/family/search?q=${encodeURIComponent(query)}`);
    return data.data;
  },

  // ── Invites ────────────────────────────────────────────────────────────────

  sendInvite: async (query) => {
    const { data } = await api.post('/family/invite', { query });
    return data.data;
  },

  fetchPendingInvites: async () => {
    try {
      const { data } = await api.get('/family/invites/pending');
      set({ pendingInvites: data.data || [] });
      return data.data || [];
    } catch {
      return [];
    }
  },

  acceptInvite: async (inviteId) => {
    const { data } = await api.post(`/family/invite/${inviteId}/accept`);
    const { family, members, dependents = [], isAdmin } = data.data;
    set({
      family,
      members:        members.map(mapMember),
      dependents:     dependents.map((d, i) => mapDependent(d, members.length + i)),
      isAdmin,
      pendingInvites: get().pendingInvites.filter(inv => inv.id !== inviteId),
    });
    return data.data;
  },

  declineInvite: async (inviteId) => {
    await api.post(`/family/invite/${inviteId}/decline`);
    set({ pendingInvites: get().pendingInvites.filter(inv => inv.id !== inviteId) });
  },

  // ── Direct member management ───────────────────────────────────────────────

  addMember: async (userId) => {
    const { data } = await api.post('/family/members', { userId });
    const { family, members } = data.data;
    set({ family, members: members.map(mapMember) });
    return data.data;
  },

  removeMember: async (memberId) => {
    const prev = get().members;
    set({ members: prev.filter(m => m.id !== memberId) });
    try {
      const { data } = await api.delete(`/family/members/${memberId}`);
      set({ members: data.data.members.map(mapMember) });
    } catch (err) {
      set({ members: prev });
      throw err;
    }
  },

  joinFamily: async (inviteCode) => {
    const { data } = await api.post('/family/join', { inviteCode });
    const { family, members, dependents = [], isAdmin } = data.data;
    set({ family, members: members.map(mapMember), dependents: dependents.map(mapDependent), isAdmin });
    return data.data;
  },

  // ── Dependents ────────────────────────────────────────────────────────────

  addDependent: async (dto) => {
    const { data } = await api.post('/family/dependents', dto);
    const dep = data.data;
    set(s => ({
      dependents: [...s.dependents, mapDependent(dep, s.members.length + s.dependents.length)],
    }));
    return dep;
  },

  updateDependent: async (id, dto) => {
    const { data } = await api.patch(`/family/dependents/${id}`, dto);
    const updated = data.data;
    set(s => ({
      dependents: s.dependents.map((d, i) =>
        d.id === id ? mapDependent(updated, s.members.length + i) : d
      ),
    }));
    return updated;
  },

  removeDependent: async (id) => {
    set(s => ({ dependents: s.dependents.filter(d => d.id !== id) }));
    try {
      await api.delete(`/family/dependents/${id}`);
    } catch (err) {
      // rollback on failure
      await get().fetchFamily();
      throw err;
    }
  },

  setMembers: (members) => set({ members }),
}));
