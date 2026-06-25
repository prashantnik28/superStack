import api from '../lib/api';

// ── Pantry ─────────────────────────────────────────────────────────────────────

export const fetchPantry = ({ category, location, expiring } = {}) => {
  const params = {};
  if (category) params.category = category;
  if (location) params.location  = location;
  if (expiring) params.expiring  = expiring;
  return api.get('/kitchen/pantry', { params }).then(r => r.data.data);
};

export const fetchExpiringPantry = (days = 7) =>
  api.get('/kitchen/pantry/expiring', { params: { days } }).then(r => r.data.data);

export const addPantryItem = (item) =>
  api.post('/kitchen/pantry', item).then(r => r.data.data);

export const updatePantryItem = (id, updates) =>
  api.patch(`/kitchen/pantry/${id}`, updates).then(r => r.data.data);

export const deletePantryItem = (id) =>
  api.delete(`/kitchen/pantry/${id}`).then(r => r.data);

// ── Shopping ───────────────────────────────────────────────────────────────────

export const fetchShopping = (done) => {
  const params = done !== undefined ? { done } : {};
  return api.get('/kitchen/shopping', { params }).then(r => r.data.data);
};

export const addShoppingItem = (item) =>
  api.post('/kitchen/shopping', item).then(r => r.data.data);

export const updateShoppingItem = (id, updates) =>
  api.patch(`/kitchen/shopping/${id}`, updates).then(r => r.data.data);

export const deleteShoppingItem = (id) =>
  api.delete(`/kitchen/shopping/${id}`).then(r => r.data);

export const clearDoneShopping = () =>
  api.delete('/kitchen/shopping/done').then(r => r.data);

export const moveToPantry = (id) =>
  api.post(`/kitchen/shopping/${id}/to-pantry`).then(r => r.data.data);

// ── Recipes ────────────────────────────────────────────────────────────────────

export const fetchRecipes = (category) => {
  const params = category ? { category } : {};
  return api.get('/kitchen/recipes', { params }).then(r => r.data.data);
};

export const fetchRecipe = (id) =>
  api.get(`/kitchen/recipes/${id}`).then(r => r.data.data);

export const createRecipe = (recipe) =>
  api.post('/kitchen/recipes', recipe).then(r => r.data.data);

export const updateRecipe = (id, updates) =>
  api.patch(`/kitchen/recipes/${id}`, updates).then(r => r.data.data);

export const deleteRecipe = (id) =>
  api.delete(`/kitchen/recipes/${id}`).then(r => r.data);

// ── Meal Plan ──────────────────────────────────────────────────────────────────

export const fetchMealPlan = (week) => {
  const params = week ? { week } : {};
  return api.get('/kitchen/meal-plan', { params }).then(r => r.data.data);
};

export const saveMealPlan = (weekKey, slots) =>
  api.put('/kitchen/meal-plan', { weekKey, slots }).then(r => r.data.data);

export const clearMealSlot = (weekKey, slotKey) =>
  api.delete(`/kitchen/meal-plan/${weekKey}/${slotKey}`).then(r => r.data);
