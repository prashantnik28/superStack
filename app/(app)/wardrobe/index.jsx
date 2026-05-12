import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import StatusBadge from '../../../src/components/ui/StatusBadge';

const SUB_TABS = [
  { label: 'Closet', route: '/(app)/wardrobe', icon: 'shirt' },
  { label: 'Add Item', route: '/(app)/wardrobe/add-item', icon: 'add-circle' },
  { label: 'Outfits', route: '/(app)/wardrobe/suggestions', icon: 'sparkles' },
];

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Dresses', 'Footwear', 'Accessories'];

const ITEMS = [
  { id: '1', name: 'White Linen Shirt', category: 'Tops', color: '#F5F5F5', border: '#ddd', wears: 3, clean: true },
  { id: '2', name: 'Navy Blazer', category: 'Tops', color: '#1A237E', wears: 1, clean: true },
  { id: '3', name: 'Black Jeans', category: 'Bottoms', color: '#212121', wears: 2, clean: false },
  { id: '4', name: 'Floral Midi Dress', category: 'Dresses', color: '#E91E63', wears: 0, clean: true },
  { id: '5', name: 'White Sneakers', category: 'Footwear', color: '#FAFAFA', border: '#ddd', wears: 5, clean: true },
  { id: '6', name: 'Gold Earrings', category: 'Accessories', color: '#FFD700', wears: 4, clean: true },
];

export default function WardrobeScreen() {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All' ? ITEMS : ITEMS.filter(i => i.category === activeCategory);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {SUB_TABS.map(t => (
          <TouchableOpacity key={t.label} onPress={() => router.push(t.route)}
            style={[styles.tab, t.label === 'Closet' && { borderBottomColor: '#6C63FF', borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon} size={15} color={t.label === 'Closet' ? '#6C63FF' : colors.textSecondary} />
            <Text style={[styles.tabTxt, { color: t.label === 'Closet' ? '#6C63FF' : colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.h2, { color: colors.textPrimary }]}>My Wardrobe</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{ITEMS.length} items synced</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#6C63FF' }]} onPress={() => router.push('/(app)/wardrobe/add-item')}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnTxt}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setActiveCategory(c)}
              style={[styles.catChip, { backgroundColor: activeCategory === c ? '#6C63FF' : '#6C63FF22' }]}>
              <Text style={[styles.catTxt, { color: activeCategory === c ? '#fff' : '#6C63FF' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {filtered.map(item => (
            <GlassCard key={item.id} style={styles.itemCard}>
              <View style={[styles.swatch, { backgroundColor: item.color, borderWidth: item.border ? 1 : 0, borderColor: item.border }]} />
              <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
              <Text style={[styles.itemCat, { color: colors.textSecondary }]}>{item.category}</Text>
              <View style={styles.itemMeta}>
                <StatusBadge label={item.clean ? 'Clean' : 'Laundry'} status={item.clean ? 'active' : 'pending'} />
                <Text style={[styles.wears, { color: colors.textSecondary }]}>{item.wears}x worn</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard style={styles.suggestBanner}>
          <View style={[styles.suggestIcon, { backgroundColor: '#6C63FF22' }]}>
            <Ionicons name="sparkles" size={24} color="#6C63FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.suggestTitle, { color: colors.textPrimary }]}>AI Outfit Suggestions</Text>
            <Text style={[styles.suggestSub, { color: colors.textSecondary }]}>Get personalized outfits for today</Text>
          </View>
          <TouchableOpacity style={[styles.suggestBtn, { backgroundColor: '#6C63FF' }]} onPress={() => router.push('/(app)/wardrobe/suggestions')}>
            <Text style={styles.suggestBtnTxt}>Try it</Text>
          </TouchableOpacity>
        </GlassCard>

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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  catTxt: { fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  itemCard: { width: '47%', padding: 12, gap: 8 },
  swatch: { width: '100%', height: 80, borderRadius: 12 },
  itemName: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  itemCat: { fontSize: 11 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wears: { fontSize: 10 },
  suggestBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 14, gap: 12 },
  suggestIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  suggestTitle: { fontSize: 14, fontWeight: '700' },
  suggestSub: { fontSize: 11, marginTop: 2 },
  suggestBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  suggestBtnTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
