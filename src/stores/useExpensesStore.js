import { create } from 'zustand';
import api from '../lib/api';

const DEFAULT_BUDGETS = {
  food: 8000, transport: 3000, shopping: 5000, entertainment: 2000,
  health: 5000, education: 3000, bills: 5000, others: 2000,
};

function toDateStr(d) {
  if (!d) {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  }
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function mapTransaction(t) {
  return {
    id:                String(t._id || t.id),
    amount:            t.amount,
    type:              t.type || 'expense',
    category:          t.category,
    description:       t.description,
    date:              toDateStr(t.date),
    method:            t.method || 'cash',
    recurring:         t.recurring || false,
    recurringInterval: t.recurringInterval || null,
    splitWith:         (t.splitWith || []).map((s) => ({
      userId: String(s.userId),
      amount: s.amount,
    })),
    notes:     t.notes || '',
    createdBy: t.createdBy ? String(t.createdBy) : null,
  };
}

function mapGoal(g) {
  return {
    id:           String(g._id || g.id),
    name:         g.name,
    emoji:        g.emoji || '🎯',
    targetAmount: g.targetAmount,
    savedAmount:  g.savedAmount || 0,
    deadline:     g.deadline ? toDateStr(g.deadline) : null,
    createdBy:    g.createdBy ? String(g.createdBy) : null,
  };
}

export const useExpensesStore = create((set, get) => ({
  transactions: [],
  budgets:      { ...DEFAULT_BUDGETS },
  goals:        [],
  loading:      false,
  error:        null,
  selectedMonth:    new Date().getMonth(),
  selectedYear:     new Date().getFullYear(),
  currency:         'INR',
  setCurrency: async (c) => {
    set({ currency: c });
    try { await api.patch('/users/me', { currency: c }); } catch {}
  },
  hydrateCurrency: (c) => set({ currency: c || 'INR' }),
  fetchUserPreferences: async () => {
    try {
      const { data } = await api.get('/users/me');
      if (data.data?.currency) set({ currency: data.data.currency });
    } catch {}
  },
  monthlyBudgetCap: 0,  // 0 = not set; user-defined total monthly ceiling
  setMonthlyBudgetCap: async (v) => {
    const value = Math.max(0, v);
    set({ monthlyBudgetCap: value });
    const { selectedMonth, selectedYear } = get();
    try {
      await api.put('/expenses/budgets/__cap__', {
        limit: value,
        month: selectedMonth + 1,
        year:  selectedYear,
      });
    } catch {
      get().fetchBudgets(get().selectedMonth, get().selectedYear);
    }
  },

  setMonth: (month, year) => {
    set({ selectedMonth: month, selectedYear: year });
    get().fetchTransactions(month, year);
    get().fetchBudgets(month, year);
  },

  // ── Transactions ────────────────────────────────────────────────────────────

  fetchTransactions: async (month, year) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/expenses/transactions', {
        params: { month: month + 1, year },
      });
      set({ transactions: (data.data || []).map(mapTransaction), loading: false });
    } catch (e) {
      set({ error: e?.message || 'Failed to load', loading: false });
    }
  },

  fetchTransactionsRange: async (from, to) => {
    const { data } = await api.get('/expenses/transactions', { params: { from, to } });
    return (data.data || []).map(mapTransaction);
  },

  createTransaction: async (dto) => {
    const { data } = await api.post('/expenses/transactions', dto);
    const t = mapTransaction(data.data);
    const { selectedMonth, selectedYear } = get();
    const txDate = new Date(dto.date);
    if (txDate.getMonth() === selectedMonth && txDate.getFullYear() === selectedYear) {
      set((s) => ({ transactions: [t, ...s.transactions] }));
    }
    return t;
  },

  updateTransaction: async (id, dto) => {
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...dto } : t)),
    }));
    try {
      const { data } = await api.patch(`/expenses/transactions/${id}`, dto);
      const updated = mapTransaction(data.data);
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
      }));
      return updated;
    } catch (e) {
      // rollback
      get().fetchTransactions(get().selectedMonth, get().selectedYear);
      throw e;
    }
  },

  deleteTransaction: async (id) => {
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
    try {
      await api.delete(`/expenses/transactions/${id}`);
    } catch (e) {
      get().fetchTransactions(get().selectedMonth, get().selectedYear);
      throw e;
    }
  },

  // ── Budgets ─────────────────────────────────────────────────────────────────

  fetchBudgets: async (month, year) => {
    try {
      const { data } = await api.get('/expenses/budgets', {
        params: { month: month + 1, year },
      });
      const map = { ...DEFAULT_BUDGETS };
      let cap = 0;
      (data.data || []).forEach((b) => {
        if (b.category === '__cap__') { cap = b.limit; }
        else { map[b.category] = b.limit; }
      });
      set({ budgets: map, monthlyBudgetCap: cap });
    } catch {
      // keep defaults on error
    }
  },

  upsertBudget: async (category, limit) => {
    const { selectedMonth, selectedYear } = get();
    set((s) => ({ budgets: { ...s.budgets, [category]: limit } }));
    try {
      await api.put(`/expenses/budgets/${category}`, {
        limit,
        month: selectedMonth + 1,
        year:  selectedYear,
      });
    } catch (e) {
      get().fetchBudgets(get().selectedMonth, get().selectedYear);
      throw e;
    }
  },

  // ── Goals ───────────────────────────────────────────────────────────────────

  fetchGoals: async () => {
    try {
      const { data } = await api.get('/expenses/goals');
      set({ goals: (data.data || []).map(mapGoal) });
    } catch {}
  },

  createGoal: async (dto) => {
    const { data } = await api.post('/expenses/goals', dto);
    const g = mapGoal(data.data);
    set((s) => ({ goals: [...s.goals, g] }));
    return g;
  },

  updateGoal: async (id, dto) => {
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...dto } : g)),
    }));
    const { data } = await api.patch(`/expenses/goals/${id}`, dto);
    const updated = mapGoal(data.data);
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? updated : g)),
    }));
    return updated;
  },

  deleteGoal: async (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
    await api.delete(`/expenses/goals/${id}`);
  },

  contributeToGoal: async (id, amount) => {
    const { data } = await api.patch(`/expenses/goals/${id}/contribute`, { amount });
    const updated = mapGoal(data.data);
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? updated : g)),
    }));
    return updated;
  },
}));
