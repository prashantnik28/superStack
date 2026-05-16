import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import PulseButton from '../../../src/components/ui/PulseButton';

const MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', place: 'St. Joseph School', time: '8:40 AM', battery: 78 },
  { id: '2', name: 'Myra', color: '#FF6B9D', place: 'Dance Studio', time: '10:15 AM', battery: 92 },
];

export default function WellbeingOverview() {
  const { colors } = useTheme();
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h2, { color: colors.textPrimary }]}>Well-being</Text>
        <GlassCard style={styles.mapCard}>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="map" size={40} color={colors.primary} />
            <Text style={[styles.mapTxt, { color: colors.textSecondary }]}>Tap Map tab for live tracking</Text>
          </View>
          <View style={styles.mapMembers}>
            {MEMBERS.map(m => (
              <View key={m.id} style={styles.mapMember}>
                <View style={[styles.mapDot, { backgroundColor: m.color }]} />
                <Text style={[styles.mapName, { color: colors.textPrimary }]}>{m.name}</Text>
                <Text style={[styles.mapPlace, { color: colors.textSecondary }]}>{m.place}</Text>
                <Text style={[styles.mapTime, { color: colors.textSecondary }]}>{m.time}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Family Status</Text>
        {MEMBERS.map(m => (
          <GlassCard key={m.id} style={styles.memberCard}>
            <View style={[styles.memberAvatar, { backgroundColor: m.color }]}><Text style={styles.memberInitials}>{m.name.slice(0,2).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberName, { color: colors.textPrimary }]}>{m.name}</Text>
              <Text style={[styles.memberPlace, { color: colors.textSecondary }]}>{m.place}</Text>
              <Text style={[styles.memberTime, { color: colors.textSecondary }]}>Last seen {m.time}</Text>
            </View>
            <View style={[styles.batteryBadge, { backgroundColor: m.battery > 50 ? '#4CAF8222' : '#FFB34722' }]}>
              <Ionicons name="battery-half" size={12} color={m.battery > 50 ? '#4CAF82' : '#FFB347'} />
              <Text style={[styles.batteryTxt, { color: m.battery > 50 ? '#4CAF82' : '#FFB347' }]}>{m.battery}%</Text>
            </View>
          </GlassCard>
        ))}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency</Text>
        <View style={styles.sosWrap}>
          <PulseButton onPress={() => router.push('/(app)/wellbeing/sos')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14 },
  h2: { fontSize: 22, fontWeight: '700' },
  mapCard: { overflow: 'hidden' },
  mapPlaceholder: { height: 130, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapTxt: { fontSize: 12 },
  mapMembers: { padding: 12, gap: 8 },
  mapMember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapDot: { width: 8, height: 8, borderRadius: 4 },
  mapName: { fontSize: 13, fontWeight: '600', flex: 1 },
  mapPlace: { fontSize: 11, flex: 2 },
  mapTime: { fontSize: 11 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 8 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberPlace: { fontSize: 12, marginTop: 1 },
  memberTime: { fontSize: 11, marginTop: 1 },
  batteryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  batteryTxt: { fontSize: 11, fontWeight: '600' },
  sosWrap: { alignItems: 'center', paddingVertical: 20 },
});
