import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
const SUB_TABS = [
  { label: 'Pantry', route: '/(app)/kitchen', icon: 'grid' },
  { label: 'Scan', route: '/(app)/kitchen/scan', icon: 'barcode' },
  { label: 'Expiry', route: '/(app)/kitchen/expiry', icon: 'time' },
  { label: 'Shopping', route: '/(app)/kitchen/shopping', icon: 'cart' },
];

const CATEGORIES = ['All', 'Dairy', 'Produce', 'Grains', 'Beverages', 'Snacks'];

const PANTRY = [
  { id: '1', name: 'Full Cream Milk', category: 'Dairy', expiry: '2026-05-14', qty: '2L', status: 'expiring', icon: 'water' },
  { id: '2', name: 'Greek Yoghurt', category: 'Dairy', expiry: '2026-05-13', qty: '500g', status: 'critical', icon: 'nutrition' },
  { id: '3', name: 'Spinach', category: 'Produce', expiry: '2026-05-15', qty: '200g', status: 'expiring', icon: 'leaf' },
  { id: '4', name: 'Basmati Rice', category: 'Grains', expiry: '2026-12-01', qty: '5kg', status: 'fresh', icon: 'restaurant' },
  { id: '5', name: 'Whole Wheat Bread', category: 'Grains', expiry: '2026-05-18', qty: '1 loaf', status: 'fresh', icon: 'restaurant' },
  { id: '6', name: 'Orange Juice', category: 'Beverages', expiry: '2026-05-20', qty: '1L', status: 'fresh', icon: 'water' },
  { id: '7', name: 'Almonds', category: 'Snacks', expiry: '2026-08-10', qty: '250g', status: 'fresh', icon: 'nutrition' },
  { id: '8', name: 'Dark Chocolate', category: 'Snacks', expiry: '2026-09-15', qty: '100g', status: 'fresh', icon: 'nutrition' },
];

const STATUS_COLOR = { fresh: '#4CAF82', expiring: '#FFB347', critical: '#FF6B6B' };

export default function KitchenScreen() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? PANTRY : PANTRY.filter(i => i.category === activeCategory);
  const expiringSoon = PANTRY.filter(i => i.status !== 'fresh').length;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {SUB_TABS.map(t => (
          <TouchableOpacity key={t.label} onPress={() => router.push(t.route)}
            style={[styles.tab, t.label === 'Pantry' && { borderBottomColor: '#FFB347', borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon} size={15} color={t.label === 'Pantry' ? '#FFB347' : colors.textSecondary} />
            <Text style={[styles.tabTxt, { color: t.label === 'Pantry' ? '#FFB347' : colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.h2, { color: colors.textPrimary }]}>Kitchen Pantry</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{PANTRY.length} items tracked</Text>
          </View>
          <TouchableOpacity style={[styles.scanBtn, { backgroundColor: '#FFB347' }]} onPress={() => router.push('/(app)/kitchen/scan')}>
            <Ionicons name="barcode" size={18} color="#fff" />
            <Text style={styles.scanBtnTxt}>Scan</Text>
          </TouchableOpacity>
        </View>

        {expiringSoon > 0 && (
          <TouchableOpacity onPress={() => router.push('/(app)/kitchen/expiry')}>
            <GlassCard style={styles.alertBanner}>
              <View style={[styles.alertIcon, { backgroundColor: '#FF6B6B22' }]}>
                <Ionicons name="warning" size={20} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>{expiringSoon} items expiring soon</Text>
                <Text style={[styles.alertSub, { color: colors.textSecondary }]}>Tap to view expiry tracker</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </GlassCard>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          {[
            { label: 'Fresh', count: PANTRY.filter(i => i.status === 'fresh').length, color: '#4CAF82' },
            { label: 'Expiring', count: PANTRY.filter(i => i.status === 'expiring').length, color: '#FFB347' },
            { label: 'Critical', count: PANTRY.filter(i => i.status === 'critical').length, color: '#FF6B6B' },
          ].map(s => (
            <GlassCard key={s.label} style={styles.statCard}>
              <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setActiveCategory(c)}
              style={[styles.catChip, { backgroundColor: activeCategory === c ? '#FFB347' : '#FFB34722' }]}>
              <Text style={[styles.catTxt, { color: activeCategory === c ? '#fff' : '#FFB347' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map(item => (
            <GlassCard key={item.id} style={styles.pantryRow}>
              <View style={[styles.pantryIcon, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                <Ionicons name={item.icon} size={18} color={STATUS_COLOR[item.status]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pantryName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.pantryMeta, { color: colors.textSecondary }]}>{item.qty} · Expires {item.expiry}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
            </GlassCard>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12 },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  h2: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  scanBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 14, gap: 12, marginBottom: 8 },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '600' },
  alertSub: { fontSize: 11, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  statCount: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  catTxt: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, gap: 8 },
  pantryRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  pantryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pantryName: { fontSize: 14, fontWeight: '600' },
  pantryMeta: { fontSize: 11, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
