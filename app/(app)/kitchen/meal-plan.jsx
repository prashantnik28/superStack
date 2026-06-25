import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import { MEALS_DATA } from '../../../src/data/mealsData';

const ACCENT   = '#6C63FF';
const ACCENT2  = '#5851E6';
const OK       = '#10B981';
const WARN     = '#F59E0B';

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS  = ['Breakfast', 'Lunch', 'Dinner'];
const MEAL_ICON = { Breakfast: 'sunny-outline', Lunch: 'partly-sunny-outline', Dinner: 'moon-outline' };

export default function MealPlan() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [plan, setPlan]         = useState({});
  const [picker, setPicker]     = useState(null); // { day, meal }
  const [activeDay, setActiveDay] = useState(0);

  const assign = (recipeId) => {
    if (!picker) return;
    setPlan(p => ({ ...p, [`${picker.day}_${picker.meal}`]: recipeId }));
    setPicker(null);
  };
  const remove = (day, meal) => setPlan(p => { const n = { ...p }; delete n[`${day}_${meal}`]; return n; });

  const totalPlanned = Object.keys(plan).length;
  const totalCal = Object.values(plan).reduce((sum, id) => {
    const r = MEALS_DATA.find(m => m.id === id);
    return sum + (r?.cal || 0);
  }, 0);

  const todayIdx = Math.max(0, Math.min(6, new Date().getDay() - 1));

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0818' : '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={[P.hero, { paddingTop: 16 }]}>
          {Platform.OS === 'ios' && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={['rgba(88,70,230,0.92)', 'rgba(26,10,80,0.97)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={P.heroEyebrow}>THIS WEEK'S PLAN</Text>
              <Text style={P.heroTitle}>Meal Planner</Text>
              <Text style={P.heroSub}>{totalPlanned}/21 slots filled</Text>
            </View>
            <View style={P.heroStats}>
              <Text style={P.heroStatN}>{totalCal}</Text>
              <Text style={P.heroStatL}>cal/week</Text>
            </View>
            <View style={P.heroStats}>
              <Text style={P.heroStatN}>{totalPlanned}</Text>
              <Text style={P.heroStatL}>planned</Text>
            </View>
          </View>

          {/* Day tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 14 }}>
            {DAYS.map((d, i) => {
              const isActive = activeDay === i;
              const isToday  = todayIdx === i;
              const dayMeals = MEALS.filter(m => plan[`${d}_${m}`]).length;
              return (
                <TouchableOpacity key={d} onPress={() => setActiveDay(i)} activeOpacity={0.8}
                  style={[P.dayTab, { backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)', borderColor: isToday ? 'rgba(255,215,0,0.6)' : 'transparent', borderWidth: isToday ? 1.5 : 0 }]}>
                  <Text style={[P.dayTabLabel, { color: isToday ? '#FFD700' : 'rgba(255,255,255,0.6)', fontWeight: isActive ? '800' : '600' }]}>{d}</Text>
                  <Text style={{ fontSize: isActive ? 18 : 14, color: '#fff', fontWeight: '900' }}>{dayMeals}</Text>
                  <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>meals</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Day Planner ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 16, gap: 10 }}>
          <Text style={[P.dayHeading, { color: colors.textPrimary }]}>{DAYS[activeDay]}{todayIdx === activeDay ? ' · Today' : ''}</Text>

          {MEALS.map(meal => {
            const key    = `${DAYS[activeDay]}_${meal}`;
            const rId    = plan[key];
            const recipe = MEALS_DATA.find(m => m.id === rId);
            return (
              <GlassCard key={meal} style={P.mealSlot}>
                <View style={[P.mealIconBox, { backgroundColor: ACCENT + '15' }]}>
                  <Ionicons name={MEAL_ICON[meal]} size={16} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[P.mealType, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{meal}</Text>
                  {recipe ? (
                    <View>
                      <Text style={[P.mealName, { color: colors.textPrimary }]}>{recipe.emoji} {recipe.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
                        {[`${recipe.time}m`, `${recipe.cal} cal`, recipe.diff].map(t => (
                          <View key={t} style={[P.mealChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#6B7280' : '#7C3AED' }}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <Text style={[P.mealEmpty, { color: isDark ? '#374151' : '#C4B5FD' }]}>Tap to add a meal</Text>
                  )}
                </View>
                {recipe ? (
                  <TouchableOpacity onPress={() => remove(DAYS[activeDay], meal)} style={P.removeBtn}>
                    <Ionicons name="close" size={14} color={isDark ? '#4B5563' : '#D1D5DB'} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setPicker({ day: DAYS[activeDay], meal })} activeOpacity={0.8}
                    style={[P.addBtn, { backgroundColor: ACCENT }]}>
                    <Ionicons name="add" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </GlassCard>
            );
          })}
        </View>

        {/* ── Week Overview Grid ── */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={[P.dayHeading, { color: colors.textPrimary, marginBottom: 10 }]}>Week at a Glance</Text>
          <GlassCard style={{ padding: 12 }}>
            {MEALS.map((meal, mi) => (
              <View key={meal} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, mi > 0 && { marginTop: 8 }]}>
                <Text style={[P.glanceLabel, { color: isDark ? '#6B7280' : '#9CA3AF', width: 60 }]}>{meal}</Text>
                <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                  {DAYS.map(d => {
                    const rId = plan[`${d}_${meal}`];
                    const rec = MEALS_DATA.find(m => m.id === rId);
                    return (
                      <TouchableOpacity key={d} onPress={() => { setActiveDay(DAYS.indexOf(d)); setPicker({ day: d, meal }); }}
                        style={[P.glanceCell, { backgroundColor: rec ? ACCENT + '25' : (isDark ? 'rgba(255,255,255,0.05)' : '#F5F3FF'), borderColor: rec ? ACCENT + '40' : 'transparent' }]}>
                        <Text style={{ fontSize: rec ? 12 : 10, color: rec ? ACCENT : (isDark ? '#374151' : '#DDD9FF') }}>
                          {rec ? rec.emoji : '+'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </GlassCard>
        </View>
      </ScrollView>

      {/* ── Recipe Picker Modal ── */}
      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setPicker(null)} />
          <View style={[P.pickerSheet, { backgroundColor: isDark ? '#0F0C1D' : '#FAFBFF', paddingBottom: insets.bottom + 16 }]}>
            <View style={P.pickerHandle} />
            <Text style={[P.pickerTitle, { color: colors.textPrimary }]}>Pick a recipe</Text>
            <Text style={[P.pickerSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
              {picker?.day} · {picker?.meal}
            </Text>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 12 }}>
              {MEALS_DATA
                .filter(m => !picker?.meal || m.category === picker.meal || picker.meal === 'Lunch' || true)
                .map(rec => (
                  <TouchableOpacity key={rec.id} onPress={() => assign(rec.id)} activeOpacity={0.85}>
                    <GlassCard style={P.pickerRow}>
                      <View style={[P.pickerEmoji, { backgroundColor: isDark ? ACCENT + '22' : ACCENT + '12' }]}>
                        <Text style={{ fontSize: 22 }}>{rec.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[P.pickerName, { color: colors.textPrimary }]}>{rec.name}</Text>
                        <Text style={[P.pickerMeta, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                          {rec.time}m · {rec.cal} cal · {rec.diff}
                        </Text>
                      </View>
                      <View style={[P.pickerCategory, { backgroundColor: ACCENT + '15' }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: ACCENT }}>{rec.category}</Text>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const P = StyleSheet.create({
  hero:          { overflow: 'hidden', padding: 16, paddingBottom: 18 },
  heroEyebrow:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  heroTitle:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroSub:       { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  heroStats:     { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 50 },
  heroStatN:     { fontSize: 18, fontWeight: '900', color: '#fff' },
  heroStatL:     { fontSize: 8, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginTop: 1 },
  dayTab:        { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, minWidth: 48 },
  dayTabLabel:   { fontSize: 9, letterSpacing: 0.5 },
  dayHeading:    { fontSize: 16, fontWeight: '900' },
  mealSlot:      { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  mealIconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealType:      { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  mealName:      { fontSize: 13, fontWeight: '700' },
  mealChip:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  mealEmpty:     { fontSize: 12, fontWeight: '500', marginTop: 2 },
  addBtn:        { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  removeBtn:     { padding: 6 },
  glanceLabel:   { fontSize: 9, fontWeight: '700' },
  glanceCell:    { flex: 1, aspectRatio: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  // Picker
  pickerSheet:   { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 12 },
  pickerHandle:  { width: 32, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 14 },
  pickerTitle:   { fontSize: 17, fontWeight: '900' },
  pickerSub:     { fontSize: 12, marginTop: 2, marginBottom: 2 },
  pickerRow:     { flexDirection: 'row', alignItems: 'center', padding: 11, gap: 10 },
  pickerEmoji:   { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pickerName:    { fontSize: 13, fontWeight: '700' },
  pickerMeta:    { fontSize: 10, marginTop: 2 },
  pickerCategory:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});
