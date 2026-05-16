import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../src/components/ui/GlassCard';
import { useTheme } from '../../../src/context/ThemeContext';

const MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', place: 'St. Joseph School', time: '8:40 AM' },
  { id: '2', name: 'Myra', color: '#FF6B9D', place: 'Dance Studio', time: '10:15 AM' },
];

export default function TrackingScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container]}>
      <View style={[styles.mapArea, { backgroundColor: colors.primary + '10' }]}>
        <Ionicons name="map" size={56} color={colors.primary} />
        <Text style={[styles.mapTitle, { color: colors.textPrimary }]}>Live GPS Map</Text>
        <Text style={[styles.mapSub, { color: colors.textSecondary }]}>React Native Maps integration ready for device</Text>
      </View>
      <GlassCard style={styles.sheet}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Live Locations</Text>
        {MEMBERS.map(m => (
          <View key={m.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: m.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{m.name}</Text>
              <Text style={[styles.place, { color: colors.textSecondary }]}>{m.place}</Text>
            </View>
            <Text style={[styles.time, { color: colors.textSecondary }]}>{m.time}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mapTitle: { fontSize: 18, fontWeight: '700' },
  mapSub: { fontSize: 12, textAlign: 'center', paddingHorizontal: 32 },
  sheet: { margin: 16, padding: 20, gap: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 14, fontWeight: '600' },
  place: { fontSize: 12 },
  time: { fontSize: 12 },
});
