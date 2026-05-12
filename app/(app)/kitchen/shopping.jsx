import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
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

const INITIAL_ITEMS = [
  { id: '1', name: 'Greek Yoghurt', qty: '500g', category: 'Dairy', done: false },
  { id: '2', name: 'Spinach', qty: '200g', category: 'Produce', done: false },
  { id: '3', name: 'Eggs (dozen)', qty: '12', category: 'Dairy', done: false },
  { id: '4', name: 'Olive Oil', qty: '1 bottle', category: 'Pantry', done: true },
  { id: '5', name: 'Tomatoes', qty: '500g', category: 'Produce', done: false },
];

export default function ShoppingScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [newItem, setNewItem] = useState('');

  const toggleItem = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: Date.now().toString(), name: newItem.trim(), qty: '', category: 'Other', done: false }]);
    setNewItem('');
  };

  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {SUB_TABS.map(t => (
          <TouchableOpacity key={t.label} onPress={() => router.push(t.route)}
            style={[styles.tab, t.label === 'Shopping' && { borderBottomColor: '#FFB347', borderBottomWidth: 2 }]}>
            <Ionicons name={t.icon} size={15} color={t.label === 'Shopping' ? '#FFB347' : colors.textSecondary} />
            <Text style={[styles.tabTxt, { color: t.label === 'Shopping' ? '#FFB347' : colors.textSecondary }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Text style={[styles.h2, { color: colors.textPrimary }]}>Shopping List</Text>
          <View style={[styles.badge, { backgroundColor: '#FFB34722' }]}>
            <Text style={[styles.badgeTxt, { color: '#FFB347' }]}>{pending.length} left</Text>
          </View>
        </View>

        <GlassCard style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { color: colors.textPrimary }]}
            placeholder="Add item..."
            placeholderTextColor={colors.textSecondary}
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#FFB347' }]} onPress={addItem}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </GlassCard>

        {pending.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>To Buy</Text>
            {pending.map(item => (
              <TouchableOpacity key={item.id} onPress={() => toggleItem(item.id)}>
                <GlassCard style={styles.shopRow}>
                  <View style={[styles.checkbox, { borderColor: '#FFB347' }]}>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    {!!item.qty && <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{item.qty} · {item.category}</Text>}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Done ({done.length})</Text>
            {done.map(item => (
              <TouchableOpacity key={item.id} onPress={() => toggleItem(item.id)}>
                <GlassCard style={[styles.shopRow, { opacity: 0.6 }]}>
                  <View style={[styles.checkbox, styles.checkboxDone, { backgroundColor: '#4CAF82', borderColor: '#4CAF82' }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                  <Text style={[styles.itemName, { color: colors.textSecondary, textDecorationLine: 'line-through' }]}>{item.name}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.1)' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 12 },
  tabTxt: { fontSize: 13, fontWeight: '600' },
  content: { padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h2: { fontSize: 22, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeTxt: { fontSize: 12, fontWeight: '700' },
  addRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 6, paddingHorizontal: 4 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  shopRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: {},
  itemName: { fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 11, marginTop: 2 },
});
