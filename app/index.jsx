import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';
import { useExpensesStore } from '../src/stores/useExpensesStore';
import { usePantryStore } from '../src/stores/usePantryStore';

export default function Index() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().then((authenticated) => {
      if (authenticated) {
        const user = useAuthStore.getState().user;
        useExpensesStore.getState().hydrateCurrency(user?.currency);
        // Load this user's pantry from the backend
        usePantryStore.getState().fetchItems();
        router.replace('/(app)/overview');
      } else {
        // Ensure no previous user's data leaks
        usePantryStore.getState().reset();
        router.replace('/(auth)/welcome');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F4FF' }}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}
