import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MAP = { done: '#4CAF82', pending: '#FFB347', 'in-progress': '#6C63FF', active: '#4CAF82', 'on-demand': '#6B7280' };

export default function StatusBadge({ label, status, color }) {
  const bg = color || MAP[status?.toLowerCase()] || '#6C63FF';
  return (
    <View style={[styles.badge, { backgroundColor: bg + '25' }]}>
      <View style={[styles.dot, { backgroundColor: bg }]} />
      <Text style={[styles.label, { color: bg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '600' },
});
