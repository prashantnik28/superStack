import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useExpensesStore } from '../../../../src/stores/useExpensesStore';
import GlassCard from '../../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';

const CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',    icon: 'restaurant',          color: '#FF6B6B' },
  { id: 'transport',     label: 'Transport',         icon: 'car',                 color: '#4ECDC4' },
  { id: 'shopping',      label: 'Shopping',          icon: 'bag',                 color: '#45B7D1' },
  { id: 'entertainment', label: 'Entertainment',     icon: 'game-controller',     color: '#96CEB4' },
  { id: 'health',        label: 'Health',            icon: 'medical',             color: '#FF9FF3' },
  { id: 'education',     label: 'Education',         icon: 'school',              color: '#A29BFE' },
  { id: 'bills',         label: 'Bills & Utilities', icon: 'receipt',             color: '#FD79A8' },
  { id: 'salary',        label: 'Salary',            icon: 'briefcase',           color: '#6BCB77' },
  { id: 'freelance',     label: 'Freelance',         icon: 'laptop',              color: '#4D96FF' },
  { id: 'others',        label: 'Others',            icon: 'ellipsis-horizontal', color: '#B2BEC3' },
];

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',  icon: 'phone-portrait' },
  { id: 'card', label: 'Card', icon: 'card'           },
  { id: 'cash', label: 'Cash', icon: 'cash'           },
  { id: 'bank', label: 'Bank', icon: 'business'       },
];

const RECURRING_OPTIONS = [
  { id: null,      label: 'None'    },
  { id: 'weekly',  label: 'Weekly'  },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly'  },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatCurrency = (n, cur = 'INR') => {
  const num = Number(n);
  if (cur === 'USD') return `$${num.toLocaleString('en-US')}`;
  return `₹${num.toLocaleString('en-IN')}`;
};

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dayOffset(y, m)   { return new Date(y, m, 1).getDay(); }

function MiniCalendar({ year, month, selDate, onSelect, onPrev, onNext, isDark }) {
  const days   = daysInMonth(year, month);
  const offset = dayOffset(year, month);
  const today  = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const isSel   = (d) => selDate?.year === year && selDate?.month === month && selDate?.date === d;

  return (
    <View>
      <View style={CAL.header}>
        <TouchableOpacity onPress={onPrev} style={CAL.navBtn}><Ionicons name="chevron-back" size={18} color={ACCENT} /></TouchableOpacity>
        <Text style={[CAL.monthLabel, { color: ACCENT }]}>{MONTHS_SHORT[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={CAL.navBtn}><Ionicons name="chevron-forward" size={18} color={ACCENT} /></TouchableOpacity>
      </View>
      <View style={CAL.dayRow}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={[CAL.dayLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{d}</Text>
        ))}
      </View>
      <View style={CAL.grid}>
        {Array.from({ length: offset }).map((_, i) => <View key={`e${i}`} style={CAL.cell} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1;
          return (
            <TouchableOpacity key={d} style={CAL.cell} onPress={() => onSelect({ year, month, date: d })} activeOpacity={0.7}>
              <View style={[CAL.dayCircle, isSel(d) && { backgroundColor: ACCENT }, isToday(d) && !isSel(d) && { borderWidth: 1.5, borderColor: ACCENT }]}>
                <Text style={[CAL.dayNum, { color: isSel(d) ? '#fff' : isToday(d) ? ACCENT : isDark ? '#E5E7EB' : '#374151' }]}>{d}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CAL = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn:     { padding: 6 },
  monthLabel: { fontSize: 14, fontWeight: '800' },
  dayRow:     { flexDirection: 'row', marginBottom: 6 },
  dayLabel:   { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap' },
  cell:       { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayCircle:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNum:     { fontSize: 13, fontWeight: '600' },
});

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark, radius } = useTheme();
  const { transactions, updateTransaction, deleteTransaction, currency } = useExpensesStore();
  const fmt     = (n) => formatCurrency(n, currency);
  const currSym = currency === 'USD' ? '$' : '₹';

  const original = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);

  const [amount,    setAmount]    = useState('');
  const [type,      setType]      = useState('expense');
  const [category,  setCategory]  = useState('food');
  const [desc,      setDesc]      = useState('');
  const [method,    setMethod]    = useState('upi');
  const [notes,     setNotes]     = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const now = new Date();
  const [selDate, setSelDate]   = useState({ year: now.getFullYear(), month: now.getMonth(), date: now.getDate() });
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    if (original) {
      setAmount(String(original.amount));
      setType(original.type || 'expense');
      setCategory(original.category);
      setDesc(original.description);
      setMethod(original.method);
      setNotes(original.notes || '');
      setRecurring(original.recurring || false);
      setRecurringInterval(original.recurringInterval || null);
      const [dy, dm, dd] = original.date.split('-').map(Number);
      const s = { year: dy, month: dm - 1, date: dd };
      setSelDate(s);
      setCalYear(s.year);
      setCalMonth(s.month);
    }
  }, [original]);

  const cat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[CATEGORIES.length - 1];

  const formatDate = () => `${selDate.date} ${MONTHS_SHORT[selDate.month]} ${selDate.year}`;

  const handleSave = useCallback(async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount', 'Enter a valid amount.'); return; }
    if (!desc.trim()) { Alert.alert('Missing description', 'Add a short description.'); return; }
    setSaving(true);
    try {
      const d = new Date(selDate.year, selDate.month, selDate.date);
      await updateTransaction(id, {
        amount: amt, type, category, description: desc.trim(),
        date: d.toISOString(), method, notes: notes.trim(),
        recurring, recurringInterval: recurring ? recurringInterval : null,
      });
      router.back();
    } catch { Alert.alert('Error', 'Could not save changes.'); }
    setSaving(false);
  }, [amount, type, category, desc, selDate, method, notes, recurring, recurringInterval, id, updateTransaction]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Transaction', `Remove "${desc}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteTransaction(id);
            router.back();
          } catch { Alert.alert('Error', 'Could not delete.'); }
        },
      },
    ]);
  }, [desc, id, deleteTransaction]);

  if (!original) {
    return (
      <View style={[S.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Transaction not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[S.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero */}
        <LinearGradient
          colors={type === 'income' ? ['#3DB87A', '#1E5C42'] : ['#7B6CFF', '#3D2F9E']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[S.heroWrap, { borderRadius: radius + 4 }]}>
          <View style={[S.heroIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={cat.icon} size={34} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginTop: 8 }}>
            {type === 'income' ? 'INCOME' : 'EXPENSE'} · {cat.label.toUpperCase()}
          </Text>
          <View style={S.amtInputWrap}>
            <Text style={S.amtCurrency}>{currSym}</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={S.amtInput}
            />
          </View>
        </LinearGradient>

        {/* Type toggle */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>TYPE</Text>
          <View style={S.typeRow}>
            {['expense', 'income'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[S.typeBtn, { backgroundColor: type === t ? (t === 'income' ? '#4CAF82' : '#FF6B6B') : isDark ? 'rgba(255,255,255,0.06)' : '#F8F7FF' }]}>
                <Ionicons name={t === 'income' ? 'arrow-up-circle' : 'arrow-down-circle'} size={16} color={type === t ? '#fff' : isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={[S.typeTxt, { color: type === t ? '#fff' : isDark ? '#9CA3AF' : '#6B7280' }]}>{t === 'income' ? 'Income' : 'Expense'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Description */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DESCRIPTION</Text>
          <View style={[S.inputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' }]}>
            <TextInput value={desc} onChangeText={setDesc} placeholder="What was it for?" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} style={[S.input, { color: colors.textPrimary }]} />
          </View>
        </GlassCard>

        {/* Category */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[S.catChip, { backgroundColor: active ? c.color : isDark ? c.color + '22' : c.color + '18', borderColor: active ? c.color : 'transparent', borderWidth: 1.5 }]}>
                  <Ionicons name={c.icon} size={13} color={active ? '#fff' : c.color} />
                  <Text style={[S.catChipTxt, { color: active ? '#fff' : c.color }]}>{c.label.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </GlassCard>

        {/* Payment method */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>PAYMENT METHOD</Text>
          <View style={S.methodRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[S.methodBtn, { backgroundColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.06)' : '#F8F7FF', borderColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#EEE', borderWidth: 1 }]}>
                  <Ionicons name={m.icon} size={16} color={active ? '#fff' : ACCENT} />
                  <Text style={[S.methodTxt, { color: active ? '#fff' : colors.textPrimary }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Date */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DATE</Text>
          <TouchableOpacity onPress={() => setDatePickerOpen(true)} style={[S.dateRow, { backgroundColor: isDark ? 'rgba(108,99,255,0.1)' : '#F0EEFF' }]}>
            <Ionicons name="calendar" size={18} color={ACCENT} />
            <Text style={[S.dateTxt, { color: colors.textPrimary }]}>{formatDate()}</Text>
            <Ionicons name="chevron-down" size={15} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </GlassCard>

        {/* Recurring */}
        <GlassCard style={S.section}>
          <View style={S.recurringHeader}>
            <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 0 }]}>RECURRING</Text>
            <TouchableOpacity onPress={() => setRecurring(!recurring)} style={[S.toggle, { backgroundColor: recurring ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
              <View style={[S.toggleThumb, { left: recurring ? 18 : 2 }]} />
            </TouchableOpacity>
          </View>
          {recurring && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {RECURRING_OPTIONS.filter((o) => o.id).map((o) => (
                <TouchableOpacity
                  key={o.id}
                  onPress={() => setRecurringInterval(o.id)}
                  style={[S.recurBtn, { backgroundColor: recurringInterval === o.id ? ACCENT : isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
                  <Text style={[S.recurTxt, { color: recurringInterval === o.id ? '#fff' : ACCENT }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        {/* Notes */}
        <GlassCard style={S.section}>
          <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>NOTES</Text>
          <View style={[S.inputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB', minHeight: 80 }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              style={[S.input, { color: colors.textPrimary, minHeight: 60 }]}
            />
          </View>
        </GlassCard>

        {/* Split info (read-only display) */}
        {original.splitWith?.length > 0 && (
          <GlassCard style={S.section}>
            <Text style={[S.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SPLIT DETAILS</Text>
            <Text style={[S.splitYou, { color: colors.textPrimary }]}>You paid {fmt(original.amount)}</Text>
            {original.splitWith.map((s, i) => (
              <View key={i} style={S.splitRow}>
                <View style={[S.splitAvatar, { backgroundColor: ACCENT + '22' }]}>
                  <Ionicons name="person" size={14} color={ACCENT} />
                </View>
                <Text style={[S.splitName, { color: colors.textPrimary }]}>Member owes</Text>
                <Text style={[S.splitAmt, { color: '#FF6B6B' }]}>{fmt(s.amount)}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Delete */}
        <TouchableOpacity onPress={handleDelete} style={[S.deleteBtn, { borderColor: '#FF6B6B' }]}>
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          <Text style={S.deleteTxt}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save button */}
      <View style={[S.saveBar, { backgroundColor: colors.background, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEE' }]}>
        <TouchableOpacity onPress={() => router.back()} style={[S.saveBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF', flex: 0, paddingHorizontal: 20 }]}>
          <Text style={[S.saveTxt, { color: ACCENT }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[S.saveBtn, { backgroundColor: ACCENT }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={[S.saveTxt, { color: '#fff' }]}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Date picker modal */}
      <Modal visible={datePickerOpen} transparent animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
        <View style={DP.bg}>
          <GlassCard style={[DP.card, { backgroundColor: isDark ? '#1a1a2e' : '#FFFFFF' }]}>
            <Text style={[DP.title, { color: colors.textPrimary }]}>Pick a Date</Text>
            <MiniCalendar
              year={calYear} month={calMonth} selDate={selDate} isDark={isDark}
              onSelect={(d) => { setSelDate(d); setDatePickerOpen(false); }}
              onPrev={() => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); }}
              onNext={() => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); }}
            />
            <TouchableOpacity onPress={() => setDatePickerOpen(false)} style={[DP.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
              <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const DP = StyleSheet.create({
  bg:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: 20 },
  card:     { padding: 20 },
  title:    { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  closeBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
});

const S = StyleSheet.create({
  root:        { flex: 1 },
  heroWrap:    { marginHorizontal: 16, marginTop: 14, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 4, overflow: 'hidden' },
  heroIcon:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  amtInputWrap:{ flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  amtCurrency: { fontSize: 34, fontWeight: '800', marginRight: 4, color: 'rgba(255,255,255,0.8)' },
  amtInput:    { fontSize: 34, fontWeight: '800', minWidth: 80, padding: 0, color: '#FFFFFF' },
  section:     { marginHorizontal: 16, marginTop: 10, padding: 16 },
  fieldLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  inputWrap:   { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10 },
  input:       { fontSize: 14, fontWeight: '500', padding: 0 },
  typeRow:     { flexDirection: 'row', gap: 10 },
  typeBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12, borderRadius: 12 },
  typeTxt:     { fontSize: 13, fontWeight: '700' },
  catChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, gap: 5 },
  catChipTxt:  { fontSize: 11, fontWeight: '700' },
  methodRow:   { flexDirection: 'row', gap: 8 },
  methodBtn:   { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11, gap: 4 },
  methodTxt:   { fontSize: 10, fontWeight: '700' },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12 },
  dateTxt:     { flex: 1, fontSize: 14, fontWeight: '700' },
  recurringHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle:      { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  recurBtn:    { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  recurTxt:    { fontSize: 12, fontWeight: '700' },
  splitYou:    { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  splitRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  splitAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  splitName:   { flex: 1, fontSize: 13, fontWeight: '600' },
  splitAmt:    { fontSize: 13, fontWeight: '800' },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, gap: 8 },
  deleteTxt:   { color: '#FF6B6B', fontSize: 14, fontWeight: '700' },
  saveBar:     { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 6 },
  saveTxt:     { fontSize: 14, fontWeight: '800' },
});
