import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '../src/context/ThemeContext';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60000 } } });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({ root: { flex: 1 } });
