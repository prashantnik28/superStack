import { create } from 'zustand';
import api from '../lib/api';

export const PERSONAL_CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Footwear', 'Accessories', 'Outerwear', 'Other'];
export const HOME_CATEGORIES     = ['All', 'Bedding', 'Upholstery', 'Towels', 'Kitchen Linens', 'Curtains', 'Other'];

export const useWardrobeStore = create((set, get) => ({
  items:       [],
  stats:       { total: 0, laundry: 0, lastAdded: null },
  suggestions: [],
  loading:     false,
  statsLoading: false,
  suggestLoading: false,
  error:       null,

  // Which wardrobe is active: { type: 'personal'|'home', memberId: string|null, memberName: string }
  activeWardrobe: null,

  reset: () => set({ items: [], stats: { total: 0, laundry: 0, lastAdded: null }, suggestions: [], loading: false, error: null, activeWardrobe: null }),

  // ── Fetch ─────────────────────────────────────────────────────────────────

  fetchItems: async (wardrobeType = 'personal', memberId = null, category = null) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ type: wardrobeType });
      if (memberId) params.append('memberId', memberId);
      if (category && category !== 'All') params.append('category', category);
      const { data } = await api.get(`/wardrobe/items?${params}`);
      set({ items: data.data || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false, items: [] });
    }
  },

  fetchStats: async (memberId = null) => {
    set({ statsLoading: true });
    try {
      const params = memberId ? `?memberId=${memberId}` : '';
      const { data } = await api.get(`/wardrobe/stats${params}`);
      set({ stats: data.data, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────

  // Upload a local file URI to the server; returns the public URL
  uploadImage: async (localUri) => {
    if (!localUri || localUri.startsWith('http')) return localUri;
    const filename = localUri.split('/').pop() || 'wardrobe.jpg';
    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const form = new FormData();
    form.append('file', { uri: localUri, name: filename, type: mimeType });
    const { data } = await api.post('/wardrobe/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data?.url ?? null;
  },

  addItem: async (dto) => {
    // Upload image first if it's still a local file URI
    let imageUrl = dto.imageUrl ?? null;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await get().uploadImage(imageUrl);
    }
    const { data } = await api.post('/wardrobe/items', { ...dto, imageUrl });
    const newItem = data.data;
    if (!newItem) throw new Error('Invalid response from server');
    set(s => ({ items: [newItem, ...s.items], stats: { ...s.stats, total: s.stats.total + 1 } }));
    return newItem;
  },

  // Adds to local state without API (used when backend is unavailable)
  addItemLocal: (dto) => {
    const newItem = {
      id: `local_${Date.now()}`,
      wears: 0, isClean: true, imageUrl: dto.imageUrl || null,
      createdAt: new Date().toISOString(),
      ...dto,
    };
    set(s => ({ items: [newItem, ...s.items], stats: { ...s.stats, total: s.stats.total + 1 } }));
    return newItem;
  },

  updateItem: async (id, dto) => {
    const { data } = await api.patch(`/wardrobe/items/${id}`, dto);
    const updated = data.data;
    set(s => ({ items: s.items.map(it => it.id === id ? updated : it) }));
    return updated;
  },

  markWorn: async (id) => {
    const { data } = await api.patch(`/wardrobe/items/${id}/worn`);
    const updated = data.data;
    set(s => ({
      items: s.items.map(it => it.id === id ? updated : it),
      stats: { ...s.stats, laundry: s.stats.laundry + 1 },
    }));
    return updated;
  },

  markClean: async (id) => {
    return get().updateItem(id, { isClean: true });
  },

  deleteItem: async (id) => {
    set(s => ({ items: s.items.filter(it => it.id !== id), stats: { ...s.stats, total: Math.max(0, s.stats.total - 1) } }));
    try { await api.delete(`/wardrobe/items/${id}`); }
    catch (err) { await get().fetchItems(); throw err; }
  },

  // ── Suggestions ───────────────────────────────────────────────────────────

  fetchSuggestions: async (occasion, memberId = null) => {
    set({ suggestLoading: true });
    try {
      const body = { occasion };
      if (memberId) body.memberId = memberId;
      const { data } = await api.post('/wardrobe/suggestions', body);
      set({ suggestions: data.data || [], suggestLoading: false });
      return data.data || [];
    } catch (err) {
      set({ suggestLoading: false });
      throw err;
    }
  },

  toggleLike: (outfitId) => set(s => ({
    suggestions: s.suggestions.map(o => o.id === outfitId ? { ...o, liked: !o.liked } : o),
  })),

  setActiveWardrobe: (wardrobe) => set({ activeWardrobe: wardrobe, items: [] }),
}));
