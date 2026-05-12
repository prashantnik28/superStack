import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Footwear', 'Accessories', 'Outerwear'];
const COLORS_LIST = ['#F5F5F5', '#212121', '#1A237E', '#E91E63', '#4CAF50', '#FF9800', '#9C27B0', '#795548'];

export default function AddItemScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleSave = () => {
    router.back();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Add Clothing Item</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.photoCard}>
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="camera" size={36} color={colors.primary} />
            <Text style={[styles.photoTxt, { color: colors.textSecondary }]}>Take photo or upload</Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.formCard}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Item Name</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="e.g. White Linen Shirt"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} onPress={() => setCategory(c)}
                style={[styles.catChip, { backgroundColor: category === c ? '#6C63FF' : '#6C63FF22' }]}>
                <Text style={[styles.catTxt, { color: category === c ? '#fff' : '#6C63FF' }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS_LIST.map(c => (
              <TouchableOpacity key={c} onPress={() => setSelectedColor(c)}
                style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 1, borderColor: selectedColor === c ? '#6C63FF' : '#ddd' }]} />
            ))}
          </View>
        </GlassCard>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#6C63FF' }]} onPress={handleSave}>
          <Text style={styles.saveBtnTxt}>Save to Wardrobe</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  photoCard: { overflow: 'hidden' },
  photoPlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoTxt: { fontSize: 13 },
  formCard: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  catTxt: { fontSize: 12, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
