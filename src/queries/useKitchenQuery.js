import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPantry, fetchExpiringPantry,
  addPantryItem, updatePantryItem, deletePantryItem,
  fetchShopping, addShoppingItem, updateShoppingItem,
  deleteShoppingItem, clearDoneShopping, moveToPantry,
  fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe,
  fetchMealPlan, saveMealPlan, clearMealSlot,
} from '../api/kitchenApi';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const KITCHEN_KEYS = {
  pantry:   (params = {}) => ['kitchen', 'pantry', params],
  expiring: (days)        => ['kitchen', 'pantry', 'expiring', days],
  shopping: (done)        => ['kitchen', 'shopping', done],
  recipes:  (cat)         => ['kitchen', 'recipes', cat],
  recipe:   (id)          => ['kitchen', 'recipe', id],
  mealPlan: (week)        => ['kitchen', 'meal-plan', week],
};

// ── Pantry ─────────────────────────────────────────────────────────────────────

export function usePantryQuery(params = {}) {
  return useQuery({
    queryKey:  KITCHEN_KEYS.pantry(params),
    queryFn:   () => fetchPantry(params),
    staleTime: 60_000,
    retry:     1,
  });
}

export function useExpiringPantryQuery(days = 7) {
  return useQuery({
    queryKey: KITCHEN_KEYS.expiring(days),
    queryFn:  () => fetchExpiringPantry(days),
    staleTime: 60_000,
  });
}

export function useAddPantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addPantryItem,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'pantry'] }),
  });
}

export function useUpdatePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updatePantryItem(id, updates),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'pantry'] }),
  });
}

export function useDeletePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePantryItem,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'pantry'] }),
  });
}

// ── Shopping ───────────────────────────────────────────────────────────────────

export function useShoppingQuery(done) {
  return useQuery({
    queryKey:  KITCHEN_KEYS.shopping(done),
    queryFn:   () => fetchShopping(done),
    staleTime: 30_000,
  });
}

export function useAddShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addShoppingItem,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'shopping'] }),
  });
}

export function useUpdateShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateShoppingItem(id, updates),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'shopping'] }),
  });
}

export function useDeleteShoppingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteShoppingItem,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'shopping'] }),
  });
}

export function useClearDoneShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearDoneShopping,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'shopping'] }),
  });
}

export function useMoveToPantry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveToPantry,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['kitchen', 'pantry'] });
      qc.invalidateQueries({ queryKey: ['kitchen', 'shopping'] });
    },
  });
}

// ── Recipes ────────────────────────────────────────────────────────────────────

export function useRecipesQuery(category) {
  return useQuery({
    queryKey:  KITCHEN_KEYS.recipes(category),
    queryFn:   () => fetchRecipes(category),
    staleTime: 120_000,
  });
}

export function useRecipeQuery(id) {
  return useQuery({
    queryKey: KITCHEN_KEYS.recipe(id),
    queryFn:  () => fetchRecipe(id),
    staleTime: 120_000,
    enabled:  !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'recipes'] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateRecipe(id, updates),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'recipes'] }),
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'recipes'] }),
  });
}

// ── Meal Plan ──────────────────────────────────────────────────────────────────

export function useMealPlanQuery(week) {
  return useQuery({
    queryKey:  KITCHEN_KEYS.mealPlan(week),
    queryFn:   () => fetchMealPlan(week),
    staleTime: 120_000,
  });
}

export function useSaveMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, slots }) => saveMealPlan(weekKey, slots),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'meal-plan'] }),
  });
}

export function useClearMealSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, slotKey }) => clearMealSlot(weekKey, slotKey),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['kitchen', 'meal-plan'] }),
  });
}
