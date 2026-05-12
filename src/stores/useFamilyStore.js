import { create } from 'zustand';

const DEFAULT_MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', status: 'school' },
  { id: '2', name: 'Myra', color: '#FF6B9D', status: 'activity' },
];

export const useFamilyStore = create((set) => ({
  members: DEFAULT_MEMBERS,
  setMembers: (members) => set({ members }),
}));
