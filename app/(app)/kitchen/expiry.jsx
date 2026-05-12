import React from 'react';
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

const EXPIRY_ITEMS = [
  { id: '1', name: 'Greek Yoghurt', daysLeft: 1, qty: '500g', category: 'Dairy', status: 'critical' },
  { id: '2', name: 'Full Cream Milk', daysLeft: 2, qty: '2L', category: 'Dairy', status: 'expiring' },
  { id: '3', name: 'Spinach', daysLeft: 3, qty: '200g', category: 'Produce', status: 'expiring' },
  { id: '4', name: 'Whole Wheat Bread', daysLeft: 6, qty: '1 loaf', category: 'Grains', status: 'fresh' },
  { id: '5', name: 'Orange Juice', daysLeft: 8, qty: '1L', category: 'Beverages', status: 'fresh' },
];

const STATUS_CONFIG = {
  critical: { color: '#FF6B6B', bg: '#FF6B6B22', label: 'Critical' },
  expiring: { color: '#FFB347', bg: '#FFB34722', label: 'Expiring Soon' },
  fresh: { color: '#4CAF82', bg: '#4CAF8222', label: 'Fresh' },
};

export default function ExpiryScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {SUB_TABS.map(t => (
          <TouchableOpacity key={t.label} onPress={() => router.push(t.route)}
            style={[styles.tab, t.label === 'Expiry' && { borderBottomColor: '#FFB347', borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon} size={15} color={t.label === 'Expiry' ? '#FFB347' : colors.textSecondary} />
            <Text style={[styles.tabTxt, { color: t.label === 'Expiry' ? '#FFB347' : colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h2, { color: colors.textPrimary }]}>Expiry Tracker</Text>

        {['critical', 'expiring', 'fresh'].map(status => {
          const items = EXPIRY_ITEMS.filter(i => i.status === status);
          if (!items.length) return null;
          const cfg = STATUS_CONFIG[status];
          return (
            <View key={status}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{cfg.label}</Text>
                <View style={[styles.countChip, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.countTxt, { color: cfg.color }]}>{items.length}</Text>
                </View>
              </View>
              {items.map(item => (
                <GlassCard key={item.id} style={styles.expiryRow}>
                  <View style={[styles.expiryDays, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.expiryDaysNum, { color: cfg.color }]}>{item.daysLeft}</Text>
                    <Text style={[styles.expiryDaysLabel, { color: cfg.color }]}>days</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>{item.qty} · {item.category}</Text>
                  </View>
                  <TouchableOpacity style={[styles.addShopBtn, { borderColor: cfg.color }]}>
                    <Ionicons name="cart-outline" size={14} color={cfg.color} />
                    <Text style={[styles.addShopTxt, { color: cfg.color }]}>Add to list</Text>
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12 },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 14 },
  h2: { fontSize: 22, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  countChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  countTxt: { fontSize: 11, fontWeight: '700' },
  expiryRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, marginBottom: 8 },
  expiryDays: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expiryDaysNum: { fontSize: 20, fontWeight: '800' },
  expiryDaysLabel: { fontSize: 9, fontWeight: '600' },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemMeta: { fontSize: 11, marginTop: 2 },
  addShopBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  addShopTxt: { fontSize: 11, fontWeight: '600' },
});
