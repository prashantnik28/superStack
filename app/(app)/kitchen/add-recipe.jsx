import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Keyboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT   = '#6C63FF';
const ACCENT2  = '#5851E6';
const OK       = '#10B981';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];
const DIFFS      = ['Easy', 'Medium', 'Hard'];
const EMOJIS     = ['🍝', '🍗', '🥗', '🍜', '🥘', '🍛', '🥞', '🫙', '🥤', '🍳', '🥣', '🍮', '🍫', '🥙', '🌮', '🍲', '🥚', '🧆', '🥩', '🍱'];
const UNITS      = ['g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'cups', 'pinch'];

export default function AddRecipe() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [name,       setName]       = useState('');
  const [category,   setCategory]   = useState('Dinner');
  const [diff,       setDiff]       = useState('Easy');
  const [time,       setTime]       = useState('');
  const [cal,        setCal]        = useState('');
  const [servings,   setServings]   = useState('2');
  const [emoji,      setEmoji]      = useState('🍝');
  const [emojiOpen,  setEmojiOpen]  = useState(false);
  const [ingredients, setIngredients] = useState([{ name: '', qty: '', unit: 'g' }]);
  const [steps,      setSteps]      = useState(['']);

  const addIngredient = () => setIngredients(p => [...p, { name: '', qty: '', unit: 'g' }]);
  const updateIng = (i, field, val) => setIngredients(p => p.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing));
  const removeIng = (i) => setIngredients(p => p.filter((_, idx) => idx !== i));

  const addStep = () => setSteps(p => [...p, '']);
  const updateStep = (i, val) => setSteps(p => p.map((s, idx) => idx === i ? val : s));
  const removeStep = (i) => setSteps(p => p.filter((_, idx) => idx !== i));

  const save = () => {
    if (!name.trim()) { Alert.alert('Missing name', 'Please give your recipe a name.'); return; }
    if (ingredients.every(i => !i.name.trim())) { Alert.alert('Add ingredients', 'Add at least one ingredient.'); return; }
    Keyboard.dismiss();
    Alert.alert('Recipe Saved!', `"${name}" has been added to your recipe book.`, [
      { text: 'Great!', onPress: () => router.back() },
    ]);
  };

  const inputStyle = [A.input, {
    color: colors.textPrimary,
    backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF',
    borderColor: isDark ? 'rgba(108,99,255,0.18)' : '#DDD9FF',
  }];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0818' : '#F8F7FF' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Header Card ── */}
        <View style={A.header}>
          <LinearGradient colors={['rgba(88,70,230,0.92)', 'rgba(26,10,80,0.97)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)' }} />
          <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 20 }}>
            {/* Emoji picker */}
            <TouchableOpacity onPress={() => setEmojiOpen(!emojiOpen)} activeOpacity={0.8} style={A.emojiBtn}>
              <Text style={{ fontSize: 48 }}>{emoji}</Text>
              <View style={A.emojiEditBadge}><Ionicons name="pencil" size={10} color="#fff" /></View>
            </TouchableOpacity>
            {emojiOpen && (
              <View style={A.emojiGrid}>
                {EMOJIS.map(e => (
                  <TouchableOpacity key={e} onPress={() => { setEmoji(e); setEmojiOpen(false); }} style={A.emojiOption}>
                    <Text style={{ fontSize: 24 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TextInput value={name} onChangeText={setName} placeholder="Recipe name..." placeholderTextColor="rgba(255,255,255,0.35)"
              style={A.titleInput} autoCapitalize="words" />
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Tap the emoji to change it</Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 16 }}>

          {/* ── Category ── */}
          <View>
            <Text style={[A.sectionLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginTop: 7 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => setCategory(c)} activeOpacity={0.8}
                  style={[A.pill, { backgroundColor: category === c ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF'), borderColor: category === c ? ACCENT2 : (isDark ? 'rgba(255,255,255,0.1)' : '#E0DBFF') }]}>
                  <Text style={[A.pillTxt, { color: category === c ? '#fff' : (isDark ? '#6B7280' : '#7C3AED') }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Difficulty ── */}
          <View>
            <Text style={[A.sectionLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>DIFFICULTY</Text>
            <View style={{ flexDirection: 'row', gap: 7, marginTop: 7 }}>
              {DIFFS.map(d => (
                <TouchableOpacity key={d} onPress={() => setDiff(d)} activeOpacity={0.8}
                  style={[A.pill, { flex: 1, justifyContent: 'center', backgroundColor: diff === d ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF'), borderColor: diff === d ? ACCENT2 : (isDark ? 'rgba(255,255,255,0.1)' : '#E0DBFF') }]}>
                  <Text style={[A.pillTxt, { color: diff === d ? '#fff' : (isDark ? '#6B7280' : '#7C3AED') }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Quick Info ── */}
          <View>
            <Text style={[A.sectionLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>QUICK INFO</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 7 }}>
              <View style={{ flex: 1 }}>
                <Text style={[A.fieldLabel, { color: isDark ? '#4B5563' : '#C4B5FD' }]}>Cook Time (min)</Text>
                <TextInput value={time} onChangeText={setTime} keyboardType="numeric" placeholder="25"
                  placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} style={inputStyle} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[A.fieldLabel, { color: isDark ? '#4B5563' : '#C4B5FD' }]}>Calories</Text>
                <TextInput value={cal} onChangeText={setCal} keyboardType="numeric" placeholder="400"
                  placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} style={inputStyle} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[A.fieldLabel, { color: isDark ? '#4B5563' : '#C4B5FD' }]}>Servings</Text>
                <TextInput value={servings} onChangeText={setServings} keyboardType="numeric" placeholder="2"
                  placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} style={inputStyle} />
              </View>
            </View>
          </View>

          {/* ── Ingredients ── */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <Text style={[A.sectionLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>INGREDIENTS</Text>
              <TouchableOpacity onPress={addIngredient} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="add-circle-outline" size={14} color={ACCENT} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {ingredients.map((ing, i) => (
                <GlassCard key={i} style={A.ingRow}>
                  <View style={[A.ingNum, { backgroundColor: ACCENT + '15' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: ACCENT }}>{i + 1}</Text>
                  </View>
                  <TextInput value={ing.name} onChangeText={v => updateIng(i, 'name', v)}
                    placeholder="Ingredient" placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                    style={[A.ingNameInput, { color: colors.textPrimary }]} />
                  <TextInput value={ing.qty} onChangeText={v => updateIng(i, 'qty', v)}
                    keyboardType="numeric" placeholder="Qty"
                    placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                    style={[A.ingQtyInput, { color: colors.textPrimary, borderColor: isDark ? 'rgba(108,99,255,0.18)' : '#DDD9FF' }]} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxWidth: 80 }} contentContainerStyle={{ gap: 4 }}>
                    {UNITS.map(u => (
                      <TouchableOpacity key={u} onPress={() => updateIng(i, 'unit', u)}
                        style={[A.unitChip, { backgroundColor: ing.unit === u ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6') }]}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: ing.unit === u ? '#fff' : (isDark ? '#6B7280' : '#9CA3AF') }}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {ingredients.length > 1 && (
                    <TouchableOpacity onPress={() => removeIng(i)} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={16} color={isDark ? '#374151' : '#D1D5DB'} />
                    </TouchableOpacity>
                  )}
                </GlassCard>
              ))}
            </View>
          </View>

          {/* ── Steps ── */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <Text style={[A.sectionLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>INSTRUCTIONS</Text>
              <TouchableOpacity onPress={addStep} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="add-circle-outline" size={14} color={ACCENT} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>Add Step</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8 }}>
              {steps.map((s, i) => (
                <GlassCard key={i} style={A.stepRow}>
                  <View style={[A.stepNum, { backgroundColor: ACCENT }]}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#fff' }}>{i + 1}</Text>
                  </View>
                  <TextInput value={s} onChangeText={v => updateStep(i, v)}
                    placeholder={`Step ${i + 1}...`} placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                    multiline style={[A.stepInput, { color: colors.textPrimary }]} />
                  {steps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(i)} style={{ padding: 4, alignSelf: 'flex-start' }}>
                      <Ionicons name="close-circle" size={16} color={isDark ? '#374151' : '#D1D5DB'} />
                    </TouchableOpacity>
                  )}
                </GlassCard>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Save Button ── */}
      <View style={[A.saveBar, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? '#0A0818' : '#F8F7FF', borderTopColor: isDark ? 'rgba(108,99,255,0.12)' : '#EDE9FE' }]}>
        <TouchableOpacity onPress={save} activeOpacity={0.85} style={A.saveBtn}>
          <LinearGradient colors={[ACCENT2, ACCENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 13 }]} />
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff' }}>Save Recipe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const A = StyleSheet.create({
  header:        { overflow: 'hidden', paddingHorizontal: 20 },
  emojiBtn:      { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  emojiEditBadge:{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  emojiGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 10 },
  emojiOption:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  titleInput:    { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', marginTop: 10, minWidth: 200 },
  sectionLabel:  { fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
  fieldLabel:    { fontSize: 10, fontWeight: '700', marginBottom: 5 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pillTxt:       { fontSize: 11, fontWeight: '700' },
  input:         { fontSize: 14, padding: 11, borderRadius: 10, borderWidth: 1, fontWeight: '600' },
  // Ingredients
  ingRow:        { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  ingNum:        { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  ingNameInput:  { flex: 1, fontSize: 13, fontWeight: '600', padding: 0 },
  ingQtyInput:   { width: 46, fontSize: 12, fontWeight: '600', padding: 0, borderBottomWidth: 1, textAlign: 'center', paddingBottom: 2 },
  unitChip:      { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  // Steps
  stepRow:       { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  stepNum:       { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepInput:     { flex: 1, fontSize: 13, lineHeight: 20, padding: 0, minHeight: 36 },
  // Save bar
  saveBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  saveBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 13, overflow: 'hidden' },
});
