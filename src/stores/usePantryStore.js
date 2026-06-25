import { create } from 'zustand';
import { fetchPantry, addPantryItem, updatePantryItem, deletePantryItem } from '../api/kitchenApi';

// Strip frontend-only fields (id, expiry, location) before sending to backend.
// The backend has forbidNonWhitelisted:true so any extra field causes a 400.
function toBackendPayload(item) {
  return {
    name:                item.name,
    barcode:             item.barcode             || undefined,
    brand:               item.brand               || undefined,
    category:            item.category            || undefined,
    subCategory:         item.subCategory         || undefined,
    country:             item.country             || undefined,
    productQuantity:     item.productQuantity      || undefined,
    emoji:               item.emoji               || undefined,
    imageUrl:            item.imageUrl            || undefined,
    thumbnailUrl:        item.thumbnailUrl         || undefined,
    ingredientsImageUrl: item.ingredientsImageUrl  || undefined,
    nutritionImageUrl:   item.nutritionImageUrl    || undefined,
    ingredients:         item.ingredients         || undefined,
    allergens:           item.allergens           || undefined,
    traces:              item.traces              || undefined,
    ingredientCount:     item.ingredientCount      || undefined,
    nutrition:           item.nutrition           || undefined,
    nutrientLevels:      item.nutrientLevels       || undefined,
    nutriScore:          item.nutriScore          || undefined,
    ecoScore:            item.ecoScore            || undefined,
    novaGroup:           item.novaGroup           || undefined,
    healthTags:          item.healthTags?.length   ? item.healthTags  : undefined,
    labels:              item.labels?.length       ? item.labels       : undefined,
    ai:                  item.ai                  || undefined,
    qty:                 Number(item.qty)          || 1,
    unit:                item.unit                || undefined,
    // resolve both aliases; only send if non-empty
    expiryDate:          item.expiryDate || item.expiry || undefined,
    purchaseDate:        (item.purchaseDate && item.purchaseDate !== '') ? item.purchaseDate : undefined,
    storageLocation:     item.storageLocation || item.location || undefined,
    price:               item.price != null ? Number(item.price) : undefined,
    notes:               item.notes               || undefined,
  };
}

function normalise(item) {
  // Strip time component from ISO strings (e.g. "2027-01-01T00:00:00.000Z" → "2027-01-01")
  const rawDate = item.expiryDate || item.expiry || '';
  const expiry  = rawDate ? rawDate.slice(0, 10) : '';
  return {
    ...item,
    id:              item.id || item._id,
    expiry,
    expiryDate:      expiry,
    location:        item.location        || item.storageLocation   || 'Pantry',
    storageLocation: item.storageLocation || item.location          || 'Pantry',
    qty:             item.qty             != null ? item.qty        : 1,
  };
}

export const usePantryStore = create((set, get) => ({
  items:   [],     // empty — loaded from backend on login
  loading: false,
  synced:  false,

  // ── Reset — called on logout so the next user starts clean ─────────────────
  reset: () => set({ items: [], loading: false, synced: false }),

  // ── Local-first mutations ──────────────────────────────────────────────────

  addItem: (item) => set(s => ({ items: [normalise(item), ...s.items] })),

  removeItem: (id) => set(s => ({
    items: s.items.filter(i => (i.id || i._id) !== id),
  })),

  updateItem: (id, updates) => set(s => ({
    items: s.items.map(i => (i.id || i._id) === id ? normalise({ ...i, ...updates }) : i),
  })),

  // ── API sync ────────────────────────────────────────────────────────────────

  fetchItems: async (params = {}) => {
    set({ loading: true });
    try {
      const data = await fetchPantry(params);
      set({ items: data.map(normalise), synced: true });
    } catch {
      // backend unreachable — keep whatever is in the store
    } finally {
      set({ loading: false });
    }
  },

  addItemRemote: async (item) => {
    const tempId = `temp_${Date.now()}`;
    const optimistic = normalise({ ...item, id: tempId });
    set(s => ({ items: [optimistic, ...s.items] }));
    try {
      const saved = await addPantryItem(toBackendPayload(item));
      set(s => ({
        items: s.items.map(i => i.id === tempId ? normalise(saved) : i),
      }));
      return saved;
    } catch {
      return optimistic;
    }
  },

  updateItemRemote: async (id, updates) => {
    get().updateItem(id, updates);
    try {
      const saved = await updatePantryItem(id, {
        ...updates,
        expiryDate:      updates.expiryDate      || updates.expiry    || undefined,
        storageLocation: updates.storageLocation  || updates.location  || undefined,
      });
      get().updateItem(id, normalise(saved));
    } catch {}
  },

  deleteItemRemote: async (id) => {
    get().removeItem(id);
    try { await deletePantryItem(id); } catch {}
  },
}));
