import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/context/ThemeContext';
import { useExpensesStore } from '../../../src/stores/useExpensesStore';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';
const EMOJIS = ['🎯','✈️','📱','🏠','🚗','💍','🎓','💰','🏖️','🎁','🛍️','⚕️'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatCurrency = (n, cur = 'INR') => {
  const num = Number(n);
  if (cur === 'USD') return `$${num.toLocaleString('en-US')}`;
  return `₹${num.toLocaleString('en-IN')}`;
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function monthsUntil(dateStr) {
  if (!dateStr) return null;
  const now  = new Date();
  const end  = new Date(dateStr);
  const diff = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  return Math.max(1, diff);
}

function ProgressRing({ size = 80, progress = 0, color = ACCENT, strokeWidth = 8 }) {
  const r   = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, progress));
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(108,99,255,0.12)" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

function GoalCard({ goal, isDark, colors, onContribute, onEdit, onDelete, fmt, currSym }) {
  const pct = goal.targetAmount > 0 ? goal.targetAmount > 0 ? Math.min(1, goal.savedAmount / goal.targetAmount) : 0 : 0;
  const remaining = goal.targetAmount - goal.savedAmount;
  const months    = monthsUntil(goal.deadline);
  const days      = daysUntil(goal.deadline);
  const monthlyNeed = months ? Math.ceil(remaining / months) : 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <GlassCard style={[G.card, { backgroundColor: isDark ? undefined : '#FFFFFF' }]}>
        <View style={G.cardHeader}>
          <View style={[G.emojiWrap, { backgroundColor: ACCENT + '18' }]}>
            <Text style={G.emoji}>{goal.emoji}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[G.goalName, { color: colors.textPrimary }]}>{goal.name}</Text>
            {goal.deadline && (
              <Text style={[G.deadline, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                {days > 0 ? `${days}d left` : days === 0 ? 'Due today' : 'Overdue'} · {MONTHS[new Date(goal.deadline).getMonth()]} {new Date(goal.deadline).getFullYear()}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'center' }}>
            <ProgressRing size={62} progress={pct} color={pct >= 1 ? '#4CAF82' : ACCENT} strokeWidth={6} />
            <Text style={[G.ringPct, { color: pct >= 1 ? '#4CAF82' : ACCENT }]}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>

        <View style={G.amtRow}>
          <View>
            <Text style={[G.savedLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SAVED</Text>
            <Text style={[G.savedAmt, { color: '#4CAF82' }]}>{fmt(goal.savedAmount)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={[G.savedLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>REMAINING</Text>
            <Text style={[G.savedAmt, { color: remaining <= 0 ? '#4CAF82' : colors.textPrimary }]}>{remaining <= 0 ? 'Done!' : fmt(remaining)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[G.savedLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>TARGET</Text>
            <Text style={[G.savedAmt, { color: colors.textPrimary }]}>{fmt(goal.targetAmount)}</Text>
          </View>
        </View>

        {months && remaining > 0 && (
          <View style={[G.tipRow, { backgroundColor: ACCENT + '12' }]}>
            <Ionicons name="bulb" size={13} color={ACCENT} />
            <Text style={[G.tipTxt, { color: ACCENT }]}>Save {fmt(monthlyNeed)}/month to hit your goal</Text>
          </View>
        )}

        <View style={G.actions}>
          {remaining > 0 && (
            <TouchableOpacity onPress={() => onContribute(goal)} style={[G.actionBtn, { backgroundColor: ACCENT }]}>
              <Ionicons name="add" size={15} color="#fff" />
              <Text style={[G.actionTxt, { color: '#fff' }]}>Add Money</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => onEdit(goal)} style={[G.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF', flex: 0, paddingHorizontal: 14 }]}>
            <Ionicons name="pencil" size={14} color={ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(goal)} style={[G.actionBtn, { backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : '#FFF0F0', flex: 0, paddingHorizontal: 14 }]}>
            <Ionicons name="trash-outline" size={14} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function GoalFormSheet({ visible, onClose, onSave, initial, isDark, colors, currSym }) {
  const [name,   setName]   = useState('');
  const [emoji,  setEmoji]  = useState('🎯');
  const [target, setTarget] = useState('');
  const [deadlineMonth, setDeadlineMonth] = useState(new Date().getMonth());
  const [deadlineYear,  setDeadlineYear]  = useState(new Date().getFullYear() + 1);
  const [hasDeadline, setHasDeadline] = useState(false);

  useEffect(() => {
    if (visible && initial) {
      setName(initial.name || '');
      setEmoji(initial.emoji || '🎯');
      setTarget(String(initial.targetAmount || ''));
      if (initial.deadline) {
        const d = new Date(initial.deadline);
        setDeadlineMonth(d.getMonth());
        setDeadlineYear(d.getFullYear());
        setHasDeadline(true);
      } else {
        setHasDeadline(false);
      }
    } else if (visible && !initial) {
      setName(''); setEmoji('🎯'); setTarget('');
      setDeadlineMonth(new Date().getMonth());
      setDeadlineYear(new Date().getFullYear() + 1);
      setHasDeadline(false);
    }
  }, [visible, initial]);

  const handleSave = useCallback(() => {
    if (!name.trim()) { Alert.alert('Missing name', 'Please give your goal a name.'); return; }
    const t = parseFloat(target);
    if (isNaN(t) || t <= 0) { Alert.alert('Invalid amount', 'Please enter a valid target amount.'); return; }
    const dto = {
      name: name.trim(), emoji, targetAmount: t,
      ...(hasDeadline ? { deadline: new Date(deadlineYear, deadlineMonth, 1).toISOString() } : {}),
    };
    onSave(dto);
    onClose();
  }, [name, emoji, target, hasDeadline, deadlineMonth, deadlineYear, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <View style={[F.sheet, { backgroundColor: isDark ? '#111' : '#FFF' }]}>
          <View style={F.handle} />
          <Text style={[F.title, { color: colors.textPrimary }]}>{initial ? 'Edit Goal' : 'New Goal'}</Text>

          <Text style={[F.label, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>PICK AN EMOJI</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4, paddingRight: 8 }}>
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEmoji(e)}
                style={[F.emojiBtn, { backgroundColor: emoji === e ? ACCENT + '22' : isDark ? 'rgba(255,255,255,0.05)' : '#F8F7FF', borderColor: emoji === e ? ACCENT : 'transparent', borderWidth: 2 }]}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[F.label, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>GOAL NAME</Text>
          <View style={[F.inputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' }]}>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Goa Trip" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} style={[F.input, { color: colors.textPrimary }]} />
          </View>

          <Text style={[F.label, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>TARGET AMOUNT</Text>
          <View style={[F.amountWrap, { backgroundColor: isDark ? 'rgba(108,99,255,0.12)' : '#F0EEFF' }]}>
            <Text style={[F.amountCurrency, { color: ACCENT }]}>{currSym}</Text>
            <TextInput value={target} onChangeText={setTarget} placeholder="0" keyboardType="decimal-pad" style={[F.amountInput, { color: colors.textPrimary }]} />
          </View>

          <View style={F.deadlineRow}>
            <Text style={[F.label, { color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 0 }]}>SET DEADLINE</Text>
            <TouchableOpacity onPress={() => setHasDeadline(!hasDeadline)} style={[F.toggle, { backgroundColor: hasDeadline ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
              <View style={[F.toggleThumb, { left: hasDeadline ? 18 : 2 }]} />
            </TouchableOpacity>
          </View>

          {hasDeadline && (
            <View style={F.deadlinePickers}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity key={m} onPress={() => setDeadlineMonth(i)} style={[F.monthBtn, { backgroundColor: deadlineMonth === i ? ACCENT : isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
                    <Text style={[F.monthTxt, { color: deadlineMonth === i ? '#fff' : isDark ? '#E5E7EB' : ACCENT }]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={F.yearRow}>
                {[0,1,2,3].map((offset) => {
                  const y = new Date().getFullYear() + offset;
                  return (
                    <TouchableOpacity key={y} onPress={() => setDeadlineYear(y)} style={[F.yearBtn, { backgroundColor: deadlineYear === y ? ACCENT : isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
                      <Text style={[F.yearTxt, { color: deadlineYear === y ? '#fff' : isDark ? '#E5E7EB' : ACCENT }]}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={F.btns}>
            <TouchableOpacity onPress={onClose} style={[F.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
              <Text style={[F.btnTxt, { color: ACCENT }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[F.btn, { backgroundColor: ACCENT }]}>
              <Text style={[F.btnTxt, { color: '#fff' }]}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ContributeSheet({ visible, goal, onClose, onSave, isDark, colors }) {
  const [amount, setAmount] = useState('');

  useEffect(() => { if (visible) setAmount(''); }, [visible]);

  const handleSave = useCallback(() => {
    const a = parseFloat(amount);
    if (isNaN(a) || a <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    onSave(a);
    onClose();
  }, [amount, onSave, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <View style={[F.sheet, { backgroundColor: isDark ? '#111' : '#FFF', paddingBottom: 32 }]}>
          <View style={F.handle} />
          <Text style={[F.title, { color: colors.textPrimary }]}>Add to "{goal?.name}"</Text>
          <View style={[F.amountWrap, { backgroundColor: isDark ? 'rgba(108,99,255,0.12)' : '#F0EEFF' }]}>
            <Text style={[F.amountCurrency, { color: ACCENT }]}>{currSym}</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" autoFocus style={[F.amountInput, { color: colors.textPrimary }]} />
          </View>
          <View style={F.btns}>
            <TouchableOpacity onPress={onClose} style={[F.btn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
              <Text style={[F.btnTxt, { color: ACCENT }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[F.btn, { backgroundColor: '#4CAF82' }]}>
              <Ionicons name="add" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={[F.btnTxt, { color: '#fff' }]}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function GoalsScreen() {
  const { colors, isDark, radius } = useTheme();
  const { goals, fetchGoals, createGoal, updateGoal, deleteGoal, contributeToGoal, currency } = useExpensesStore();
  const fmt     = (n) => formatCurrency(n, currency);
  const currSym = currency === 'USD' ? '$' : '₹';
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);

  useEffect(() => { fetchGoals(); }, []);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.savedAmount, 0);

  const handleSave = useCallback(async (dto) => {
    try {
      if (editGoal) await updateGoal(editGoal.id, dto);
      else          await createGoal(dto);
    } catch { Alert.alert('Error', 'Could not save goal.'); }
    setEditGoal(null);
  }, [editGoal, updateGoal, createGoal]);

  const handleDelete = useCallback((goal) => {
    Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
    ]);
  }, [deleteGoal]);

  const handleContribute = useCallback(async (amount) => {
    try { await contributeToGoal(contributeGoal.id, amount); }
    catch { Alert.alert('Error', 'Could not add contribution.'); }
    setContributeGoal(null);
  }, [contributeGoal, contributeToGoal]);

  return (
    <View style={[R.root, { backgroundColor: colors.background }]}>
      {goals.length > 0 && (
        <LinearGradient colors={['#3DB87A', '#1E5C42']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[R.hero, { borderRadius: radius + 4 }]}>
          <Text style={[R.heroLabel, { color: 'rgba(255,255,255,0.65)' }]}>SAVINGS GOALS OVERVIEW</Text>
          <View style={R.heroRow}>
            <View style={R.heroStat}>
              <Text style={[R.heroVal, { color: '#A8EDEA' }]}>{fmt(totalSaved)}</Text>
              <Text style={[R.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Saved</Text>
            </View>
            <View style={[R.heroDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={R.heroStat}>
              <Text style={[R.heroVal, { color: '#FCD9A5' }]}>{fmt(totalTarget)}</Text>
              <Text style={[R.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Target</Text>
            </View>
            <View style={[R.heroDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={R.heroStat}>
              <Text style={[R.heroVal, { color: '#FFFFFF' }]}>
                {totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}%` : '0%'}
              </Text>
              <Text style={[R.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Overall</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingTop: goals.length > 0 ? 0 : 16 }}>
        {goals.length === 0 ? (
          <View style={R.empty}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🎯</Text>
            <Text style={[R.emptyTitle, { color: colors.textPrimary }]}>No goals yet</Text>
            <Text style={[R.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Create your first savings goal to start tracking your progress</Text>
            <TouchableOpacity onPress={() => { setEditGoal(null); setFormOpen(true); }} style={[R.createBtn, { backgroundColor: ACCENT }]}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={R.createBtnTxt}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              isDark={isDark}
              colors={colors}
              onContribute={(goal) => setContributeGoal(goal)}
              onEdit={(goal) => { setEditGoal(goal); setFormOpen(true); }}
              onDelete={handleDelete}
              fmt={fmt}
              currSym={currSym}
            />
          ))
        )}
      </ScrollView>

      {goals.length > 0 && (
        <TouchableOpacity
          onPress={() => { setEditGoal(null); setFormOpen(true); }}
          style={[R.fab, { backgroundColor: ACCENT }]}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <GoalFormSheet
        visible={formOpen}
        onClose={() => { setFormOpen(false); setEditGoal(null); }}
        onSave={handleSave}
        initial={editGoal}
        isDark={isDark}
        colors={colors}
        currSym={currSym}
      />
      <ContributeSheet
        visible={!!contributeGoal}
        goal={contributeGoal}
        onClose={() => setContributeGoal(null)}
        onSave={handleContribute}
        isDark={isDark}
        colors={colors}
      />
    </View>
  );
}

const G = StyleSheet.create({
  card:        { marginHorizontal: 16, marginTop: 14, padding: 16 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  emojiWrap:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 22 },
  goalName:    { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  deadline:    { fontSize: 11, fontWeight: '600' },
  ringPct:     { fontSize: 10, fontWeight: '800', marginTop: -2 },
  amtRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  savedLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3 },
  savedAmt:    { fontSize: 14, fontWeight: '800' },
  tipRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 10, marginBottom: 12 },
  tipTxt:      { fontSize: 12, fontWeight: '700', flex: 1 },
  actions:     { flexDirection: 'row', gap: 8 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 5 },
  actionTxt:   { fontSize: 12, fontWeight: '800' },
});

const F = StyleSheet.create({
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '90%' },
  handle:      { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 14 },
  title:       { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  label:       { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  inputWrap:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  input:       { fontSize: 14, fontWeight: '500', padding: 0 },
  amountWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14 },
  amountCurrency: { fontSize: 26, fontWeight: '800', marginRight: 4, color: ACCENT },
  amountInput: { flex: 1, fontSize: 26, fontWeight: '800', padding: 0 },
  emojiBtn:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  toggle:      { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  deadlinePickers: { marginBottom: 14 },
  monthBtn:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  monthTxt:    { fontSize: 13, fontWeight: '700' },
  yearRow:     { flexDirection: 'row', gap: 8, marginTop: 10 },
  yearBtn:     { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  yearTxt:     { fontSize: 13, fontWeight: '700' },
  btns:        { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 13 },
  btnTxt:      { fontSize: 14, fontWeight: '800' },
});

const R = StyleSheet.create({
  root:         { flex: 1 },
  hero:         { marginHorizontal: 16, marginTop: 14, padding: 18 },
  heroLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 14 },
  heroRow:      { flexDirection: 'row', alignItems: 'center' },
  heroStat:     { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider:  { width: 1, height: 32, borderRadius: 1 },
  heroVal:      { fontSize: 15, fontWeight: '800' },
  heroStatLabel:{ fontSize: 10, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center' },
  empty:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  emptySub:     { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  createBtn:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, gap: 8 },
  createBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  fab:          { position: 'absolute', bottom: 28, right: 22, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
});
