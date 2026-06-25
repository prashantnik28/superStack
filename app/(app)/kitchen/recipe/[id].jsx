import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../../src/context/ThemeContext';
import GlassCard from '../../../../src/components/ui/GlassCard';
import { MEALS_DATA } from '../../../../src/data/mealsData';

const ACCENT   = '#6C63FF';
const ACCENT2  = '#5851E6';
const ACCENT3  = '#A78BFA';
const OK       = '#10B981';
const WARN     = '#F59E0B';
const CRITICAL = '#EF4444';

const PANTRY_MOCK = ['Baby Spinach', 'Cherry Tomatoes', 'Basmati Rice', 'Soy Sauce', 'Frozen Peas', 'Orange Juice', 'Almonds', 'Dark Chocolate', 'Full Cream Milk', 'Greek Yoghurt'];

export default function RecipeDetail() {
  const { id }                = useLocalSearchParams();
  const { colors, isDark }    = useTheme();
  const insets                = useSafeAreaInsets();
  const [step,    setStep]    = useState(null);
  const [cooking, setCooking] = useState(false);
  const [done,    setDone]    = useState(new Set());

  const recipe = MEALS_DATA.find(m => m.id === id);
  if (!recipe) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Recipe not found.</Text>
    </View>
  );

  const pantrySet = new Set(PANTRY_MOCK);
  const owned     = recipe.uses.filter(u => pantrySet.has(u)).length;
  const coverage  = recipe.uses.length === 0 ? 100 : Math.round((owned / recipe.uses.length) * 100);
  const ready     = coverage === 100;

  const toggleDone = (i) => {
    setDone(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  const macros = [
    { label: 'Protein', val: `${recipe.protein}g`, color: '#3B82F6' },
    { label: 'Carbs',   val: `${recipe.carbs}g`,  color: WARN },
    { label: 'Fat',     val: `${recipe.fat}g`,    color: '#EC4899' },
    { label: 'Calories',val: `${recipe.cal}`,     color: ACCENT },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0818' : '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={S.hero}>
          {Platform.OS === 'ios' && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={['rgba(88,70,230,0.95)', 'rgba(26,10,80,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={S.bubble1} /><View style={S.bubble2} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)' }} />

          <View style={{ alignItems: 'center', paddingTop: insets.top + 60, paddingBottom: 24, paddingHorizontal: 20 }}>
            <View style={S.heroEmojiCircle}>
              <Text style={{ fontSize: 64 }}>{recipe.emoji}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {recipe.tags.map(t => (
                <View key={t} style={S.tagChip}><Text style={S.tagTxt}>{t}</Text></View>
              ))}
            </View>
            <Text style={S.heroName}>{recipe.name}</Text>
            <Text style={S.heroCategory}>{recipe.category}</Text>

            {/* Quick stats */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { icon: 'time-outline',    label: `${recipe.time} min` },
                { icon: 'people-outline',  label: `${recipe.servings} servings` },
                { icon: 'star-outline',    label: recipe.diff },
              ].map(c => (
                <View key={c.label} style={S.statChip}>
                  <Ionicons name={c.icon} size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={S.statTxt}>{c.label}</Text>
                </View>
              ))}
            </View>

            {/* Coverage */}
            {recipe.uses.length > 0 && (
              <View style={{ width: '100%', marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>PANTRY COVERAGE</Text>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: ready ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>{coverage}%</Text>
                </View>
                <View style={S.coverTrack}>
                  <View style={[S.coverFill, { width: `${coverage}%`, backgroundColor: ready ? OK : ACCENT3 }]} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Macros ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <GlassCard style={S.macroCard}>
            {macros.map((m, i) => (
              <View key={m.label} style={[S.macroItem, i < macros.length - 1 && { borderRightWidth: 1, borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                <Text style={[S.macroVal, { color: m.color }]}>{m.val}</Text>
                <Text style={[S.macroLabel, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{m.label}</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ── Ingredients ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Ingredients</Text>
              <Text style={[S.sectionSub, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{recipe.servings} servings · {recipe.ingredients.length} items</Text>
            </View>
            <View style={[S.coveragePill, { backgroundColor: ACCENT + '15' }]}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: ACCENT }}>{coverage}%</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: ACCENT, opacity: 0.7 }}> match</Text>
            </View>
          </View>

          {/* Have section */}
          {recipe.ingredients.filter(ing => pantrySet.has(ing.name)).length > 0 && (
            <>
              <View style={S.ingGroupHdr}>
                <View style={[S.ingGroupDot, { backgroundColor: OK }]} />
                <Text style={[S.ingGroupLabel, { color: OK }]}>In Your Pantry</Text>
                <View style={S.ingGroupLine} />
                <Text style={[S.ingGroupCount, { color: OK }]}>{recipe.ingredients.filter(i => pantrySet.has(i.name)).length}</Text>
              </View>
              <View style={{ gap: 6, marginBottom: 14 }}>
                {recipe.ingredients.filter(ing => pantrySet.has(ing.name)).map((ing, i) => (
                  <GlassCard key={i} style={[S.ingRow, { borderWidth: 1, borderColor: OK + '25' }]}>
                    <View style={[S.ingCheck, { backgroundColor: OK + '18' }]}>
                      <Ionicons name="checkmark-circle" size={18} color={OK} />
                    </View>
                    <Text style={[S.ingName, { color: colors.textPrimary }]}>{ing.name}</Text>
                    <View style={[S.ingQtyPill, { backgroundColor: OK + '15' }]}>
                      <Text style={[S.ingQty, { color: OK }]}>{ing.qty}</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </>
          )}

          {/* Need section */}
          {recipe.ingredients.filter(ing => !pantrySet.has(ing.name)).length > 0 && (
            <>
              <View style={S.ingGroupHdr}>
                <View style={[S.ingGroupDot, { backgroundColor: WARN }]} />
                <Text style={[S.ingGroupLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Need to Buy</Text>
                <View style={S.ingGroupLine} />
                <Text style={[S.ingGroupCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{recipe.ingredients.filter(i => !pantrySet.has(i.name)).length}</Text>
              </View>
              <View style={{ gap: 6 }}>
                {recipe.ingredients.filter(ing => !pantrySet.has(ing.name)).map((ing, i) => (
                  <GlassCard key={i} style={S.ingRow}>
                    <View style={[S.ingCheck, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F3FF' }]}>
                      <Ionicons name="cart-outline" size={17} color={isDark ? '#4B5563' : '#C4B5FD'} />
                    </View>
                    <Text style={[S.ingName, { color: colors.textPrimary }]}>{ing.name}</Text>
                    <View style={[S.ingQtyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                      <Text style={[S.ingQty, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{ing.qty}</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Steps ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Instructions</Text>
              <Text style={[S.sectionSub, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{recipe.steps.length} steps · {recipe.time} min</Text>
            </View>
            <View style={[S.coveragePill, { backgroundColor: done.size > 0 ? OK + '18' : ACCENT + '12' }]}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: done.size > 0 ? OK : ACCENT }}>{done.size}/{recipe.steps.length}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: done.size > 0 ? OK : ACCENT, opacity: 0.7 }}> done</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[S.stepProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EDE9FE', marginBottom: 14 }]}>
            <View style={[S.stepProgressFill, { width: `${(done.size / recipe.steps.length) * 100}%`, backgroundColor: done.size === recipe.steps.length ? OK : ACCENT }]} />
          </View>

          <View style={{ gap: 10 }}>
            {recipe.steps.map((s, i) => {
              const isDone   = done.has(i);
              const isCurrent = !isDone && i === [...Array(recipe.steps.length).keys()].find(k => !done.has(k));
              return (
                <TouchableOpacity key={i} onPress={() => toggleDone(i)} activeOpacity={0.8}>
                  <GlassCard style={[S.stepCard, {
                    borderWidth: isCurrent ? 1.5 : 0,
                    borderColor: isCurrent ? ACCENT + '60' : 'transparent',
                    opacity: isDone ? 0.5 : 1,
                  }]}>
                    <View style={[S.stepNum, { backgroundColor: isDone ? OK : (isCurrent ? ACCENT : (isDark ? 'rgba(108,99,255,0.2)' : '#EDE9FE')) }]}>
                      {isDone
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <Text style={{ fontSize: 12, fontWeight: '900', color: isCurrent ? '#fff' : (isDark ? '#6B7280' : '#7C3AED') }}>{i + 1}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      {isCurrent && <Text style={{ fontSize: 8, fontWeight: '800', color: ACCENT, letterSpacing: 0.8, marginBottom: 3 }}>CURRENT STEP</Text>}
                      <Text style={[S.stepTxt, { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]}>{s}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={[S.cta, { paddingBottom: insets.bottom + 16, backgroundColor: isDark ? '#0A0818' : '#F8F7FF' }]}>
        <TouchableOpacity onPress={() => router.push('/(app)/kitchen/meal-plan')} activeOpacity={0.85}
          style={[S.ctaSecondary, { borderColor: isDark ? 'rgba(108,99,255,0.3)' : '#DDD9FF' }]}>
          <Ionicons name="calendar-outline" size={16} color={ACCENT} />
          <Text style={{ fontSize: 13, fontWeight: '800', color: ACCENT }}>Add to Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCooking(!cooking)} activeOpacity={0.85}
          style={[S.ctaPrimary, { backgroundColor: ready ? OK : ACCENT, flex: 1 }]}>
          <Ionicons name="restaurant" size={16} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>{ready ? 'Start Cooking' : 'Save Recipe'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  hero:           { overflow: 'hidden' },
  bubble1:        { position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' },
  bubble2:        { position: 'absolute', bottom: -20, left: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(167,139,250,0.08)' },
  heroEmojiCircle:{ width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  tagChip:        { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt:         { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroName:       { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 10, textAlign: 'center', letterSpacing: -0.3 },
  heroCategory:   { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontWeight: '600' },
  statChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  statTxt:        { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  coverTrack:     { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  coverFill:      { height: '100%', borderRadius: 2 },
  // Macros
  macroCard:      { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  macroItem:      { flex: 1, alignItems: 'center', paddingVertical: 14 },
  macroVal:       { fontSize: 16, fontWeight: '900' },
  macroLabel:     { fontSize: 9, fontWeight: '700', marginTop: 2, letterSpacing: 0.3 },
  // Sections
  sectionTitle:   { fontSize: 16, fontWeight: '900' },
  sectionSub:     { fontSize: 11, marginTop: 2 },
  coveragePill:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  // Ingredients
  ingGroupHdr:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ingGroupDot:    { width: 6, height: 6, borderRadius: 3 },
  ingGroupLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ingGroupLine:   { flex: 1, height: 1, backgroundColor: 'rgba(108,99,255,0.1)' },
  ingGroupCount:  { fontSize: 10, fontWeight: '800' },
  ingRow:         { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 11 },
  ingCheck:       { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  ingName:        { fontSize: 13, fontWeight: '600', flex: 1 },
  ingQtyPill:     { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  ingQty:         { fontSize: 11, fontWeight: '700' },
  // Steps
  stepProgressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  stepProgressFill:  { height: '100%', borderRadius: 2 },
  stepCard:       { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  stepNum:        { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepTxt:        { fontSize: 13, lineHeight: 20, flex: 1 },
  // CTA bar
  cta:            { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(108,99,255,0.15)' },
  ctaSecondary:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, borderWidth: 1.5 },
  ctaPrimary:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 13 },
});
