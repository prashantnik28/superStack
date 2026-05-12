import { create } from 'zustand';

export const useServiceStore = create((set) => ({
  activeService: 'dashboard',
  switchService: (id) => set({ activeService: id }),
}));
