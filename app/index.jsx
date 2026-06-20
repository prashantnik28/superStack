import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/useAuthStore';

export default function Index() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().then((authenticated) => {
      if (authenticated) {
        router.replace('/(app)/overview');
      } else {
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
