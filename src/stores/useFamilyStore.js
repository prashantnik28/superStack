import { create } from 'zustand';

const DEFAULT_MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', status: 'At School', age: 9, image: require('../../assets/userchild2.png') },
  { id: '2', name: 'Myra', color: '#FF6B9D', status: 'Dance Class', age: 7, image: require('../../assets/userchild1.png') },
  { id: '3', name: 'Rajan', color: '#4CAF82', status: 'At Work', age: 38 },
];

export const useFamilyStore = create((set) => ({
  members: DEFAULT_MEMBERS,
  setMembers: (members) => set({ members }),
  addMember: (member) => set((s) => ({ members: [...s.members, member] })),
}));
