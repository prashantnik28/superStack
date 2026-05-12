import { useQuery } from '@tanstack/react-query';

const ITEMS = [
  { id: '1', name: 'White Linen Shirt', category: 'Tops', color: '#FFFDE7', brand: 'H&M', season: 'Summer' },
  { id: '2', name: 'Navy Chinos', category: 'Bottoms', color: '#1A237E', brand: 'Uniqlo', season: 'All Season' },
  { id: '3', name: 'Running Sneakers', category: 'Shoes', color: '#E0E0E0', brand: 'Nike', season: 'All Season' },
  { id: '4', name: 'Floral Kurti', category: 'Tops', color: '#FCE4EC', brand: 'Fabindia', season: 'Summer' },
  { id: '5', name: 'Black Jeans', category: 'Bottoms', color: '#212121', brand: 'Levis', season: 'All Season' },
  { id: '6', name: 'Canvas Tote', category: 'Accessories', color: '#F5F5F5', brand: 'Local', season: 'All Season' },
];

export function useWardrobeQuery(category) {
  return useQuery({
    queryKey: ['wardrobe', category],
    queryFn: async () => (!category || category === 'All') ? ITEMS : ITEMS.filter(i => i.category === category),
  });
}
