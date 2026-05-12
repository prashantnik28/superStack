import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import GlassCard from '../../../src/components/ui/GlassCard';
import StatusBadge from '../../../src/components/ui/StatusBadge';

const GLANCE = [
  { id: '1', label: 'School Drop', icon: 'bus', status: 'done' },
  { id: '2', label: 'Homework', icon: 'book', status: 'done' },
  { id: '3', label: 'Healthy Meal', icon: 'nutrition', status: 'done' },
  { id: '4', label: 'Bed Time', icon: 'moon', status: 'pending' },
  { id: '5', label: 'Family Time', icon: 'heart', status: 'in-progress' },
];

const SERVICES = [
  { id: 'c', name: 'Home Cleaning', icon: 'sparkles', color: '#6C63FF', status: 'Active', sub: 'Every Monday' },
  { id: 'm', name: 'Milk Delivery', icon: 'water', color: '#4CAF82', status: 'Active', sub: 'Daily' },
  { id: 'g', name: 'Grocery Delivery', icon: 'cart', color: '#FFB347', status: 'Active', sub: 'Every Wednesday' },
  { id: 'r', name: 'Home Repair', icon: 'construct', color: '#FF6B9D', status: 'On Demand', sub: 'On Demand' },
];

const UPDATES = [
  { id: '1', name: 'Aarav', color: '#6C63FF', activity: 'At School', place: 'St. Joseph School', time: 'Checked in 8:40 AM' },
  { id: '2', name: 'Myra', color: '#FF6B9D', activity: 'At Activity', place: 'Dance Class', time: 'Last seen 10:15 AM' },
];

export default function Dashboard() {
  const { colors } = useTheme();
  const { members } = useFamilyStore();
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.top}>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>{greet}, {user?.name || 'Priya'} 👋</Text>
          <Text style={[styles.subGreet, { color: colors.textSecondary }]}>Here's what's happening at home</Text>
        </View>
      </View>

      {/* Family Members */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Family Members</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersRow}>
        {members.map(m => (
          <View key={m.id} style={styles.memberWrap}>
            <View style={[styles.memberAvatar, { backgroundColor: m.color }]}>
              <Text style={styles.memberInitials}>{m.name.slice(0,2).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: m.status === 'home' ? '#4CAF82' : '#FFB347' }]} />
            <Text style={[styles.memberName, { color: colors.textSecondary }]}>{m.name}</Text>
          </View>
        ))}
        <View style={styles.memberWrap}>
          <TouchableOpacity style={[styles.memberAvatar, styles.addAvatar, { borderColor: colors.primary }]}>
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.memberName, { color: colors.textSecondary }]}>Add Child</Text>
        </View>
        <View style={styles.memberWrap}>
          <View style={[styles.memberAvatar, { backgroundColor: '#E8E8FF' }]}>
            <Ionicons name="home" size={22} color="#6C63FF" />
          </View>
          <Text style={[styles.memberName, { color: colors.textSecondary }]}>Home Sweet{'\n'}Home</Text>
        </View>
      </ScrollView>

      {/* Today at a Glance */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today at a Glance</Text>
        <TouchableOpacity><Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.glanceRow}>
        {GLANCE.map(item => (
          <GlassCard key={item.id} style={styles.glanceCard}>
            <View style={[styles.glanceIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.glanceLabel, { color: colors.textPrimary }]}>{item.label}</Text>
            <StatusBadge label={item.status === 'in-progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)} status={item.status} />
          </GlassCard>
        ))}
      </ScrollView>

      {/* Subscribed Services */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Subscribed Services</Text>
        <TouchableOpacity><Text style={[styles.viewAll, { color: colors.primary }]}>Manage</Text></TouchableOpacity>
      </View>
      <View style={styles.svcGrid}>
        {SERVICES.map(s => (
          <GlassCard key={s.id} style={styles.svcCard}>
            <View style={[styles.svcIcon, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={[styles.svcName, { color: colors.textPrimary }]}>{s.name}</Text>
            <StatusBadge label={s.status} status={s.status === 'On Demand' ? 'on-demand' : 'active'} />
            <Text style={[styles.svcSub, { color: colors.textSecondary }]}>{s.sub}</Text>
          </GlassCard>
        ))}
      </View>

      {/* Safety Banner */}
      <GlassCard style={styles.safetyCard}>
        <View style={[styles.safetyIcon, { backgroundColor: '#4CAF8222' }]}>
          <Ionicons name="shield-checkmark" size={28} color="#4CAF82" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>Your Home is Safe ✓</Text>
          <Text style={[styles.safetySub, { color: colors.textSecondary }]}>All systems are working fine.</Text>
        </View>
        <TouchableOpacity style={[styles.safetyBtn, { backgroundColor: '#4CAF82' }]} onPress={() => router.push('/(app)/wellbeing')}>
          <Text style={styles.safetyBtnTxt}>View Home</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Children Updates */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Children Updates</Text>
        <TouchableOpacity><Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text></TouchableOpacity>
      </View>
      <GlassCard style={styles.updatesCard}>
        {UPDATES.map((u, i) => (
          <View key={u.id}>
            <View style={styles.updateRow}>
              <View style={[styles.updateAvatar, { backgroundColor: u.color }]}>
                <Text style={styles.updateInitials}>{u.name.slice(0,2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.updateNameRow}>
                  <Text style={[styles.updateName, { color: colors.textPrimary }]}>{u.name}</Text>
                  <View style={[styles.activityChip, { backgroundColor: u.color + '22' }]}>
                    <Text style={[styles.activityChipTxt, { color: u.color }]}>{u.activity}</Text>
                  </View>
                </View>
                <Text style={[styles.updatePlace, { color: colors.textSecondary }]}>{u.place}</Text>
                <Text style={[styles.updateTime, { color: colors.textSecondary }]}>{u.time}</Text>
              </View>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            {i < UPDATES.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </GlassCard>

      {/* Quick Service Links */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Services</Text>
      {[
        { name: 'Well-being', icon: 'heart', color: '#FF6B9D', sub: '2 members tracked', route: '/(app)/wellbeing' },
        { name: 'Wardrobe', icon: 'shirt', color: '#6C63FF', sub: '6 items synced', route: '/(app)/wardrobe' },
        { name: 'Kitchen', icon: 'restaurant', color: '#FFB347', sub: '3 items expiring soon', route: '/(app)/kitchen' },
      ].map(s => (
        <TouchableOpacity key={s.name} onPress={() => router.push(s.route)} activeOpacity={0.85}>
          <GlassCard style={styles.serviceRow}>
            <View style={[styles.svcIcon2, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.svcName2, { color: colors.textPrimary }]}>{s.name}</Text>
              <Text style={[styles.svcSub2, { color: colors.textSecondary }]}>{s.sub}</Text>
            </View>
            <StatusBadge label="Active" status="active" />
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </GlassCard>
        </TouchableOpacity>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  top: { marginBottom: 6 },
  greeting: { fontSize: 22, fontWeight: '800' },
  subGreet: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  membersRow: { gap: 16, paddingBottom: 4 },
  memberWrap: { alignItems: 'center', gap: 4, width: 60 },
  memberAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  addAvatar: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed' },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5, position: 'absolute', bottom: 0, right: 0, borderWidth: 2, borderColor: '#fff' },
  memberName: { fontSize: 10, textAlign: 'center' },
  glanceRow: { gap: 10, paddingBottom: 4 },
  glanceCard: { width: 110, padding: 12, alignItems: 'center', gap: 8 },
  glanceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  glanceLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  svcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  svcCard: { width: '47%', padding: 14, gap: 6 },
  svcIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  svcName: { fontSize: 13, fontWeight: '600' },
  svcSub: { fontSize: 10 },
  safetyCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  safetyIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  safetyTitle: { fontSize: 14, fontWeight: '700' },
  safetySub: { fontSize: 11, marginTop: 2 },
  safetyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  safetyBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  updatesCard: { padding: 14, gap: 12 },
  updateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  updateAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  updateInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },
  updateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  updateName: { fontSize: 14, fontWeight: '600' },
  activityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  activityChipTxt: { fontSize: 10, fontWeight: '600' },
  updatePlace: { fontSize: 12 },
  updateTime: { fontSize: 10, marginTop: 1 },
  divider: { height: 0.5, marginVertical: 10 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, marginBottom: 4 },
  svcIcon2: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcName2: { fontSize: 14, fontWeight: '600' },
  svcSub2: { fontSize: 11, marginTop: 1 },
});
