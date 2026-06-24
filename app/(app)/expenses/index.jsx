import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useExpensesStore } from '../../../src/stores/useExpensesStore';
import GlassCard from '../../../src/components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const ACCENT   = '#6C63FF';
const { width: SCREEN_W } = Dimensions.get('window');

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
const CAT_MAP = CATEGORIES.reduce((a, c) => { a[c.id] = c; return a; }, {});

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',  icon: 'phone-portrait' },
  { id: 'card', label: 'Card', icon: 'card'           },
  { id: 'cash', label: 'Cash', icon: 'cash'           },
  { id: 'bank', label: 'Bank', icon: 'business'       },
];

const TABS = ['Overview', 'Transactions', 'Budget', 'AI Advisor'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatCurrency = (n, cur = 'INR') => {
  const num = Number(n);
  if (cur === 'USD') return `$${num.toLocaleString('en-US')}`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const toDateStr  = (d) => { const n = d instanceof Date ? d : new Date(d); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; };
const parseDateStr = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

function dateLabel(dateStr) {
  const today     = new Date();
  const target    = parseDateStr(dateStr);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const sameDay   = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(target, today))     return 'Today';
  if (sameDay(target, yesterday)) return 'Yesterday';
  const diff = Math.floor((today - target) / 86400000);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  if (diff < 7) return days[target.getDay()];
  return `${target.getDate()} ${MONTHS_SHORT[target.getMonth()]}`;
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutSlicePath(cx, cy, oR, iR, sa, ea) {
  const la = ea - sa > 180 ? 1 : 0;
  const so = polarToCartesian(cx, cy, oR, sa), eo = polarToCartesian(cx, cy, oR, ea);
  const si = polarToCartesian(cx, cy, iR, ea), ei = polarToCartesian(cx, cy, iR, sa);
  return [`M ${so.x} ${so.y}`, `A ${oR} ${oR} 0 ${la} 1 ${eo.x} ${eo.y}`, `L ${si.x} ${si.y}`, `A ${iR} ${iR} 0 ${la} 0 ${ei.x} ${ei.y}`, 'Z'].join(' ');
}
function DonutChart({ data, size = 180, strokeRatio = 0.32 }) {
  const cx = size / 2, cy = size / 2;
  const oR = size / 2 - 4, iR = oR * (1 - strokeRatio);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return <Svg width={size} height={size}><Circle cx={cx} cy={cy} r={(oR + iR) / 2} stroke="#E5E7EB" strokeWidth={oR - iR} fill="none" /></Svg>;
  const active = data.filter((d) => d.value > 0);
  let angle = 0;
  const slices = active.length === 1
    ? [{ key: active[0].key, color: active[0].color, full: true }]
    : active.map((d) => {
        const sweep = (d.value / total) * 360;
        const s = angle + 1.1, e = angle + sweep - 1.1;
        angle += sweep;
        return { key: d.key, color: d.color, s, e };
      });
  return (
    <Svg width={size} height={size}>
      {slices.map((sl) => sl.full
        ? <Circle key={sl.key} cx={cx} cy={cy} r={(oR + iR) / 2} stroke={sl.color} strokeWidth={oR - iR} fill="none" />
        : <Path   key={sl.key} d={donutSlicePath(cx, cy, oR, iR, sl.s, sl.e)} fill={sl.color} />
      )}
    </Svg>
  );
}

// ── Small UI components ───────────────────────────────────────────────────────

function ProgressBar({ value, total, color, height = 8, bg }) {
  const pct = Math.min(100, total > 0 ? (value / total) * 100 : 0);
  return (
    <View style={{ width: '100%', backgroundColor: bg, height, borderRadius: height / 2, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

function CategoryIcon({ catId, size = 38 }) {
  const cat = CAT_MAP[catId] || CAT_MAP.others;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: cat.color + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={cat.icon} size={size * 0.48} color={cat.color} />
    </View>
  );
}

function WeeklyBarChart({ transactions, isDark }) {
  const today = new Date();
  const days  = useMemo(() => {
    const start = new Date(today); start.setDate(today.getDate() - 6);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const dStr  = toDateStr(d);
      const total = transactions.filter((t) => t.date === dStr && t.type !== 'income').reduce((s, t) => s + t.amount, 0);
      return { date: d, total, isToday: d.toDateString() === today.toDateString() };
    });
  }, [transactions]);
  const max    = Math.max(1, ...days.map((d) => d.total));
  const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, justifyContent: 'space-between' }}>
        {days.map((d, i) => {
          const h = Math.max(6, (d.total / max) * 90);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4, opacity: d.total > 0 ? 1 : 0 }}>
                {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total || ''}
              </Text>
              <View style={{ width: 22, height: h, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, backgroundColor: d.isToday ? ACCENT : isDark ? 'rgba(108,99,255,0.3)' : '#E0DEFF' }} />
              <Text style={{ fontSize: 11, marginTop: 8, fontWeight: d.isToday ? '800' : '600', color: d.isToday ? ACCENT : isDark ? '#9CA3AF' : '#6B7280' }}>
                {labels[d.date.getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}


// ── Expenses Bottom Nav ───────────────────────────────────────────────────────

const EXP_TABS = [
  { id: 'Overview',     label: 'Overview', icon: 'pie-chart-outline', iconOn: 'pie-chart'   },
  { id: 'Transactions', label: 'Txns',     icon: 'receipt-outline',   iconOn: 'receipt'     },
  { center: true },
  { id: 'Budget',       label: 'Budget',   icon: 'wallet-outline',    iconOn: 'wallet'      },
  { id: 'AI Advisor',   label: 'AI',       icon: 'sparkles-outline',  iconOn: 'sparkles'    },
];

function ExpensesBottomNav({ active, onChange, onAdd, isDark }) {
  const barBg = isDark ? 'rgba(14,10,30,0.82)' : 'rgba(255,255,255,0.82)';
  return (
    <View style={EN.shadow}>
      <View style={[EN.inner, { backgroundColor: Platform.OS !== 'ios' ? barBg : 'transparent' }]}>
        {Platform.OS === 'ios' && (
          <>
            <BlurView intensity={isDark ? 72 : 62} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(14,10,30,0.18)' : 'rgba(255,255,255,0.22)' }]} />
          </>
        )}
        {EXP_TABS.map((t, i) => {
          if (t.center) {
            return (
              <View key="fab" style={EN.fabWrap}>
                <TouchableOpacity onPress={onAdd} activeOpacity={0.85} style={[EN.fab, { backgroundColor: ACCENT }]}>
                  <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }
          const on = active === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => onChange(t.id)} activeOpacity={0.75} style={EN.item}>
              <View style={EN.itemInner}>
                <Ionicons name={on ? t.iconOn : t.icon} size={22} color={on ? ACCENT : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.32)'} />
                <Text style={[EN.lbl, { color: on ? ACCENT : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.32)', fontWeight: on ? '700' : '500' }]}>{t.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const EN = StyleSheet.create({
  shadow:    {},
  inner:     { flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingVertical: 6, paddingHorizontal: 4, paddingBottom: Platform.OS === 'ios' ? 18 : 6 },
  item:      { flex: 1, alignItems: 'center' },
  itemInner: { alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 10, minWidth: 60 },
  lbl:       { fontSize: 10.5, letterSpacing: 0.1 },
  fabWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab:       { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
               shadowColor: ACCENT, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
});

// ── Month Navigator ───────────────────────────────────────────────────────────

function MonthNavigator({ month, year, onPrev, onNext, isDark, colors }) {
  const now   = new Date();
  const isCur = month === now.getMonth() && year === now.getFullYear();
  return (
    <View style={MN.wrap}>
      <TouchableOpacity onPress={onPrev} style={MN.btn}>
        <Ionicons name="chevron-back" size={20} color={isDark ? '#E5E7EB' : '#374151'} />
      </TouchableOpacity>
      <View style={MN.center}>
        <Text style={[MN.month, { color: colors.textPrimary }]}>{MONTHS_FULL[month]} {year}</Text>
        {isCur && <View style={[MN.badge, { backgroundColor: ACCENT + '22' }]}><Text style={[MN.badgeTxt, { color: ACCENT }]}>This Month</Text></View>}
      </View>
      <TouchableOpacity onPress={onNext} disabled={isCur} style={[MN.btn, isCur && { opacity: 0.3 }]}>
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#E5E7EB' : '#374151'} />
      </TouchableOpacity>
    </View>
  );
}
const MN = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12 },
  btn:      { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  center:   { alignItems: 'center', flexDirection: 'row', gap: 8 },
  month:    { fontSize: 15, fontWeight: '800' },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

// ── Date Picker Modal ─────────────────────────────────────────────────────────

function daysInMonthFn(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOffset(y, m) { return new Date(y, m, 1).getDay(); }

function DatePickerModal({ visible, selected, onSelect, onClose, isDark, colors }) {
  const now = new Date();
  const [cy, setCy] = useState(selected?.year || now.getFullYear());
  const [cm, setCm] = useState(selected?.month || now.getMonth());

  useEffect(() => {
    if (visible && selected) { setCy(selected.year); setCm(selected.month); }
  }, [visible]);

  const days   = daysInMonthFn(cy, cm);
  const offset = firstDayOffset(cy, cm);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={DP.bg}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <GlassCard style={[DP.card, { backgroundColor: isDark ? '#1a1a2e' : '#FFF' }]}>
          <View style={DP.header}>
            <TouchableOpacity onPress={() => { if (cm === 0) { setCm(11); setCy((y) => y - 1); } else setCm((m) => m - 1); }} style={DP.navBtn}>
              <Ionicons name="chevron-back" size={18} color={ACCENT} />
            </TouchableOpacity>
            <Text style={[DP.monthLabel, { color: ACCENT }]}>{MONTHS_SHORT[cm]} {cy}</Text>
            <TouchableOpacity onPress={() => { if (cm === 11) { setCm(0); setCy((y) => y + 1); } else setCm((m) => m + 1); }} style={DP.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={ACCENT} />
            </TouchableOpacity>
          </View>
          <View style={DP.dayRow}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <Text key={i} style={[DP.dayLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{d}</Text>
            ))}
          </View>
          <View style={DP.grid}>
            {Array.from({ length: offset }).map((_, i) => <View key={`e${i}`} style={DP.cell} />)}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const isSel = selected?.year === cy && selected?.month === cm && selected?.date === d;
              const isT   = now.getFullYear() === cy && now.getMonth() === cm && now.getDate() === d;
              return (
                <TouchableOpacity key={d} style={DP.cell} onPress={() => onSelect({ year: cy, month: cm, date: d })} activeOpacity={0.7}>
                  <View style={[DP.dayCircle, isSel && { backgroundColor: ACCENT }, isT && !isSel && { borderWidth: 1.5, borderColor: ACCENT }]}>
                    <Text style={[DP.dayNum, { color: isSel ? '#fff' : isT ? ACCENT : isDark ? '#E5E7EB' : '#374151' }]}>{d}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
const DP = StyleSheet.create({
  bg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', paddingHorizontal: 20 },
  card:       { padding: 18 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn:     { padding: 6 },
  monthLabel: { fontSize: 14, fontWeight: '800' },
  dayRow:     { flexDirection: 'row', marginBottom: 6 },
  dayLabel:   { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  grid:       { flexDirection: 'row', flexWrap: 'wrap' },
  cell:       { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayCircle:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNum:     { fontSize: 13, fontWeight: '600' },
});

// ── Day Transaction Sheet ─────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function DayTransactionSheet({ visible, dateStr, transactions, onClose, isDark, colors }) {
  const currency = useExpensesStore((s) => s.currency);
  const fmt      = (n) => formatCurrency(n, currency);
  const slideAnim    = useRef(new Animated.Value(700)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 700, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  if (!dateStr) return null;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayTxs  = transactions.filter((t) => t.date === dateStr);
  const totalExp = dayTxs.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0);
  const totalInc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.58)', opacity: backdropAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
      </Animated.View>
      <Animated.View style={[DS.sheet, { backgroundColor: isDark ? '#1A1730' : '#fff', transform: [{ translateY: slideAnim }] }]}>
        <View style={DS.handle} />
        {/* Header */}
        <View style={DS.headerRow}>
          <View>
            <Text style={[DS.dayName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {DAY_NAMES[dateObj.getDay()]}
            </Text>
            <Text style={[DS.dateTitle, { color: colors.textPrimary }]}>
              {d} {MONTHS_FULL[m - 1]} {y}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={DS.closeBtn}>
            <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* Summary chips */}
        {dayTxs.length > 0 && (
          <View style={DS.summaryRow}>
            {totalExp > 0 && (
              <View style={[DS.chip, { backgroundColor: '#FF6B6B18' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FF6B6B' }}>-{fmt(totalExp)} spent</Text>
              </View>
            )}
            {totalInc > 0 && (
              <View style={[DS.chip, { backgroundColor: '#4CAF8218' }]}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#4CAF82' }}>+{fmt(totalInc)} income</Text>
              </View>
            )}
          </View>
        )}

        {/* List */}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {dayTxs.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
              <Ionicons name="receipt-outline" size={40} color={isDark ? '#374151' : '#D1D5DB'} />
              <Text style={{ fontSize: 14, color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '600' }}>No transactions this day</Text>
            </View>
          ) : (
            dayTxs.map((t, i) => {
              const cat = CATEGORIES.find((c) => c.id === t.category);
              const isInc = t.type === 'income';
              return (
                <TouchableOpacity key={t.id} onPress={() => { handleClose(); setTimeout(() => router.push(`/(app)/expenses/transaction/${t.id}`), 280); }} activeOpacity={0.75}>
                  <View style={[DS.txRow, i < dayTxs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
                    <CategoryIcon catId={t.category} size={42} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{t.description}</Text>
                      <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                        {cat?.label ?? t.category} · {t.method?.toUpperCase() ?? 'CASH'}
                        {t.recurring ? ' · ↻' : ''}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: isInc ? '#4CAF82' : '#FF6B6B' }}>
                      {isInc ? '+' : '-'}{fmt(t.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
const DS = StyleSheet.create({
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, maxHeight: '75%' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 14 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dayName:    { fontSize: 12, fontWeight: '600' },
  dateTitle:  { fontSize: 18, fontWeight: '800', marginTop: 2 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  txRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
});

// ── Spending Calendar ─────────────────────────────────────────────────────────

function SpendingCalendar({ transactions, month, year, onPrevMonth, onNextMonth, onDayPress }) {
  const { isDark, radius } = useTheme();
  const currency  = useExpensesStore((s) => s.currency);
  const sym       = currency === 'USD' ? '$' : '₹';
  const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const dayData = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const d = parseDateStr(t.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      const day = d.getDate();
      if (!map[day]) map[day] = { expense: 0, income: 0 };
      if (t.type === 'income') map[day].income += t.amount;
      else                     map[day].expense += t.amount;
    });
    return map;
  }, [transactions, month, year]);

  const maxExpense  = Math.max(1, ...Object.values(dayData).map((d) => d.expense));
  const totalMonthExp = Object.values(dayData).reduce((s, d) => s + (d.expense || 0), 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawFirst    = new Date(year, month, 1).getDay();
  const offset      = (rawFirst + 6) % 7;

  const today      = new Date();
  const isCurMonth = today.getMonth() === month && today.getFullYear() === year;
  const todayDate  = today.getDate();

  function heatBg(day) {
    const exp = dayData[day]?.expense || 0;
    if (exp === 0) return null;
    const pct = exp / maxExpense;
    if (pct < 0.22) return isDark ? 'rgba(72,199,142,0.32)' : 'rgba(72,199,142,0.22)';
    if (pct < 0.46) return isDark ? 'rgba(255,179,71,0.48)'  : 'rgba(255,179,71,0.36)';
    if (pct < 0.73) return isDark ? 'rgba(255,107,107,0.58)' : 'rgba(255,107,107,0.44)';
    return              isDark ? 'rgba(108,99,255,0.72)'  : 'rgba(108,99,255,0.58)';
  }

  function amtTextColor() {
    return isDark ? '#E5E7EB' : '#111827';
  }

  function fmtShort(n) {
    if (currency === 'USD') {
      if (n >= 1e6) return `${sym}${(n/1e6).toFixed(1)}M`;
      if (n >= 1e3) return `${sym}${Math.round(n/1000)}K`;
      return `${sym}${Math.round(n)}`;
    }
    if (n >= 1e7) return `${sym}${(n/1e7).toFixed(1)}Cr`;
    if (n >= 1e5) return `${sym}${(n/1e5).toFixed(1)}L`;
    if (n >= 1e4) return `${sym}${Math.round(n/1000)}K`;
    if (n >= 1e3) return `${sym}${(n/1000).toFixed(1)}K`;
    return `${sym}${Math.round(n)}`;
  }

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={SC.wrapper}>
    <GlassCard style={SC.card}>

      {/* ── Header ── */}
      <View style={SC.header}>
        <TouchableOpacity onPress={onPrevMonth} style={SC.navBtn}>
          <Ionicons name="chevron-back" size={17} color={isDark ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[SC.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>{MONTHS_FULL[month]} {year}</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: totalMonthExp > 0 ? (isDark ? '#A78BFA' : ACCENT) : (isDark ? '#4B5563' : '#D1D5DB'), marginTop: 1 }}>
            {totalMonthExp > 0 ? `${fmtShort(totalMonthExp)} spent` : 'No spend recorded'}
          </Text>
        </View>
        <TouchableOpacity onPress={onNextMonth} disabled={isCurMonth} style={[SC.navBtn, isCurMonth && { opacity: 0.25 }]}>
          <Ionicons name="chevron-forward" size={17} color={isDark ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* ── Day headers ── */}
      <View style={SC.weekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={[SC.dayLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{d}</Text>
        ))}
      </View>

      {/* ── Hairline divider ── */}
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#EBEBF5', marginHorizontal: 8, marginBottom: 6 }} />

      {/* ── Grid ── */}
      <View style={SC.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={SC.cellWrap} />;

          const isToday  = isCurMonth && day === todayDate;
          const isFuture = isCurMonth && day > todayDate;
          const data     = dayData[day];
          const heat     = heatBg(day);
          const expAmt   = data?.expense || 0;
          const incAmt   = data?.income  || 0;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <TouchableOpacity
              key={day}
              style={SC.cellWrap}
              activeOpacity={0.75}
              onPress={() => onDayPress && onDayPress(dateStr)}
            >
              <View
                style={[
                  SC.cell,
                  { borderRadius: Math.max(7, radius - 2) },
                  heat && { backgroundColor: heat },
                  !heat && { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : '#F3F2FA' },
                  isToday && { borderWidth: 1.5, borderColor: ACCENT },
                  isFuture && { opacity: 0.3 },
                ]}
              >
                <Text style={[SC.cellDay, {
                  color: isToday ? ACCENT : (heat ? amtTextColor() : (isDark ? '#C4C9D4' : '#374151')),
                  fontWeight: isToday ? '800' : heat ? '700' : '500',
                }]}>
                  {day}
                </Text>
                {expAmt > 0 && (
                  <Text style={[SC.cellAmt, { color: amtTextColor() }]}>{fmtShort(expAmt)}</Text>
                )}
                {incAmt > 0 && (
                  <View style={SC.incDot} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Legend ── */}
      <View style={SC.legend}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={[SC.legendDot, { backgroundColor: '#4CAF82' }]} />
          <Text style={[SC.legendTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Income</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[SC.legendTxt, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Low</Text>
          {['rgba(72,199,142,0.65)','rgba(255,179,71,0.72)','rgba(255,107,107,0.78)','rgba(108,99,255,0.88)'].map((c, i) => (
            <View key={i} style={{ width: 14, height: 6, borderRadius: 3, backgroundColor: c }} />
          ))}
          <Text style={[SC.legendTxt, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>High</Text>
        </View>
      </View>
    </GlassCard>
    </View>
  );
}

const SC = StyleSheet.create({
  wrapper:   { marginHorizontal: 16, marginTop: 14 },
  card:      { padding: 0 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingTop: 14, paddingBottom: 10 },
  navBtn:    { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 15, fontWeight: '800' },
  weekRow:   { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 4 },
  dayLabel:  { flex: 1, textAlign: 'center', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6, paddingBottom: 6 },
  cellWrap:  { width: '14.28%', padding: 2 },
  cell:      { height: 34, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  cellDay:   { fontSize: 12, fontWeight: '600', lineHeight: 15 },
  cellAmt:   { fontSize: 8, fontWeight: '800', marginTop: 1 },
  incDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4CAF82', marginTop: 2 },
  legend:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 10 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendTxt: { fontSize: 9, fontWeight: '600' },
});

// ── Cashflow Projection Chart ─────────────────────────────────────────────────

function CashflowProjection({ transactions, isDark, colors }) {
  const currency  = useExpensesStore((s) => s.currency);
  const [horizon, setHorizon] = useState(6);
  const [chartW,  setChartW]  = useState(300);

  const HORIZONS = [1, 2, 3, 6, 12];
  const CH  = 170;
  const PAD = { t: 16, r: 14, b: 40, l: 52 };

  const income  = useMemo(() => transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const spent   = useMemo(() => transactions.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const moNet   = income - spent;

  const data = useMemo(() =>
    Array.from({ length: horizon + 1 }, (_, i) => moNet * i),
    [horizon, moNet]
  );

  const now = new Date();
  const xLabels = useMemo(() =>
    Array.from({ length: horizon + 1 }, (_, i) =>
      i === 0 ? 'Now' : MONTHS_SHORT[(now.getMonth() + i) % 12]
    ), [horizon]
  );

  const maxVal  = Math.max(...data, 1);
  const minVal  = Math.min(...data, 0);
  const range   = maxVal - minVal || 1;
  const innerW  = chartW - PAD.l - PAD.r;
  const innerH  = CH - PAD.t - PAD.b;
  const xOf = (i) => PAD.l + (i / Math.max(1, horizon)) * innerW;
  const yOf = (v) => PAD.t + innerH - ((v - minVal) / range) * innerH;
  const pts     = data.map((v, i) => ({ x: xOf(i), y: yOf(v) }));

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cpX = ((p.x + c.x) / 2).toFixed(1);
    linePath += ` C ${cpX} ${p.y.toFixed(1)} ${cpX} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  const base = yOf(0);
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${base.toFixed(1)} L ${pts[0].x.toFixed(1)} ${base.toFixed(1)} Z`;

  const sym    = currency === 'USD' ? '$' : '₹';
  const fmtAx  = (v) => {
    const a = Math.abs(v);
    if (currency === 'USD') {
      if (a >= 1e6) return `${sym}${(v / 1e6).toFixed(1)}M`;
      if (a >= 1e3) return `${sym}${(v / 1e3).toFixed(0)}K`;
      return `${sym}${v}`;
    }
    if (a >= 1e7) return `${sym}${(v / 1e7).toFixed(1)}Cr`;
    if (a >= 1e5) return `${sym}${(v / 1e5).toFixed(0)}L`;
    if (a >= 1e3) return `${sym}${(v / 1e3).toFixed(0)}K`;
    return `${sym}${v}`;
  };
  const yTicks     = [0, 0.5, 1].map((r) => Math.round(minVal + r * range));
  const projFinal  = data[data.length - 1];
  const fmt        = (n) => formatCurrency(n, currency);
  const xTickIdxs  = [0, Math.floor(horizon / 2), horizon];
  const cardBg     = isDark ? (colors.card || '#1E1B2E') : '#fff';

  return (
    <View style={OV.sectionWrap}>
      <GlassCard style={OV.section}>
        {/* Header + horizon picker */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <View>
            <Text style={[OV.sectionTitle, { color: isDark ? '#9CA3AF' : '#9198A8', marginBottom: 2 }]}>Cash Flow Projection</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280' }}>Based on this month's net</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, maxWidth: 150, justifyContent: 'flex-end' }}>
            {HORIZONS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHorizon(h)}
                style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6,
                  backgroundColor: horizon === h ? ACCENT : (isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF') }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: horizon === h ? '#fff' : (isDark ? '#9CA3AF' : ACCENT) }}>
                  {h === 12 ? '1Y' : `${h}M`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SVG Chart */}
        <View onLayout={(e) => setChartW(e.nativeEvent.layout.width)}>
          <Svg width={chartW} height={CH}>
            <Defs>
              <SvgGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ACCENT} stopOpacity="0.32" />
                <Stop offset="1" stopColor={ACCENT} stopOpacity="0.02" />
              </SvgGradient>
            </Defs>

            {yTicks.map((v, i) => (
              <React.Fragment key={`yt${i}`}>
                <SvgLine
                  x1={PAD.l} y1={yOf(v)} x2={chartW - PAD.r} y2={yOf(v)}
                  stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth={1} strokeDasharray={i > 0 ? '3,4' : ''}
                />
                <SvgText x={PAD.l - 5} y={yOf(v) + 3.5} textAnchor="end"
                  fontSize="9" fontWeight="600" fill={isDark ? '#6B7280' : '#9CA3AF'}>
                  {fmtAx(v)}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Dashed "Now" line */}
            <SvgLine x1={pts[0].x} y1={PAD.t - 6} x2={pts[0].x} y2={CH - PAD.b + 4}
              stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4,4" />

            <Path d={areaPath} fill="url(#projGrad)" />
            <Path d={linePath} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            <Circle cx={pts[0].x} cy={pts[0].y} r={5} fill={cardBg} stroke={ACCENT} strokeWidth={2} />
            <Circle cx={last.x}   cy={last.y}   r={5} fill={cardBg} stroke={ACCENT} strokeWidth={2} />

            {xTickIdxs.map((i) => (
              <SvgText key={`xl${i}`} x={xOf(i)} y={CH - PAD.b + 18} textAnchor="middle"
                fontSize="9" fontWeight="600" fill={isDark ? '#9CA3AF' : '#6B7280'}>
                {xLabels[i]}
              </SvgText>
            ))}
          </Svg>
        </View>

        {/* Bottom stats row */}
        <View style={{ flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', paddingTop: 12, marginTop: 4 }}>
          {[
            { label: 'NOW',                                              val: fmt(0),         color: colors.textPrimary },
            { label: `IN ${horizon === 12 ? '1Y' : horizon + 'MO'}`,    val: fmt(projFinal), color: colors.textPrimary },
            { label: 'CHANGE', val: `${projFinal >= 0 ? '+' : ''}${fmt(projFinal)}`, color: projFinal >= 0 ? '#4CAF82' : '#FF6B6B' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />}
              <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.8, color: isDark ? '#6B7280' : '#9CA3AF' }}>{s.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: s.color }}>{s.val}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 10, padding: 8, borderRadius: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F7FF' }}>
          <Ionicons name="information-circle-outline" size={13} color={isDark ? '#6B7280' : '#9CA3AF'} style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', flex: 1, lineHeight: 15 }}>
            Projection based on this month's cash flow only. Actual results may vary.
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function relDate(dateStr) {
  const d = parseDateStr(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dd = new Date(d); dd.setHours(0, 0, 0, 0);
  const diff = Math.round((today - dd) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function OverviewTab({ transactions, budgets, month, year, onAskAI, onSwitchTab, onPrevMonth, onNextMonth, isDark, colors }) {
  const { radius } = useTheme();
  const currency = useExpensesStore((s) => s.currency);
  const fmt = (n) => formatCurrency(n, currency);
  const [daySheet, setDaySheet]     = useState(null); // dateStr or null
  const expenses = useMemo(() => transactions.filter((t) => t.type !== 'income'), [transactions]);
  const income   = useMemo(() => transactions.filter((t) => t.type === 'income'), [transactions]);

  const totalSpent  = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);
  const remaining   = Math.max(0, totalBudget - totalSpent);
  const net         = totalIncome - totalSpent;

  const byCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.id] = 0));
    expenses.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [expenses]);

  const now       = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6);
  const thisWeek  = useMemo(() => expenses.filter((t) => parseDateStr(t.date) >= weekStart).reduce((s, t) => s + t.amount, 0), [expenses]);
  const dates     = new Set(expenses.map((t) => t.date));
  const avgPerDay = expenses.length > 0 ? Math.round(totalSpent / Math.max(1, dates.size)) : 0;

  const topCats = useMemo(() =>
    CATEGORIES.map((c) => ({ ...c, spent: byCategory[c.id] || 0, budget: budgets[c.id] || 0 }))
      .filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 4),
    [byCategory, budgets]
  );

  const insight = useMemo(() => {
    const over = CATEGORIES.filter((c) => (byCategory[c.id] || 0) > (budgets[c.id] || 0));
    if (over.length > 0) return `Over budget on ${over[0].label} by ${fmt((byCategory[over[0].id] || 0) - (budgets[over[0].id] || 0))}`;
    if (topCats[0] && totalBudget > 0) {
      const pct = Math.round((topCats[0].spent / totalBudget) * 100);
      return `${topCats[0].label} is ${pct}% of your total budget this month.`;
    }
    return 'Add transactions to unlock personalized insights.';
  }, [byCategory, budgets, topCats, totalBudget]);

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: totalBudget > 0 ? Math.min(1, totalSpent / totalBudget) : 0, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [totalSpent, totalBudget]);
  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const pct = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const barColor = pct > 0.85 ? '#FF6B6B' : pct > 0.6 ? '#FFB347' : '#A8EDEA';

  return (
  <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>

      {/* ── Liquid Glass Hero ── */}
      <View style={[OV.hero, { borderRadius: radius + 4 }]}>
        {Platform.OS === 'ios' && (
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={['rgba(100,85,255,0.85)', 'rgba(38,18,100,0.94)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* glass top highlight */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.32)' }} />

        <View style={OV.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={OV.monthChip}>
              <Text style={OV.monthChipTxt}>{MONTHS_SHORT[month].toUpperCase()} {year}</Text>
            </View>
            <Text style={OV.heroLabel}>TOTAL SPENT</Text>
            <Text style={OV.heroAmt}>{fmt(totalSpent)}</Text>
            <Text style={OV.heroBudgetTxt}>of {fmt(totalBudget)} budget</Text>
          </View>
          <View style={OV.heroRight}>
            <Text style={OV.heroRightPct}>{Math.round(pct * 100)}%</Text>
            <Text style={OV.heroRightLabel}>used</Text>
          </View>
        </View>

        <View style={OV.progressTrack}>
          <Animated.View style={[OV.progressFill, { width: widthInterp, backgroundColor: barColor }]} />
        </View>
        <View style={OV.progressMeta}>
          <Text style={OV.progressTxt}>{fmt(remaining)} left</Text>
          <Text style={OV.progressTxt}>{totalBudget > 0 ? Math.round(pct * 100) : 0}% of budget</Text>
        </View>

        <View style={OV.divider} />

        <View style={OV.statsRow}>
          {[
            { val: fmt(remaining), label: 'Remaining', color: '#A8EDEA' },
            { val: fmt(thisWeek),  label: 'This Week',  color: '#FCD9A5' },
            { val: fmt(avgPerDay), label: 'Avg / Day',  color: '#F9A8D4' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={OV.statDiv} />}
              <View style={OV.stat}>
                <Text style={[OV.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={OV.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Spending Calendar ── */}
      <SpendingCalendar
        transactions={transactions}
        month={month}
        year={year}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onDayPress={(d) => setDaySheet(d)}
      />

      {/* ── This Week bar chart ── */}
      <View style={OV.sectionWrap}>
        <GlassCard style={OV.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={[OV.sectionTitle, { color: isDark ? '#9CA3AF' : '#9198A8' }]}>This Week</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>{fmt(thisWeek)}</Text>
          </View>
          <WeeklyBarChart transactions={transactions} isDark={isDark} />
        </GlassCard>
      </View>

      {/* ── Top Spending ── */}
      {topCats.length > 0 && (
        <>
          <View style={OV.sectionWrap}>
            <GlassCard style={OV.section}>
              <Text style={[OV.sectionTitle, { color: isDark ? '#9CA3AF' : '#9198A8' }]}>Top Spending</Text>
              {topCats.slice(0, 3).map((c, i) => (
                <View key={c.id} style={[OV.listRow, i < Math.min(topCats.length, 3) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <CategoryIcon catId={c.id} size={40} />
                  <Text style={[OV.listName, { color: colors.textPrimary }]}>{c.label}</Text>
                  <Text style={[OV.listAmt, { color: colors.textPrimary }]}>{fmt(c.spent)}</Text>
                </View>
              ))}
              <TouchableOpacity onPress={() => onSwitchTab('Transactions')} style={OV.seeAllBtn} activeOpacity={0.7}>
                <Text style={[OV.seeAllTxt, { color: ACCENT }]}>See all spending</Text>
                <Ionicons name="chevron-forward" size={13} color={ACCENT} />
              </TouchableOpacity>
            </GlassCard>
          </View>
        </>
      )}

      {/* ── Recent Activity ── */}
      {(() => {
        const recent = [...transactions].sort((a, b) => parseDateStr(b.date) - parseDateStr(a.date)).slice(0, 3);
        if (recent.length === 0) return null;
        return (
          <>
            <View style={OV.sectionWrap}>
              <GlassCard style={OV.section}>
                <Text style={[OV.sectionTitle, { color: isDark ? '#9CA3AF' : '#9198A8' }]}>Recent Activity</Text>
                {recent.map((t, i) => {
                  const cat = CATEGORIES.find((c) => c.id === t.category);
                  const isInc = t.type === 'income';
                  return (
                    <View key={t.id} style={[OV.listRow, i < recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                      <CategoryIcon catId={t.category} size={40} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{t.description}</Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>{relDate(t.date)} · {cat?.label ?? t.category}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: isInc ? '#4CAF82' : colors.textPrimary }}>
                        {isInc ? '+' : '-'}{fmt(t.amount)}
                      </Text>
                    </View>
                  );
                })}
                <TouchableOpacity onPress={() => onSwitchTab('Transactions')} style={OV.seeAllBtn} activeOpacity={0.7}>
                  <Text style={[OV.seeAllTxt, { color: ACCENT }]}>See all activity</Text>
                  <Ionicons name="chevron-forward" size={13} color={ACCENT} />
                </TouchableOpacity>
              </GlassCard>
            </View>
          </>
        );
      })()}

      {/* ── Recurring & Subscriptions ── */}
      {(() => {
        const recurring = transactions.filter((t) => t.recurring);
        if (recurring.length === 0) return null;
        return (
          <>
            <View style={OV.sectionWrap}>
              <GlassCard style={OV.section}>
                <Text style={[OV.sectionTitle, { color: isDark ? '#9CA3AF' : '#9198A8' }]}>Recurring & Subscriptions</Text>
                {recurring.slice(0, 4).map((t, i) => {
                  const cat = CATEGORIES.find((c) => c.id === t.category);
                  return (
                    <View key={t.id} style={[OV.listRow, i < Math.min(recurring.length, 4) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                      <CategoryIcon catId={t.category} size={40} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{t.description}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                          <View style={{ backgroundColor: ACCENT + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: ACCENT, letterSpacing: 0.3 }}>{(t.recurringInterval || 'monthly').toUpperCase()}</Text>
                          </View>
                          <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280' }}>{cat?.label ?? t.category}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF6B6B' }}>-{fmt(t.amount)}</Text>
                    </View>
                  );
                })}
                {recurring.length > 4 && (
                  <TouchableOpacity onPress={() => onSwitchTab('Transactions')} style={OV.seeAllBtn} activeOpacity={0.7}>
                    <Text style={[OV.seeAllTxt, { color: ACCENT }]}>See all {recurring.length} subscriptions</Text>
                    <Ionicons name="chevron-forward" size={13} color={ACCENT} />
                  </TouchableOpacity>
                )}
              </GlassCard>
            </View>
          </>
        );
      })()}

      {/* ── Reports / Goals CTAs ── */}
      <View style={OV.ctaRow}>
        <TouchableOpacity onPress={() => router.push('/(app)/expenses/reports')} activeOpacity={0.85} style={[OV.ctaLeft, { borderRadius: radius }]}>
          <LinearGradient colors={['#7B6CFF', '#5A4BCC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={OV.ctaGrad}>
            <Ionicons name="bar-chart" size={24} color="#fff" />
            <Text style={OV.ctaTitle}>Reports</Text>
            <Text style={OV.ctaSub}>Analytics & trends</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/expenses/goals')} activeOpacity={0.85} style={[OV.ctaRight, { borderRadius: radius }]}>
          <LinearGradient colors={['#3DB87A', '#1E7A52']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={OV.ctaGrad}>
            <Ionicons name="trophy" size={24} color="#fff" />
            <Text style={OV.ctaTitle}>Goals</Text>
            <Text style={OV.ctaSub}>Savings tracker</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Weekday Spending Pattern ── */}
      {/* ── Cashflow Projection ── */}
      <CashflowProjection transactions={transactions} isDark={isDark} colors={colors} />

      {/* ── AI Insight ── */}
      <View style={OV.insightWrap}>
        <GlassCard style={[OV.insight, { borderLeftWidth: 3, borderLeftColor: ACCENT }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: ACCENT + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={15} color={ACCENT} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '800', flex: 1, color: colors.textPrimary }}>AI Insight</Text>
          </View>
          <Text style={{ fontSize: 13, lineHeight: 19, marginBottom: 10, color: isDark ? '#D6D1FF' : '#4B4570' }}>{insight}</Text>
          <TouchableOpacity onPress={onAskAI} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: ACCENT }}>Ask AI Advisor</Text>
            <Ionicons name="arrow-forward" size={13} color={ACCENT} />
          </TouchableOpacity>
        </GlassCard>
      </View>

    </ScrollView>

    {/* ── Day Transaction Sheet ── */}
    <DayTransactionSheet
      visible={!!daySheet}
      dateStr={daySheet}
      transactions={transactions}
      onClose={() => setDaySheet(null)}
      isDark={isDark}
      colors={colors}
    />
  </>
  );
}

const OV = StyleSheet.create({
  hero:         { marginHorizontal: 16, marginTop: 10, padding: 20, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.22)' },
  heroRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  monthChip:    { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 10 },
  monthChipTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#fff' },
  heroLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  heroAmt:      { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroBudgetTxt:{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  heroRight:    { alignItems: 'center', justifyContent: 'center', width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 12, marginTop: 4 },
  heroRightPct: { fontSize: 18, fontWeight: '900', color: '#fff' },
  heroRightLabel:{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  progressTrack:{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  progressTxt:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  statsRow:     { flexDirection: 'row', alignItems: 'center' },
  stat:         { flex: 1, alignItems: 'center', gap: 3 },
  statDiv:      { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  statVal:      { fontSize: 14, fontWeight: '800' },
  statLabel:    { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  flowRow:      { flexDirection: 'row', marginHorizontal: 12, marginTop: 14, gap: 8 },
  flowCard:     { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  flowIcon:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  flowLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  flowVal:      { fontSize: 13, fontWeight: '800' },
  sectionWrap:  { marginHorizontal: 16, marginTop: 20 },
  section:      { padding: 16 },
  insightWrap:  { marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 12 },
  catRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  ctaRow:       { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, gap: 10 },
  ctaLeft:      { flex: 1, borderRadius: 18, overflow: 'hidden' },
  ctaRight:     { flex: 1, borderRadius: 18, overflow: 'hidden' },
  ctaGrad:      { padding: 18, gap: 4 },
  ctaTitle:     { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 8 },
  ctaSub:       { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  insight:      { padding: 16 },
  sectionHeader:{ fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 20, marginTop: 22, marginBottom: 10 },
  listHdr:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 20, marginTop: 12, marginBottom: 6 },
  listRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  listName:     { flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 12 },
  listAmt:      { fontSize: 15, fontWeight: '800' },
  seeAllBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 12, gap: 3 },
  seeAllTxt:    { fontSize: 13, fontWeight: '700' },
  miniGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, gap: 10 },
  miniCard:     { width: '46%', flexGrow: 1, padding: 14, gap: 4 },
  miniIconBox:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  miniVal:      { fontSize: 16, fontWeight: '800' },
  miniLabel:    { fontSize: 11, fontWeight: '700' },
  miniSub:      { fontSize: 10, fontWeight: '500' },
});

// ── Transactions Tab ──────────────────────────────────────────────────────────

function TransactionsTab({ transactions, onDelete, isDark, colors }) {
  const currency = useExpensesStore((s) => s.currency);
  const fmt = (n) => formatCurrency(n, currency);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = useMemo(() =>
    transactions
      .filter((t) => filterCat === 'all' ? true : t.category === filterCat)
      .filter((t) => search ? t.description.toLowerCase().includes(search.toLowerCase()) : true)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, search, filterCat]
  );

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => { if (!map[t.date]) map[t.date] = []; map[t.date].push(t); });
    return Object.keys(map).sort((a, b) => b.localeCompare(a)).map((k) => ({ date: k, items: map[k] }));
  }, [filtered]);

  const total = useMemo(() => filtered.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0), [filtered]);

  return (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={{ marginHorizontal: 16, marginTop: 12 }}>
        <GlassCard style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
          <Ionicons name="search" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search transactions" placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'} style={{ flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 2, color: colors.textPrimary }} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} /></TouchableOpacity>}
        </GlassCard>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
        <TouchableOpacity onPress={() => setFilterCat('all')} style={[TX.chip, { backgroundColor: filterCat === 'all' ? ACCENT : isDark ? 'rgba(108,99,255,0.18)' : '#F0EEFF' }]}>
          <Text style={[TX.chipTxt, { color: filterCat === 'all' ? '#fff' : ACCENT }]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((c) => {
          const active = filterCat === c.id;
          return (
            <TouchableOpacity key={c.id} onPress={() => setFilterCat(c.id)} style={[TX.chip, { backgroundColor: active ? c.color : isDark ? c.color + '22' : c.color + '18' }]}>
              <Ionicons name={c.icon} size={13} color={active ? '#fff' : c.color} />
              <Text style={[TX.chipTxt, { color: active ? '#fff' : c.color, marginLeft: 4 }]}>{c.label.split(' ')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <View style={TX.empty}>
            <View style={[TX.emptyIcon, { backgroundColor: ACCENT + '15' }]}><Ionicons name="receipt-outline" size={40} color={ACCENT} /></View>
            <Text style={[TX.emptyTitle, { color: colors.textPrimary }]}>No transactions</Text>
            <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', marginTop: 4 }}>
              {search || filterCat !== 'all' ? 'Try adjusting your filters' : 'Tap + to record your first expense'}
            </Text>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.date} style={{ marginHorizontal: 16, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: isDark ? '#9CA3AF' : '#6B7280' }}>{dateLabel(g.date)}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  {fmt(g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0))}
                </Text>
              </View>
              <GlassCard style={{ padding: 4 }}>
                {g.items.map((t, idx) => {
                  const cat = CAT_MAP[t.category] || CAT_MAP.others;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => router.push(`/(app)/expenses/transaction/${t.id}`)}
                      activeOpacity={0.7}
                      style={[TX.row, idx < g.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                      <CategoryIcon catId={t.category} size={38} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{t.description}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '500', color: isDark ? '#9CA3AF' : '#6B7280' }}>{cat.label}</Text>
                          {t.recurring && <View style={{ backgroundColor: ACCENT + '20', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}><Text style={{ fontSize: 9, fontWeight: '700', color: ACCENT }}>RECURRING</Text></View>}
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '800', marginRight: 6, color: t.type === 'income' ? '#4CAF82' : colors.textPrimary }}>
                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                      </Text>
                      <Ionicons name="chevron-forward" size={15} color={isDark ? '#6B7280' : '#D1D5DB'} />
                    </TouchableOpacity>
                  );
                })}
              </GlassCard>
            </View>
          ))
        )}

        {filtered.length > 0 && (
          <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF' }}>{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: total >= 0 ? '#4CAF82' : '#FF6B6B' }}>{total >= 0 ? '+' : ''}{fmt(total)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
const TX = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, marginRight: 8 },
  chipTxt:   { fontSize: 12, fontWeight: '700' },
  row:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle:{ fontSize: 17, fontWeight: '800', marginBottom: 6 },
});

// ── Budget Tab ────────────────────────────────────────────────────────────────

// ── Month Picker Sheet ────────────────────────────────────────────────────────

function MonthPickerSheet({ visible, month, year, onSelect, onClose, isDark, colors }) {
  const { radius } = useTheme();
  const [pickYear, setPickYear] = useState(year);
  const now = new Date();
  const MLBL = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => { if (visible) setPickYear(year); }, [visible, year]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
        <View style={[MP.sheet, { backgroundColor: isDark ? '#1B1730' : '#FFFFFF', borderTopLeftRadius: radius + 8, borderTopRightRadius: radius + 8 }]}>
          <View style={MP.handle} />
          <Text style={[MP.title, { color: colors.textPrimary }]}>Select Month</Text>

          {/* Year navigation */}
          <View style={MP.yearRow}>
            <TouchableOpacity onPress={() => setPickYear((y) => y - 1)} style={[MP.yearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F3FA' }]}>
              <Ionicons name="chevron-back" size={16} color={ACCENT} />
            </TouchableOpacity>
            <Text style={[MP.yearLbl, { color: colors.textPrimary }]}>{pickYear}</Text>
            <TouchableOpacity
              onPress={() => setPickYear((y) => Math.min(now.getFullYear(), y + 1))}
              disabled={pickYear >= now.getFullYear()}
              style={[MP.yearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F3FA' }, pickYear >= now.getFullYear() && { opacity: 0.25 }]}
            >
              <Ionicons name="chevron-forward" size={16} color={ACCENT} />
            </TouchableOpacity>
          </View>

          {/* Month grid — 4 per row */}
          <View style={MP.grid}>
            {MLBL.map((m, idx) => {
              const isSelected = idx === month && pickYear === year;
              const isFuture   = pickYear > now.getFullYear() || (pickYear === now.getFullYear() && idx > now.getMonth());
              return (
                <TouchableOpacity
                  key={m}
                  disabled={isFuture}
                  onPress={() => { onSelect(idx, pickYear); onClose(); }}
                  style={[MP.monthBtn, { backgroundColor: isSelected ? ACCENT : isDark ? 'rgba(255,255,255,0.07)' : '#F4F3FA', opacity: isFuture ? 0.28 : 1 }]}
                >
                  <Text style={{ fontSize: 13, fontWeight: isSelected ? '800' : '600', color: isSelected ? '#fff' : colors.textPrimary }}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: Platform.OS === 'ios' ? 24 : 12 }} />
        </View>
      </View>
    </Modal>
  );
}
const MP = StyleSheet.create({
  sheet:    { paddingHorizontal: 20, paddingTop: 12 },
  handle:   { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', marginBottom: 16 },
  title:    { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  yearRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  yearBtn:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  yearLbl:  { fontSize: 20, fontWeight: '800' },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  monthBtn: { width: '23%', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
});

// ── Budget Tab ────────────────────────────────────────────────────────────────

function BudgetTab({ transactions, budgets, onUpdateBudget, month, year, onChangeMonth, isDark, colors }) {
  const currency = useExpensesStore((s) => s.currency);
  const fmt      = (n) => formatCurrency(n, currency);
  const currSym  = currency === 'USD' ? '$' : '₹';
  const { radius } = useTheme();
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const byCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.id] = 0));
    transactions.filter((t) => t.type !== 'income').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [transactions]);

  const totalSpent  = useMemo(() => Object.values(byCategory).reduce((s, v) => s + v, 0), [byCategory]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);

  const [editVals, setEditVals] = useState(() => {
    const v = {};
    CATEGORIES.forEach((c) => { v[c.id] = String(budgets[c.id] || 0); });
    return v;
  });
  const [savingCat, setSavingCat] = useState(null);
  const [savedCat,  setSavedCat]  = useState(null);

  useEffect(() => {
    setEditVals((prev) => {
      const next = { ...prev };
      CATEGORIES.forEach((c) => { next[c.id] = String(budgets[c.id] || 0); });
      return next;
    });
  }, [budgets]);

  const handleBlur = useCallback(async (catId) => {
    const v   = parseInt(editVals[catId], 10);
    const cur = budgets[catId] || 0;
    if (isNaN(v) || v < 0 || v === cur) return;
    setSavingCat(catId);
    try {
      await onUpdateBudget(catId, v);
      setSavedCat(catId);
      setTimeout(() => setSavedCat(null), 1800);
    } catch {
      setEditVals((prev) => ({ ...prev, [catId]: String(cur) }));
    }
    setSavingCat(null);
  }, [editVals, budgets, onUpdateBudget]);

  const expCats  = CATEGORIES.filter((c) => ['food','transport','shopping','entertainment','health','education','bills','others'].includes(c.id));
  const onTrack  = expCats.filter((c) => (byCategory[c.id] || 0) <= (budgets[c.id] || 0)).length;
  const totalPct = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const barColor = (pct) => pct > 85 ? '#FF6B6B' : pct > 60 ? '#FFB347' : '#4CAF82';

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#F2F1F8' }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

      <LinearGradient colors={['#7B6CFF', '#3D2F9E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[BG.hero, { borderRadius: radius + 4 }]}>
        {/* Calendar month picker button */}
        <TouchableOpacity
          onPress={() => setMonthPickerOpen(true)}
          style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={17} color="#fff" />
        </TouchableOpacity>

        <View style={{ marginBottom: 2 }}>
          <Text style={BG.heroLabel}>MONTHLY BUDGET OVERVIEW</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
            {MONTHS_FULL[month]} {year}
          </Text>
        </View>
        <View style={BG.heroAmtRow}>
          <Text style={BG.heroSpent}>{fmt(totalSpent)}</Text>
          <Text style={BG.heroBudgetOf}> / {fmt(totalBudget)}</Text>
        </View>
        <View style={BG.progressTrack}>
          <View style={[BG.progressFill, { width: `${Math.min(100, totalPct * 100)}%`, backgroundColor: totalPct > 0.85 ? '#FF6B6B' : totalPct > 0.6 ? '#FFB347' : '#A8EDEA' }]} />
        </View>
        <View style={BG.progressMeta}>
          <Text style={BG.progressTxt}>{Math.round(totalPct * 100)}% used</Text>
          <Text style={BG.progressTxt}>{fmt(Math.max(0, totalBudget - totalSpent))} remaining</Text>
        </View>
        <View style={BG.divider} />
        <View style={BG.statsRow}>
          {[
            { val: `${onTrack}/${expCats.length}`, label: 'On Track',     color: '#A8EDEA' },
            { val: `${Math.round((onTrack / Math.max(1, expCats.length)) * 100)}%`, label: 'Health Score', color: '#F9A8D4' },
            { val: fmt(Math.max(0, totalBudget - totalSpent)), label: 'Available',  color: '#FCD9A5' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={BG.statDiv} />}
              <View style={BG.stat}>
                <Text style={[BG.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={BG.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: 20, marginTop: 18, marginBottom: 2 }}>
        CATEGORY BUDGETS · TAP AMOUNT TO EDIT
      </Text>

      {expCats.map((c) => {
        const spent    = byCategory[c.id] || 0;
        const budgeted = parseInt(editVals[c.id], 10) || 0;
        const pct      = budgeted > 0 ? (spent / budgeted) * 100 : 0;
        const bColor   = barColor(pct);
        const gradColors = bColor === '#4CAF82'
          ? ['#56D49A', '#4CAF82']
          : bColor === '#FFB347'
            ? ['#FFD068', '#FFB347']
            : ['#FF8A8A', '#FF6B6B'];

        return (
          <View key={c.id} style={BG.cardWrap}>
          <GlassCard style={[BG.card, { borderRadius: radius }]}>
            {/* ── Row 1: icon · name · % chip · edit ── */}
            <View style={BG.r1}>
              <View style={[BG.iconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F6' }]}>
                <Ionicons name={c.icon} size={15} color={isDark ? '#D1D5DB' : '#4B5563'} />
              </View>
              <Text style={[BG.catName, { color: colors.textPrimary }]} numberOfLines={1}>{c.label}</Text>
              <View style={[BG.pctChip, { backgroundColor: bColor + '28' }]}>
                <Text style={{ fontSize: 9, fontWeight: '900', color: bColor, letterSpacing: 0.3 }}>{pct.toFixed(0)}%</Text>
              </View>
              <View style={[BG.editField, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F8', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#DDDDEF' }]}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', marginRight: 1 }}>{currSym}</Text>
                <TextInput
                  value={editVals[c.id]}
                  onChangeText={(v) => setEditVals((prev) => ({ ...prev, [c.id]: v }))}
                  onBlur={() => handleBlur(c.id)}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  style={{ fontSize: 12, fontWeight: '800', color: colors.textPrimary, minWidth: 44, padding: 0 }}
                />
              </View>
              {savingCat === c.id
                ? <ActivityIndicator size="small" color={ACCENT} style={{ marginLeft: 4 }} />
                : savedCat === c.id
                  ? <Ionicons name="checkmark-circle" size={14} color="#4CAF82" style={{ marginLeft: 4 }} />
                  : null}
            </View>

            {/* ── Row 2: gradient progress bar ── */}
            <View style={[BG.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#EAEBF2' }]}>
              {pct > 0 && (
                <LinearGradient
                  colors={gradColors}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[BG.barFill, { width: `${Math.min(100, pct)}%` }]}
                />
              )}
            </View>

            {/* ── Row 3: 3-col stats ── */}
            <View style={[BG.r3, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : '#EAEAF2' }]}>
              {[
                { label: 'Spent',     val: fmt(spent),                      color: spent > 0 ? '#FF6B6B' : (isDark ? '#4B5563' : '#9CA3AF') },
                { label: 'Remaining', val: fmt(Math.max(0, budgeted - spent)), color: spent > budgeted ? '#FF6B6B' : '#4CAF82' },
                { label: 'Budget',    val: fmt(budgeted),                    color: colors.textPrimary },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={[BG.r3div, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E5EF' }]} />}
                  <View style={BG.r3stat}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: s.color }}>{s.val}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 1 }}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </GlassCard>
          </View>
        );
      })}
    </ScrollView>

    <MonthPickerSheet
      visible={monthPickerOpen}
      month={month ?? new Date().getMonth()}
      year={year ?? new Date().getFullYear()}
      onSelect={(m, y) => onChangeMonth && onChangeMonth(m, y)}
      onClose={() => setMonthPickerOpen(false)}
      isDark={isDark}
      colors={colors}
    />
    </>
  );
}

const BG = StyleSheet.create({
  hero:         { marginHorizontal: 16, marginTop: 16, padding: 20 },
  heroLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  heroAmtRow:   { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  heroSpent:    { fontSize: 30, fontWeight: '800', color: '#fff' },
  heroBudgetOf: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginBottom: 3 },
  progressTrack:{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressTxt:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 },
  statsRow:     { flexDirection: 'row', alignItems: 'center' },
  stat:         { flex: 1, alignItems: 'center', gap: 3 },
  statDiv:      { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 },
  statVal:      { fontSize: 14, fontWeight: '800' },
  statLabel:    { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  cardWrap: { marginHorizontal: 16, marginTop: 18 },
  card:     { padding: 14 },
  r1:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catName:  { flex: 1, fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },
  pctChip:  { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  editField:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  barTrack: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },
  r3:       { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth },
  r3div:    { width: 1, height: 22, marginHorizontal: 4 },
  r3stat:   { flex: 1, alignItems: 'center', gap: 2 },
});

// ── AI Advisor Tab (unchanged logic, updated look) ────────────────────────────

const SUGGESTION_CHIPS = [
  { icon: 'flame-outline',            color: '#FF6B6B', text: 'Where am I overspending this month?' },
  { icon: 'trending-up-outline',      color: '#4CAF82', text: "What's my savings rate this month?" },
  { icon: 'restaurant-outline',       color: '#FFB347', text: 'How can I cut my food & dining costs?' },
  { icon: 'repeat-outline',           color: ACCENT,    text: 'Which subscriptions should I cancel?' },
  { icon: 'calendar-outline',         color: '#45B7D1', text: 'Give me a budget plan for next month' },
  { icon: 'bar-chart-outline',        color: '#A29BFE', text: 'Compare my expenses to last month' },
  { icon: 'car-outline',              color: '#4ECDC4', text: 'Tips to reduce my transport spend' },
  { icon: 'shield-checkmark-outline', color: '#4CAF82', text: 'Am I on track with my budget goals?' },
];

// mock — replace with real API call to /ai/expenses-advisor once backend is wired
async function callAIBackend(userMessages, financialContext) {
  await new Promise((r) => setTimeout(r, 1200)); // simulate network
  const last = userMessages[userMessages.length - 1]?.content?.toLowerCase() || '';
  if (last.includes('oversp') || last.includes('where'))
    return `Based on your data, ${financialContext.topCat} is your biggest spend at ${financialContext.topAmt}. Try setting a stricter budget for it and review weekly.`;
  if (last.includes('saving') || last.includes('rate'))
    return `Your net this month is ${financialContext.net}. Aim to save at least 20% of income — that's ${financialContext.savingsTarget}/month for you.`;
  if (last.includes('food') || last.includes('dining') || last.includes('cut'))
    return `Meal prepping 3 days a week can cut food costs by 25–30%. Also try avoiding food delivery apps on weekdays — they add 30–40% markup.`;
  if (last.includes('subscri') || last.includes('cancel'))
    return `Review recurring transactions in your Expenses screen. Cancel anything you haven't used in the last 30 days — small subscriptions add up to thousands per year.`;
  if (last.includes('budget') || last.includes('plan'))
    return `For next month: allocate 50% to needs, 30% to wants, 20% to savings. Based on your ${financialContext.totalBudget} total budget, that's roughly ${financialContext.savings20} to savings.`;
  if (last.includes('compare') || last.includes('last month'))
    return `I can only see this month's data right now. Once more months are tracked, I'll give you a full trend comparison. Keep logging daily!`;
  if (last.includes('transport') || last.includes('travel'))
    return `Consider carpooling, monthly transit passes, or switching to a two-wheeler for short trips — can save ₹1,500–₹3,000/month in metros.`;
  if (last.includes('track') || last.includes('goal'))
    return `You've used ${financialContext.pctUsed}% of your total budget. ${financialContext.pctUsed < 80 ? "You're on track! Keep it up." : "You're close to your limit — review discretionary spending this week."}`;
  return `Great question! Based on your spending of ${financialContext.topAmt} in ${financialContext.topCat}, I recommend reviewing your budget allocations. Would you like specific tips for any category?`;
}

function AIAdvisorTab({ transactions, budgets, isDark, colors }) {
  const currency  = useExpensesStore((s) => s.currency);
  const fmt       = (n) => formatCurrency(n, currency);

  // token balance — default 15 free tokens; in production this comes from the backend/user profile
  const [tokens,   setTokens]   = useState(15);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const scrollRef = useRef(null);

  // build financial context for the mock AI
  const financialContext = useMemo(() => {
    const expenses   = transactions.filter((t) => t.type !== 'income');
    const incArr     = transactions.filter((t) => t.type === 'income');
    const byCat      = {};
    CATEGORIES.forEach((c) => (byCat[c.id] = 0));
    expenses.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
    const totalSpent  = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome = incArr.reduce((s, t) => s + t.amount, 0);
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    const topEntry    = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const topCat      = topEntry ? (CATEGORIES.find((c) => c.id === topEntry[0])?.label ?? topEntry[0]) : 'Unknown';
    const topAmt      = topEntry ? fmt(topEntry[1]) : fmt(0);
    const net         = fmt(totalIncome - totalSpent);
    const pctUsed     = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const savingsTarget = fmt(Math.round(totalIncome * 0.2));
    const savings20   = fmt(Math.round(totalBudget * 0.2));
    return { topCat, topAmt, net, pctUsed, savingsTarget, savings20, totalBudget: fmt(totalBudget) };
  }, [transactions, budgets]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading || tokens <= 0) return;
    const userMsg = { role: 'user', content: text.trim(), id: Date.now().toString() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setTokens((t) => Math.max(0, t - 1));
    try {
      // TODO: replace with real api.post('/ai/expenses-advisor', { messages: newMsgs, context: financialContext })
      const reply = await callAIBackend(newMsgs, financialContext);
      setMessages((m) => [...m, { role: 'assistant', content: reply, id: Date.now() + 'a' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.', id: Date.now() + 'n', error: true }]);
      setTokens((t) => t + 1); // refund on error
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading, tokens, financialContext]);

  const handleRequestTokens = () => {
    Alert.alert(
      'Request More Tokens',
      'Your request will be sent to the admin. You will be notified once tokens are added to your account.',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Send Request', onPress: () => Alert.alert('Request Sent', 'We\'ll review and add tokens within 24 hours.') }]
    );
  };

  const tokenColor = tokens > 5 ? '#4CAF82' : tokens > 2 ? '#FFB347' : '#FF6B6B';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>

      {/* ── Header bar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEE' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {messages.length > 0 && (
            <TouchableOpacity onPress={() => setMessages([])} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F4F3FA' }}>
              <Ionicons name="arrow-back" size={18} color={isDark ? '#E5E7EB' : '#374151'} />
            </TouchableOpacity>
          )}
          {messages.length === 0 && (
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={16} color={ACCENT} />
            </View>
          )}
          <View>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>AI Financial Advisor</Text>
            <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280' }}>Personalised to your spending</Text>
          </View>
        </View>
        {/* Token badge */}
        <TouchableOpacity onPress={handleRequestTokens} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: tokenColor + '18', borderWidth: 1, borderColor: tokenColor + '40' }}>
          <Ionicons name="flash" size={12} color={tokenColor} />
          <Text style={{ fontSize: 12, fontWeight: '800', color: tokenColor }}>{tokens}</Text>
          <Text style={{ fontSize: 10, fontWeight: '600', color: tokenColor }}>tokens</Text>
        </TouchableOpacity>
      </View>

      {/* ── Out of tokens banner ── */}
      {tokens === 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 14, backgroundColor: '#FF6B6B18', borderWidth: 1, borderColor: '#FF6B6B40', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="flash-off-outline" size={20} color="#FF6B6B" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF6B6B' }}>Out of tokens</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>Request more from admin to continue chatting.</Text>
          </View>
          <TouchableOpacity onPress={handleRequestTokens} style={{ backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Messages / Suggestions ── */}
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>

        {messages.length === 0 && (
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: 12 }}>SUGGESTED QUESTIONS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {SUGGESTION_CHIPS.map((s) => (
                <TouchableOpacity
                  key={s.text}
                  onPress={() => tokens > 0 ? sendMessage(s.text) : handleRequestTokens()}
                  activeOpacity={0.75}
                  style={{ width: '47.5%', flexGrow: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 14, padding: 14, gap: 10,
                    shadowColor: '#4A5B8A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0 : 0.10, shadowRadius: 8, elevation: isDark ? 0 : 4,
                    borderWidth: isDark ? 0.5 : 0, borderColor: 'rgba(255,255,255,0.1)',
                    opacity: tokens === 0 ? 0.45 : 1 }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: s.color + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={s.icon} size={16} color={s.color} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '600', lineHeight: 17, color: colors.textPrimary }}>{s.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Low token warning */}
            {tokens > 0 && tokens <= 5 && (
              <TouchableOpacity onPress={handleRequestTokens} activeOpacity={0.8}
                style={{ marginTop: 16, borderRadius: 12, padding: 12, backgroundColor: '#FFB34718', borderWidth: 1, borderColor: '#FFB34740', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning-outline" size={16} color="#FFB347" />
                <Text style={{ flex: 1, fontSize: 12, color: '#FFB347', fontWeight: '600' }}>Only {tokens} token{tokens !== 1 ? 's' : ''} left — tap to request more</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFB347" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {messages.map((m) => (
          <View key={m.id} style={{ marginVertical: 6, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: 4 }}>
                <Ionicons name="sparkles" size={11} color={ACCENT} />
                <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.3, color: isDark ? '#9CA3AF' : '#6B7280' }}>AI Advisor</Text>
              </View>
            )}
            <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '88%',
              backgroundColor: m.role === 'user' ? ACCENT : m.error ? '#FF6B6B22' : isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF',
              borderBottomRightRadius: m.role === 'user' ? 4 : 18, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18 }}>
              <Text style={{ fontSize: 14, lineHeight: 20, fontWeight: '500', color: m.role === 'user' ? '#fff' : m.error ? '#FF6B6B' : colors.textPrimary }}>{m.content}</Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={{ marginVertical: 6, alignItems: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: 4 }}>
              <Ionicons name="sparkles" size={11} color={ACCENT} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>AI Advisor</Text>
            </View>
            <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>Analysing your finances…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8, borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEE', backgroundColor: isDark ? '#0D0B1A' : '#fff' }}>
        <View style={{ flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120, justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF', opacity: tokens === 0 ? 0.5 : 1 }}>
          <TextInput
            value={input} onChangeText={setInput}
            placeholder={tokens === 0 ? 'No tokens remaining…' : 'Ask about your spending...'}
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            editable={tokens > 0}
            style={{ fontSize: 14, fontWeight: '500', padding: 0, maxHeight: 100, color: colors.textPrimary }}
            multiline maxLength={500}
          />
        </View>
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading || tokens <= 0}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: input.trim() && !loading && tokens > 0 ? ACCENT : ACCENT + '44' }}>
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Add Expense Sheet ─────────────────────────────────────────────────────────

function AddExpenseSheet({ visible, onClose, onSave, isDark, colors }) {
  const { radius } = useTheme();
  const currency    = useExpensesStore((s) => s.currency);
  const currSym     = currency === 'USD' ? '$' : '₹';
  const slideAnim   = useRef(new Animated.Value(650)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [amount,    setAmount]    = useState('');
  const [desc,      setDesc]      = useState('');
  const [type,      setType]      = useState('expense');
  const [category,  setCategory]  = useState('food');
  const [method,    setMethod]    = useState('upi');
  const [recurring, setRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [notes,     setNotes]     = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const now = new Date();
  const [selDate, setSelDate] = useState({ year: now.getFullYear(), month: now.getMonth(), date: now.getDate() });

  // Animate open/close
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(650);
      backdropAnim.setValue(0);
      setAmount(''); setDesc(''); setType('expense'); setCategory('food');
      setMethod('upi'); setRecurring(false); setNotes('');
      const n = new Date();
      setSelDate({ year: n.getFullYear(), month: n.getMonth(), date: n.getDate() });
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 650, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  }, [onClose]);

  const formatDate = () => `${selDate.date} ${MONTHS_SHORT[selDate.month]} ${selDate.year}`;

  const handleSave = useCallback(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount', 'Enter a valid amount.'); return; }
    if (!desc.trim()) { Alert.alert('Missing description', 'Add a short description.'); return; }
    const d = new Date(selDate.year, selDate.month, selDate.date);
    onSave({
      amount: amt, type, category, description: desc.trim(),
      date: d.toISOString(), method, notes: notes.trim(),
      recurring, recurringInterval: recurring ? recurringInterval : null,
    });
    handleClose();
  }, [amount, desc, type, category, selDate, method, notes, recurring, recurringInterval, onSave, handleClose]);

  const accentColor = type === 'income' ? '#4CAF82' : '#FF6B6B';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>

      {/* ── Dark backdrop ── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.62)', opacity: backdropAnim }]}>
        <TouchableOpacity activeOpacity={1} onPress={handleClose} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      {/* ── Sliding sheet ── */}
      <KeyboardAvoidingView
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[AS.sheet, {
            backgroundColor: isDark ? '#16132A' : '#FFFFFF',
            borderTopLeftRadius: radius + 8,
            borderTopRightRadius: radius + 8,
            transform: [{ translateY: slideAnim }],
          }]}
        >
          {/* Handle + header */}
          <View style={AS.handle} />
          <View style={AS.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[AS.title, { color: colors.textPrimary }]}>New Transaction</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>{formatDate()}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={[AS.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F4F3FA' }]}>
              <Ionicons name="close" size={18} color={isDark ? '#D1D5DB' : '#4B5563'} />
            </TouchableOpacity>
          </View>

          {/* Type tabs */}
          <View style={[AS.typeTabs, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA' }]}>
            {[{ id: 'expense', label: 'Expense', icon: 'arrow-down-circle-outline', color: '#FF6B6B' },
              { id: 'income',  label: 'Income',  icon: 'arrow-up-circle-outline',   color: '#4CAF82' }].map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setType(t.id)} style={[AS.typeTab, type === t.id && { backgroundColor: t.color }]}>
                <Ionicons name={t.icon} size={15} color={type === t.id ? '#fff' : isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: type === t.id ? '#fff' : isDark ? '#9CA3AF' : '#6B7280', marginLeft: 5 }}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>

            {/* Amount */}
            <View style={[AS.amountBox, { backgroundColor: accentColor + '18', borderColor: accentColor + '44', borderWidth: 1 }]}>
              <Text style={[AS.amountPrefix, { color: accentColor }]}>{currSym}</Text>
              <TextInput
                value={amount} onChangeText={setAmount}
                placeholder="0.00" keyboardType="decimal-pad"
                placeholderTextColor={accentColor + '60'}
                style={[AS.amountInput, { color: accentColor }]}
                autoFocus
              />
            </View>

            {/* Description */}
            <Text style={[AS.lbl, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DESCRIPTION</Text>
            <View style={[AS.fieldBox, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA' }]}>
              <TextInput value={desc} onChangeText={setDesc} placeholder="What was it for?" returnKeyType="next" placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} style={[AS.fieldInput, { color: colors.textPrimary }]} />
            </View>

            {/* Category grid */}
            <Text style={[AS.lbl, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>CATEGORY</Text>
            <View style={AS.catGrid}>
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <TouchableOpacity key={c.id} onPress={() => setCategory(c.id)} style={[AS.catCell, { backgroundColor: active ? c.color : isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA' }]} activeOpacity={0.7}>
                    <View style={[AS.catIconCircle, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : c.color + '22' }]}>
                      <Ionicons name={c.icon} size={18} color={active ? '#fff' : c.color} />
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#fff' : colors.textPrimary, marginTop: 5, textAlign: 'center' }} numberOfLines={1}>
                      {c.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment method */}
            <Text style={[AS.lbl, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>PAYMENT</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
              {PAYMENT_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <TouchableOpacity key={m.id} onPress={() => setMethod(m.id)} style={[AS.methodChip, { backgroundColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA', borderColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF' }]}>
                    <Ionicons name={m.icon} size={13} color={active ? '#fff' : ACCENT} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : colors.textPrimary, marginLeft: 4 }}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date + Recurring row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => setDatePickerOpen(true)} style={[AS.dateChip, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF' }]}>
                <Ionicons name="calendar-outline" size={14} color={ACCENT} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>{formatDate()}</Text>
                <Ionicons name="chevron-down" size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRecurring(!recurring)} style={[AS.dateChip, { backgroundColor: recurring ? ACCENT + '22' : isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA', borderColor: recurring ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF' }]}>
                <Ionicons name="repeat-outline" size={14} color={recurring ? ACCENT : isDark ? '#9CA3AF' : '#6B7280'} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: recurring ? ACCENT : colors.textPrimary }}>Recurring</Text>
              </TouchableOpacity>
            </View>

            {recurring && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {['weekly','monthly','yearly'].map((iv) => (
                  <TouchableOpacity key={iv} onPress={() => setRecurringInterval(iv)} style={[AS.methodChip, { backgroundColor: recurringInterval === iv ? ACCENT : isDark ? 'rgba(255,255,255,0.06)' : '#F4F3FA', borderColor: recurringInterval === iv ? ACCENT : isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF' }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: recurringInterval === iv ? '#fff' : ACCENT }}>{iv.charAt(0).toUpperCase() + iv.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Notes */}
            <Text style={[AS.lbl, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>NOTES (OPTIONAL)</Text>
            <View style={[AS.fieldBox, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E0EF', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA' }]}>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Add a note..." placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'} multiline numberOfLines={2} style={[AS.fieldInput, { color: colors.textPrimary, minHeight: 36 }]} />
            </View>

          </ScrollView>

          {/* Action bar */}
          <View style={[AS.actionBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : '#EDEEF5', paddingBottom: Platform.OS === 'ios' ? 28 : 14 }]}>
            <TouchableOpacity onPress={handleClose} style={[AS.cancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: ACCENT }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[AS.saveBtn, { backgroundColor: accentColor }]}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginLeft: 6 }}>Save {type === 'income' ? 'Income' : 'Expense'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={datePickerOpen}
        selected={selDate}
        onSelect={(d) => { setSelDate(d); setDatePickerOpen(false); }}
        onClose={() => setDatePickerOpen(false)}
        isDark={isDark}
        colors={colors}
      />
    </Modal>
  );
}
const AS = StyleSheet.create({
  sheet:       { paddingTop: 10 },
  handle:      { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF', marginBottom: 14 },
  headerRow:   { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, marginBottom: 14 },
  title:       { fontSize: 19, fontWeight: '800' },
  closeBtn:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  typeTabs:    { flexDirection: 'row', borderRadius: 14, padding: 4, marginHorizontal: 18, marginBottom: 16 },
  typeTab:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11 },
  amountBox:   { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 16 },
  amountPrefix:{ fontSize: 30, fontWeight: '800', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 30, fontWeight: '800', padding: 0 },
  lbl:         { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  fieldBox:    { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 14 },
  fieldInput:  { fontSize: 13, fontWeight: '500', padding: 0 },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  catCell:     { width: '23%', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 8 },
  catIconCircle:{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  methodChip:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  dateChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  actionBar:   { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  cancelBtn:   { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtn:     { flex: 2, flexDirection: 'row', paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ExpensesScreen() {
  const { colors, isDark }   = useTheme();
  const {
    transactions, budgets, loading,
    selectedMonth, selectedYear,
    setMonth, fetchTransactions, fetchBudgets, fetchGoals,
    createTransaction, upsertBudget,
  } = useExpensesStore();

  const [activeTab, setActiveTab] = useState('Overview');
  const [addOpen,   setAddOpen]   = useState(false);

  useEffect(() => {
    const now = new Date();
    fetchTransactions(now.getMonth(), now.getFullYear());
    fetchBudgets(now.getMonth(), now.getFullYear());
    fetchGoals();
  }, []);

  const handlePrevMonth = useCallback(() => {
    let m = selectedMonth - 1, y = selectedYear;
    if (m < 0) { m = 11; y -= 1; }
    setMonth(m, y);
  }, [selectedMonth, selectedYear, setMonth]);

  const handleNextMonth = useCallback(() => {
    const now = new Date();
    if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) return;
    let m = selectedMonth + 1, y = selectedYear;
    if (m > 11) { m = 0; y += 1; }
    setMonth(m, y);
  }, [selectedMonth, selectedYear, setMonth]);

  const handleAdd = useCallback(async (dto) => {
    try { await createTransaction(dto); }
    catch { Alert.alert('Error', 'Could not save transaction.'); }
  }, [createTransaction]);

  const handleDeleteTx = useCallback(async (id) => {
    const { deleteTransaction } = useExpensesStore.getState();
    try { await deleteTransaction(id); }
    catch { Alert.alert('Error', 'Could not delete transaction.'); }
  }, []);

  const handleUpdateBudget = useCallback(async (catId, value) => {
    try { await upsertBudget(catId, value); }
    catch { Alert.alert('Error', 'Could not update budget.'); }
  }, [upsertBudget]);

  return (
    <View style={{ flex: 1 }}>
      {loading && activeTab === 'Overview' && (
        <View style={{ position: 'absolute', top: 30, alignSelf: 'center', zIndex: 10 }}>
          <ActivityIndicator color={ACCENT} />
        </View>
      )}

      {activeTab === 'Overview' && (
        <OverviewTab transactions={transactions} budgets={budgets} month={selectedMonth} year={selectedYear} onAskAI={() => setActiveTab('AI Advisor')} onSwitchTab={(tab) => setActiveTab(tab)} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} isDark={isDark} colors={colors} />
      )}
      {activeTab === 'Transactions' && (
        <TransactionsTab transactions={transactions} onDelete={handleDeleteTx} isDark={isDark} colors={colors} />
      )}
      {activeTab === 'Budget' && (
        <BudgetTab transactions={transactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} month={selectedMonth} year={selectedYear} onChangeMonth={(m, y) => setMonth(m, y)} isDark={isDark} colors={colors} />
      )}
      {activeTab === 'AI Advisor' && (
        <AIAdvisorTab transactions={transactions} budgets={budgets} isDark={isDark} colors={colors} />
      )}

      <ExpensesBottomNav active={activeTab} onChange={setActiveTab} onAdd={() => setAddOpen(true)} isDark={isDark} />
      <AddExpenseSheet visible={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} isDark={isDark} colors={colors} />
    </View>
  );
}
