import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';


const OUTFITS = [
  {
    id: '1',
    occasion: 'Office Ready',
    items: ['Navy Blazer', 'White Linen Shirt', 'Black Jeans', 'White Sneakers'],
    colors: ['#1A237E', '#F5F5F5', '#212121', '#FAFAFA'],
    weather: '28°C ☀️',
    liked: false,
  },
  {
    id: '2',
    occasion: 'Casual Weekend',
    items: ['Floral Midi Dress', 'White Sneakers', 'Gold Earrings'],
    colors: ['#E91E63', '#FAFAFA', '#FFD700'],
    weather: '26°C 🌤️',
    liked: true,
  },
  {
    id: '3',
    occasion: 'Evening Out',
    items: ['Navy Blazer', 'Floral Midi Dress', 'Gold Earrings'],
    colors: ['#1A237E', '#E91E63', '#FFD700'],
    weather: '22°C 🌙',
    liked: false,
  },
];

export default function SuggestionsScreen() {
  const { colors } = useTheme();
  const [outfits, setOutfits] = useState(OUTFITS);

  const toggleLike = (id) => {
    setOutfits(prev => prev.map(o => o.id === id ? { ...o, liked: !o.liked } : o));
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.h2, { color: colors.textPrimary }]}>AI Outfit Picks</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>Curated for today's weather</Text>
          </View>
          <View style={[styles.aiBadge, { backgroundColor: '#6C63FF22' }]}>
            <Ionicons name="sparkles" size={14} color="#6C63FF" />
            <Text style={[styles.aiBadgeTxt, { color: '#6C63FF' }]}>AI</Text>
          </View>
        </View>

        {outfits.map(outfit => (
          <GlassCard key={outfit.id} style={styles.outfitCard}>
            <View style={styles.outfitHeader}>
              <Text style={[styles.outfitOccasion, { color: colors.textPrimary }]}>{outfit.occasion}</Text>
              <TouchableOpacity onPress={() => toggleLike(outfit.id)}>
                <Ionicons name={outfit.liked ? 'heart' : 'heart-outline'} size={22} color={outfit.liked ? '#FF6B9D' : colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.swatchRow}>
              {outfit.colors.map((c, i) => (
                <View key={i} style={[styles.outfitSwatch, { backgroundColor: c, borderWidth: c === '#F5F5F5' || c === '#FAFAFA' ? 1 : 0, borderColor: '#ddd' }]} />
              ))}
            </View>
            <View style={styles.itemsList}>
              {outfit.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={[styles.itemDot, { backgroundColor: outfit.colors[i] || '#6C63FF', borderWidth: (outfit.colors[i] === '#F5F5F5' || outfit.colors[i] === '#FAFAFA') ? 1 : 0, borderColor: '#ddd' }]} />
                  <Text style={[styles.itemTxt, { color: colors.textPrimary }]}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.outfitFooter}>
              <View style={[styles.weatherChip, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.weatherTxt, { color: colors.textSecondary }]}>{outfit.weather}</Text>
              </View>
              <TouchableOpacity style={[styles.wearBtn, { backgroundColor: '#6C63FF' }]}>
                <Text style={styles.wearBtnTxt}>Wear Today</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  aiBadgeTxt: { fontSize: 12, fontWeight: '700' },
  outfitCard: { padding: 16, gap: 12 },
  outfitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  outfitOccasion: { fontSize: 16, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', gap: 8 },
  outfitSwatch: { width: 40, height: 40, borderRadius: 10 },
  itemsList: { gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 10, height: 10, borderRadius: 5 },
  itemTxt: { fontSize: 13 },
  outfitFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  weatherTxt: { fontSize: 12 },
  wearBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  wearBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
