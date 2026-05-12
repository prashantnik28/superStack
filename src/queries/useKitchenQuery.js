import { useQuery } from '@tanstack/react-query';

const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const now = new Date();

const PANTRY = [
  { id: '1', name: 'Milk', category: 'Dairy', qty: 2, unit: 'L', expiry: addDays(now, 3) },
  { id: '2', name: 'Apples', category: 'Fruits', qty: 6, unit: 'pcs', expiry: addDays(now, 10) },
  { id: '3', name: 'Bread', category: 'Grains', qty: 1, unit: 'loaf', expiry: addDays(now, 2) },
  { id: '4', name: 'Cheddar', category: 'Dairy', qty: 200, unit: 'g', expiry: addDays(now, 45) },
  { id: '5', name: 'Oats', category: 'Grains', qty: 500, unit: 'g', expiry: addDays(now, 120) },
  { id: '6', name: 'Orange Juice', category: 'Beverages', qty: 1, unit: 'L', expiry: addDays(now, 5) },
];

export function usePantryQuery(category) {
  return useQuery({
    queryKey: ['pantry', category],
    queryFn: async () => (!category || category === 'All') ? PANTRY : PANTRY.filter(i => i.category === category),
  });
}

export function useShoppingQuery() {
  return useQuery({
    queryKey: ['shopping'],
    queryFn: async () => [
      { id: '1', name: 'Milk', checked: false },
      { id: '2', name: 'Eggs', checked: false },
      { id: '3', name: 'Bread', checked: true },
    ],
  });
}
