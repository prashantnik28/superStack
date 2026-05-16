import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';
const TODAY = '2026-05-16';

const CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'transport', label: 'Transport', icon: 'car', color: '#4ECDC4' },
  { id: 'shopping', label: 'Shopping', icon: 'bag', color: '#45B7D1' },
  { id: 'entertainment', label: 'Entertainment', icon: 'game-controller', color: '#96CEB4' },
  { id: 'health', label: 'Health', icon: 'medical', color: '#FF9FF3' },
  { id: 'education', label: 'Education', icon: 'school', color: '#A29BFE' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt', color: '#FD79A8' },
  { id: 'others', label: 'Others', icon: 'ellipsis-horizontal', color: '#B2BEC3' },
];

const CAT_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {});

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'phone-portrait' },
  { id: 'card', label: 'Card', icon: 'card' },
  { id: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'bank', label: 'Bank', icon: 'business' },
];

const INITIAL_EXPENSES = [
  { id: '1', amount: 450, category: 'food', description: 'Cafe lunch', date: '2026-05-16', method: 'upi' },
  { id: '2', amount: 1200, category: 'shopping', description: 'Zara – clothes', date: '2026-05-15', method: 'card' },
  { id: '3', amount: 80, category: 'transport', description: 'Ola ride', date: '2026-05-15', method: 'upi' },
  { id: '4', amount: 2500, category: 'bills', description: 'Electricity bill', date: '2026-05-14', method: 'bank' },
  { id: '5', amount: 599, category: 'entertainment', description: 'Netflix subscription', date: '2026-05-13', method: 'card' },
  { id: '6', amount: 1800, category: 'food', description: 'BigBasket groceries', date: '2026-05-12', method: 'upi' },
  { id: '7', amount: 320, category: 'health', description: 'Apollo pharmacy', date: '2026-05-11', method: 'card' },
  { id: '8', amount: 500, category: 'food', description: 'Swiggy dinner', date: '2026-05-10', method: 'upi' },
  { id: '9', amount: 1499, category: 'education', description: 'Coursera course', date: '2026-05-09', method: 'card' },
  { id: '10', amount: 890, category: 'shopping', description: 'Amazon delivery', date: '2026-05-08', method: 'card' },
  { id: '11', amount: 850, category: 'transport', description: 'Fuel – car', date: '2026-05-07', method: 'cash' },
  { id: '12', amount: 3200, category: 'health', description: 'Dental checkup', date: '2026-05-06', method: 'card' },
  { id: '13', amount: 650, category: 'food', description: 'Restaurant dinner', date: '2026-05-05', method: 'card' },
  { id: '14', amount: 1200, category: 'bills', description: 'Internet broadband', date: '2026-05-04', method: 'bank' },
  { id: '15', amount: 450, category: 'entertainment', description: 'BookMyShow movies', date: '2026-05-03', method: 'upi' },
];

const INITIAL_BUDGETS = {
  food: 8000,
  transport: 3000,
  shopping: 5000,
  entertainment: 2000,
  health: 5000,
  education: 3000,
  bills: 5000,
  others: 2000,
};

const TABS = ['Overview', 'Transactions', 'Budget', 'AI Advisor'];

const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dateLabel = (dateStr) => {
  const today = parseDate(TODAY);
  const target = parseDate(dateStr);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(target, today)) return 'Today';
  if (sameDay(target, yesterday)) return 'Yesterday';
  const diff = Math.floor((today - target) / (1000 * 60 * 60 * 24));
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  if (diff < 7) return weekdays[target.getDay()];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${target.getDate()} ${months[target.getMonth()]}`;
};

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(cx, cy, outerR, innerR, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const so = polarToCartesian(cx, cy, outerR, startAngle);
  const eo = polarToCartesian(cx, cy, outerR, endAngle);
  const si = polarToCartesian(cx, cy, innerR, endAngle);
  const ei = polarToCartesian(cx, cy, innerR, startAngle);
  return [
    `M ${so.x} ${so.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${eo.x} ${eo.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
}

function DonutChart({ data, size = 180, strokeRatio = 0.32 }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * (1 - strokeRatio);
  const total = data.reduce((s, d) => s + d.value, 0);
  const GAP = 2.2;

  const slices = useMemo(() => {
    if (total <= 0) return [];
    const active = data.filter((d) => d.value > 0);
    if (active.length === 1) {
      return [{ key: active[0].key, color: active[0].color, full: true }];
    }
    let angle = 0;
    return active.map((d) => {
      const sweep = (d.value / total) * 360;
      const start = angle + GAP / 2;
      const end = angle + sweep - GAP / 2;
      angle += sweep;
      return { key: d.key, color: d.color, start, end };
    });
  }, [data, total]);

  return (
    <Svg width={size} height={size}>
      {slices.length === 0 && (
        <Circle cx={cx} cy={cy} r={(outerR + innerR) / 2} stroke="#E5E7EB" strokeWidth={outerR - innerR} fill="none" />
      )}
      {slices.map((s) =>
        s.full ? (
          <Circle key={s.key} cx={cx} cy={cy} r={(outerR + innerR) / 2} stroke={s.color} strokeWidth={outerR - innerR} fill="none" />
        ) : (
          <Path key={s.key} d={donutSlicePath(cx, cy, outerR, innerR, s.start, s.end)} fill={s.color} />
        )
      )}
    </Svg>
  );
}

const donutStyles = StyleSheet.create({});

function ProgressBar({ value, total, color, height = 8, bg }) {
  const pct = Math.min(100, total > 0 ? (value / total) * 100 : 0);
  return (
    <View style={[pbStyles.track, { backgroundColor: bg, height, borderRadius: height / 2 }]}>
      <View style={[pbStyles.fill, { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const pbStyles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});

function StatChip({ label, value, color, isDark }) {
  return (
    <GlassCard style={[chipStyles.card, { backgroundColor: isDark ? undefined : '#FFFFFF' }]}>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={[chipStyles.label, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label}</Text>
    </GlassCard>
  );
}

const chipStyles = StyleSheet.create({
  card: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', marginHorizontal: 4 },
  value: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
});

function CategoryIcon({ catId, size = 38 }) {
  const cat = CAT_MAP[catId] || CAT_MAP.others;
  return (
    <View style={[catIconStyles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: cat.color + '22' }]}>
      <Ionicons name={cat.icon} size={size * 0.5} color={cat.color} />
    </View>
  );
}

const catIconStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});

function WeeklyBarChart({ expenses, isDark }) {
  const today = parseDate(TODAY);
  const days = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const total = expenses
        .filter((e) => sameDay(parseDate(e.date), d))
        .reduce((s, e) => s + e.amount, 0);
      arr.push({ date: d, total, isToday: sameDay(d, today) });
    }
    return arr;
  }, [expenses]);

  const max = Math.max(1, ...days.map((d) => d.total));
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={wbStyles.wrap}>
      <View style={wbStyles.barsRow}>
        {days.map((d, i) => {
          const h = Math.max(6, (d.total / max) * 90);
          return (
            <View key={i} style={wbStyles.barCol}>
              <Text style={[wbStyles.amt, { color: isDark ? '#9CA3AF' : '#6B7280', opacity: d.total > 0 ? 1 : 0 }]}>
                {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}
              </Text>
              <View style={[wbStyles.bar, { height: h, backgroundColor: d.isToday ? ACCENT : isDark ? 'rgba(108,99,255,0.3)' : '#E0DEFF' }]} />
              <Text style={[wbStyles.dayLabel, { color: d.isToday ? ACCENT : isDark ? '#9CA3AF' : '#6B7280', fontWeight: d.isToday ? '800' : '600' }]}>
                {labels[d.date.getDay()]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const wbStyles = StyleSheet.create({
  wrap: { marginTop: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center' },
  amt: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  bar: { width: 22, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  dayLabel: { fontSize: 11, marginTop: 8 },
});

function FAB({ onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
      style={fabStyles.wrap}>
      <Animated.View style={[fabStyles.btn, { transform: [{ scale }] }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const fabStyles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 28, right: 22 },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
});

function TabsBar({ active, onChange, isDark }) {
  return (
    <View style={[tabsStyles.wrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF' }]}>
      {TABS.map((t) => {
        const isActive = active === t;
        return (
          <TouchableOpacity key={t} onPress={() => onChange(t)} activeOpacity={0.8} style={[tabsStyles.tab, isActive && { backgroundColor: ACCENT }]}>
            <Text style={[tabsStyles.txt, { color: isActive ? '#fff' : isDark ? '#F0EEFF' : ACCENT }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {t}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabsStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, padding: 4, marginHorizontal: 16, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  txt: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});

function OverviewTab({ expenses, budgets, onAdd, onSeeAll, onAskAI, isDark, colors }) {
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);
  const remaining = Math.max(0, totalBudget - totalSpent);

  const byCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.id] = 0));
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const donutData = useMemo(
    () =>
      CATEGORIES.map((c) => ({ key: c.id, value: byCategory[c.id] || 0, color: c.color })).filter((d) => d.value > 0),
    [byCategory]
  );

  const thisWeek = useMemo(() => {
    const start = parseDate(TODAY);
    start.setDate(start.getDate() - 6);
    return expenses.filter((e) => parseDate(e.date) >= start).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const avgPerDay = useMemo(() => {
    if (expenses.length === 0) return 0;
    const dates = new Set(expenses.map((e) => e.date));
    return Math.round(totalSpent / Math.max(1, dates.size));
  }, [expenses, totalSpent]);

  const topCats = useMemo(() => {
    return CATEGORIES.map((c) => ({ ...c, spent: byCategory[c.id] || 0, budget: budgets[c.id] || 0 }))
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 4);
  }, [byCategory, budgets]);

  const recent = useMemo(() => [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [expenses]);

  const insight = useMemo(() => {
    const overBudgetCats = CATEGORIES.filter((c) => (byCategory[c.id] || 0) > (budgets[c.id] || 0));
    if (overBudgetCats.length > 0) {
      const c = overBudgetCats[0];
      const over = (byCategory[c.id] || 0) - (budgets[c.id] || 0);
      return `You've exceeded your ${c.label} budget by ${formatINR(over)} this month. Consider reducing ${c.label.toLowerCase()} spending.`;
    }
    const top = topCats[0];
    if (top && totalBudget > 0) {
      const pct = ((top.spent / totalBudget) * 100).toFixed(0);
      return `${top.label} accounts for ${pct}% of your total spend. ${pct > 30 ? 'It might be worth setting a tighter sub-goal.' : 'Your spread looks balanced.'}`;
    }
    return 'Track a few expenses to unlock personalized insights.';
  }, [byCategory, budgets, topCats, totalBudget]);

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: totalBudget > 0 ? Math.min(1, totalSpent / totalBudget) : 0,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [totalSpent, totalBudget]);

  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScrollView style={ovStyles.scroll} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      <GlassCard style={ovStyles.hero}>
        <View style={ovStyles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[ovStyles.heroLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SPENT THIS MONTH</Text>
            <Text style={[ovStyles.heroAmount, { color: colors.textPrimary }]}>{formatINR(totalSpent)}</Text>
            <Text style={[ovStyles.heroBudget, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              of {formatINR(totalBudget)} budget
            </Text>
          </View>
          <DonutChart data={donutData} size={140} />
        </View>
        <View style={ovStyles.heroProgressWrap}>
          <View style={[ovStyles.heroProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF0FB' }]}>
            <Animated.View style={[ovStyles.heroProgressFill, { width: widthInterp }]} />
          </View>
          <View style={ovStyles.heroProgressMeta}>
            <Text style={[ovStyles.heroProgressTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used
            </Text>
            <Text style={[ovStyles.heroProgressTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{formatINR(remaining)} left</Text>
          </View>
        </View>
      </GlassCard>

      <View style={ovStyles.chipRow}>
        <StatChip label="REMAINING" value={formatINR(remaining)} color="#4CAF82" isDark={isDark} />
        <StatChip label="THIS WEEK" value={formatINR(thisWeek)} color={ACCENT} isDark={isDark} />
        <StatChip label="AVG / DAY" value={formatINR(avgPerDay)} color="#FFB347" isDark={isDark} />
      </View>

      <GlassCard style={ovStyles.insight}>
        <View style={ovStyles.insightHeader}>
          <View style={[ovStyles.insightIcon, { backgroundColor: ACCENT + '22' }]}>
            <Ionicons name="sparkles" size={18} color={ACCENT} />
          </View>
          <Text style={[ovStyles.insightTitle, { color: colors.textPrimary }]}>AI Insight</Text>
        </View>
        <Text style={[ovStyles.insightTxt, { color: isDark ? '#D6D1FF' : '#3F3D56' }]}>{insight}</Text>
        <TouchableOpacity onPress={onAskAI} style={ovStyles.insightLink}>
          <Text style={[ovStyles.insightLinkTxt, { color: ACCENT }]}>Chat with AI Advisor</Text>
          <Ionicons name="arrow-forward" size={14} color={ACCENT} />
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={ovStyles.section}>
        <View style={ovStyles.sectionHeader}>
          <Text style={[ovStyles.sectionTitle, { color: colors.textPrimary }]}>This Week</Text>
          <Text style={[ovStyles.sectionMeta, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{formatINR(thisWeek)}</Text>
        </View>
        <WeeklyBarChart expenses={expenses} isDark={isDark} />
      </GlassCard>

      <GlassCard style={ovStyles.section}>
        <Text style={[ovStyles.sectionTitle, { color: colors.textPrimary, marginBottom: 14 }]}>Top Categories</Text>
        {topCats.map((c) => {
          const pct = c.budget > 0 ? Math.min(100, (c.spent / c.budget) * 100) : 0;
          return (
            <View key={c.id} style={ovStyles.topCatRow}>
              <CategoryIcon catId={c.id} size={36} />
              <View style={ovStyles.topCatBody}>
                <View style={ovStyles.topCatTop}>
                  <Text style={[ovStyles.topCatLabel, { color: colors.textPrimary }]}>{c.label}</Text>
                  <Text style={[ovStyles.topCatAmount, { color: colors.textPrimary }]}>{formatINR(c.spent)}</Text>
                </View>
                <ProgressBar value={c.spent} total={c.budget} color={c.color} bg={isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF'} height={6} />
                <Text style={[ovStyles.topCatMeta, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {pct.toFixed(0)}% of {formatINR(c.budget)}
                </Text>
              </View>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard style={ovStyles.section}>
        <View style={ovStyles.sectionHeader}>
          <Text style={[ovStyles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[ovStyles.seeAll, { color: ACCENT }]}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={ACCENT} />
          </TouchableOpacity>
        </View>
        {recent.map((e) => {
          const cat = CAT_MAP[e.category] || CAT_MAP.others;
          return (
            <View key={e.id} style={ovStyles.txnRow}>
              <CategoryIcon catId={e.category} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[ovStyles.txnDesc, { color: colors.textPrimary }]} numberOfLines={1}>
                  {e.description}
                </Text>
                <Text style={[ovStyles.txnCat, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {cat.label} • {dateLabel(e.date)}
                </Text>
              </View>
              <Text style={[ovStyles.txnAmt, { color: colors.textPrimary }]}>-{formatINR(e.amount)}</Text>
            </View>
          );
        })}
      </GlassCard>

      <FAB onPress={onAdd} />
    </ScrollView>
  );
}

const ovStyles = StyleSheet.create({
  scroll: { flex: 1 },
  hero: { marginHorizontal: 16, marginTop: 14, padding: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { fontSize: 32, fontWeight: '800', marginTop: 4 },
  heroBudget: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  heroProgressWrap: { marginTop: 18 },
  heroProgressBg: { height: 10, borderRadius: 5, overflow: 'hidden' },
  heroProgressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 5 },
  heroProgressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroProgressTxt: { fontSize: 11, fontWeight: '600' },
  chipRow: { flexDirection: 'row', marginHorizontal: 12, marginTop: 14 },
  insight: { marginHorizontal: 16, marginTop: 14, padding: 16 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  insightTitle: { fontSize: 15, fontWeight: '800' },
  insightTxt: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  insightLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightLinkTxt: { fontSize: 12, fontWeight: '700', marginRight: 4 },
  section: { marginHorizontal: 16, marginTop: 14, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionMeta: { fontSize: 13, fontWeight: '700' },
  seeAll: { fontSize: 12, fontWeight: '700', marginRight: 2 },
  topCatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  topCatBody: { flex: 1, marginLeft: 12 },
  topCatTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  topCatLabel: { fontSize: 13, fontWeight: '700' },
  topCatAmount: { fontSize: 13, fontWeight: '700' },
  topCatMeta: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  txnDesc: { fontSize: 14, fontWeight: '700' },
  txnCat: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  txnAmt: { fontSize: 14, fontWeight: '800' },
});

function TransactionsTab({ expenses, onDelete, onAdd, isDark, colors }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => (filterCat === 'all' ? true : e.category === filterCat))
      .filter((e) => (search ? e.description.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, search, filterCat]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const key = e.date;
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => ({ date: k, items: map[k] }));
  }, [filtered]);

  const confirmDelete = useCallback(
    (id, desc) => {
      Alert.alert('Delete Expense', `Remove "${desc}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]);
    },
    [onDelete]
  );

  return (
    <View style={txStyles.wrap}>
      <View style={txStyles.searchWrap}>
        <GlassCard style={[txStyles.searchCard, { backgroundColor: isDark ? undefined : '#FFFFFF' }]}>
          <Ionicons name="search" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            style={[txStyles.searchInput, { color: colors.textPrimary }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={txStyles.chipScroll} contentContainerStyle={txStyles.catRow}>
        <TouchableOpacity
          onPress={() => setFilterCat('all')}
          style={[txStyles.catChip, { backgroundColor: filterCat === 'all' ? ACCENT : isDark ? 'rgba(108,99,255,0.18)' : '#F0EEFF' }]}>
          <Text style={[txStyles.catTxt, { color: filterCat === 'all' ? '#fff' : ACCENT }]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((c) => {
          const active = filterCat === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => setFilterCat(c.id)}
              style={[txStyles.catChip, { backgroundColor: active ? c.color : isDark ? c.color + '22' : c.color + '18' }]}>
              <Ionicons name={c.icon} size={13} color={active ? '#fff' : c.color} />
              <Text style={[txStyles.catTxt, { color: active ? '#fff' : c.color, marginLeft: 5 }]}>{c.label.split(' ')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={txStyles.listScroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {grouped.length === 0 ? (
          <View style={txStyles.empty}>
            <View style={[txStyles.emptyIcon, { backgroundColor: ACCENT + '15' }]}>
              <Ionicons name="receipt-outline" size={40} color={ACCENT} />
            </View>
            <Text style={[txStyles.emptyTitle, { color: colors.textPrimary }]}>No transactions</Text>
            <Text style={[txStyles.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {search || filterCat !== 'all' ? 'Try adjusting your filters' : 'Tap + to record your first expense'}
            </Text>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.date} style={{ marginHorizontal: 16, marginTop: 14 }}>
              <Text style={[txStyles.groupLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{dateLabel(g.date)}</Text>
              <GlassCard style={{ padding: 4 }}>
                {g.items.map((e, idx) => {
                  const cat = CAT_MAP[e.category] || CAT_MAP.others;
                  return (
                    <View
                      key={e.id}
                      style={[
                        txStyles.row,
                        idx < g.items.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        },
                      ]}>
                      <CategoryIcon catId={e.category} size={38} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[txStyles.desc, { color: colors.textPrimary }]} numberOfLines={1}>
                          {e.description}
                        </Text>
                        <Text style={[txStyles.cat, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{cat.label}</Text>
                      </View>
                      <Text style={[txStyles.amt, { color: colors.textPrimary }]}>-{formatINR(e.amount)}</Text>
                      <TouchableOpacity onPress={() => confirmDelete(e.id, e.description)} style={txStyles.trashBtn}>
                        <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </GlassCard>
            </View>
          ))
        )}
      </ScrollView>

      <FAB onPress={onAdd} />
    </View>
  );
}

const txStyles = StyleSheet.create({
  wrap: { flex: 1 },
  searchWrap: { marginHorizontal: 16, marginTop: 14 },
  searchCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 2 },
  chipScroll: { flexGrow: 0 },
  catRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, marginRight: 8 },
  catTxt: { fontSize: 12, fontWeight: '700' },
  listScroll: { flex: 1 },
  groupLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  desc: { fontSize: 14, fontWeight: '700' },
  cat: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  amt: { fontSize: 14, fontWeight: '800', marginRight: 8 },
  trashBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

function BudgetTab({ expenses, budgets, onUpdateBudget, isDark, colors }) {
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const byCategory = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => (map[c.id] = 0));
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const totalSpent = useMemo(() => Object.values(byCategory).reduce((s, v) => s + v, 0), [byCategory]);
  const totalBudget = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);

  const openEdit = useCallback(
    (id) => {
      setEditing(id);
      setEditValue(String(budgets[id] || 0));
    },
    [budgets]
  );

  const saveEdit = useCallback(() => {
    const v = parseInt(editValue, 10);
    if (!isNaN(v) && v >= 0) {
      onUpdateBudget(editing, v);
    }
    setEditing(null);
    setEditValue('');
  }, [editing, editValue, onUpdateBudget]);

  const barColor = (pct) => (pct > 85 ? '#FF6B6B' : pct > 60 ? '#FFB347' : '#4CAF82');

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      <GlassCard style={bdStyles.total}>
        <Text style={[bdStyles.totalLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>TOTAL MONTHLY BUDGET</Text>
        <View style={bdStyles.totalRow}>
          <Text style={[bdStyles.totalAmt, { color: colors.textPrimary }]}>{formatINR(totalSpent)}</Text>
          <Text style={[bdStyles.totalOf, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>/ {formatINR(totalBudget)}</Text>
        </View>
        <ProgressBar
          value={totalSpent}
          total={totalBudget}
          color={barColor(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}
          bg={isDark ? 'rgba(255,255,255,0.08)' : '#EEF0FB'}
          height={10}
        />
        <View style={bdStyles.totalMeta}>
          <Text style={[bdStyles.totalMetaTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used
          </Text>
          <Text style={[bdStyles.totalMetaTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            {formatINR(Math.max(0, totalBudget - totalSpent))} remaining
          </Text>
        </View>
      </GlassCard>

      <Text style={[bdStyles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>CATEGORY BUDGETS</Text>

      {CATEGORIES.map((c) => {
        const spent = byCategory[c.id] || 0;
        const budget = budgets[c.id] || 0;
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        return (
          <GlassCard key={c.id} style={bdStyles.row}>
            <View style={bdStyles.rowHeader}>
              <CategoryIcon catId={c.id} size={36} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[bdStyles.rowLabel, { color: colors.textPrimary }]}>{c.label}</Text>
                <Text style={[bdStyles.rowMeta, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {formatINR(spent)} spent of {formatINR(budget)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => openEdit(c.id)} style={[bdStyles.editBtn, { backgroundColor: isDark ? 'rgba(108,99,255,0.2)' : '#F0EEFF' }]}>
                <Ionicons name="pencil" size={14} color={ACCENT} />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 12 }}>
              <ProgressBar value={spent} total={budget} color={barColor(pct)} bg={isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF'} height={8} />
              <View style={bdStyles.rowFooter}>
                <Text style={[bdStyles.rowPct, { color: barColor(pct) }]}>{pct.toFixed(0)}%</Text>
                <Text style={[bdStyles.rowRemain, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {budget - spent >= 0 ? `${formatINR(budget - spent)} left` : `${formatINR(spent - budget)} over`}
                </Text>
              </View>
            </View>
          </GlassCard>
        );
      })}

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={bdStyles.modalBg}>
          <GlassCard style={[bdStyles.modalCard, { backgroundColor: isDark ? undefined : '#FFFFFF' }]}>
            <Text style={[bdStyles.modalTitle, { color: colors.textPrimary }]}>
              Edit {editing ? CAT_MAP[editing]?.label : ''} Budget
            </Text>
            <View style={[bdStyles.modalInputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB' }]}>
              <Text style={[bdStyles.modalCurrency, { color: colors.textPrimary }]}>₹</Text>
              <TextInput
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="number-pad"
                autoFocus
                style={[bdStyles.modalInput, { color: colors.textPrimary }]}
              />
            </View>
            <View style={bdStyles.modalBtns}>
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={[bdStyles.modalBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
                <Text style={[bdStyles.modalBtnTxt, { color: ACCENT }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[bdStyles.modalBtn, { backgroundColor: ACCENT }]}>
                <Text style={[bdStyles.modalBtnTxt, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </ScrollView>
  );
}

const bdStyles = StyleSheet.create({
  total: { marginHorizontal: 16, marginTop: 14, padding: 18 },
  totalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  totalRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4, marginBottom: 14 },
  totalAmt: { fontSize: 28, fontWeight: '800' },
  totalOf: { fontSize: 14, fontWeight: '600', marginLeft: 6, marginBottom: 4 },
  totalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalMetaTxt: { fontSize: 11, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginLeft: 20, marginTop: 18, marginBottom: 6 },
  row: { marginHorizontal: 16, marginTop: 10, padding: 16 },
  rowHeader: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowPct: { fontSize: 11, fontWeight: '800' },
  rowRemain: { fontSize: 11, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32 },
  modalCard: { padding: 22 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  modalCurrency: { fontSize: 22, fontWeight: '700', marginRight: 6 },
  modalInput: { flex: 1, fontSize: 22, fontWeight: '700', padding: 0 },
  modalBtns: { flexDirection: 'row', marginTop: 18, gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalBtnTxt: { fontSize: 14, fontWeight: '700' },
});

const SUGGESTION_CHIPS = [
  'Where can I save money?',
  'Analyze my spending patterns',
  'Help me budget for next month',
  'Which category am I overspending in?',
  'Show me weekly trends',
];

function AIAdvisorTab({ expenses, budgets, isDark, colors }) {
  const [apiKey, setApiKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('anthropic_api_key');
        if (stored) setApiKey(stored);
      } catch (e) {}
      setKeyLoaded(true);
    })();
  }, []);

  const saveKey = useCallback(async () => {
    const k = keyInput.trim();
    if (!k) return;
    try {
      await SecureStore.setItemAsync('anthropic_api_key', k);
      setApiKey(k);
      setKeyInput('');
    } catch (e) {
      Alert.alert('Error', 'Could not save API key.');
    }
  }, [keyInput]);

  const clearKey = useCallback(async () => {
    Alert.alert('Disconnect AI Advisor', 'This will remove your stored API key.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('anthropic_api_key');
          setApiKey(null);
          setMessages([]);
        },
      },
    ]);
  }, []);

  const buildSystemPrompt = useCallback(() => {
    const byCat = {};
    CATEGORIES.forEach((c) => (byCat[c.id] = 0));
    expenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    const totalSpent = Object.values(byCat).reduce((s, v) => s + v, 0);
    const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
    const recent = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    const catLines = CATEGORIES.map((c) => `- ${c.label}: ₹${byCat[c.id]} spent / ₹${budgets[c.id]} budget`).join('\n');
    const recentLines = recent
      .map((e) => `- ${e.date}: ₹${e.amount} on "${e.description}" (${CAT_MAP[e.category]?.label}, ${e.method})`)
      .join('\n');

    return `You are a personal finance advisor for an Indian user. Provide concise, actionable financial advice in Indian Rupees (₹). Keep responses under 150 words and use a friendly, encouraging tone.

CURRENT FINANCIAL SNAPSHOT (as of ${TODAY}):
Total Spent: ₹${totalSpent}
Total Budget: ₹${totalBudget}
Remaining: ₹${Math.max(0, totalBudget - totalSpent)}

CATEGORY BREAKDOWN:
${catLines}

RECENT TRANSACTIONS:
${recentLines}

Always tailor advice to this specific data. If the user is over budget in a category, mention it. Suggest concrete next steps.`;
  }, [expenses, budgets]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;
      const userMsg = { role: 'user', content: text.trim(), id: Date.now().toString() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      setLoading(true);

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-7',
            max_tokens: 600,
            system: buildSystemPrompt(),
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errMsg = data?.error?.message || `Request failed (${res.status})`;
          setMessages((m) => [...m, { role: 'assistant', content: `Sorry, I couldn't reach the API: ${errMsg}`, id: Date.now().toString() + 'e', error: true }]);
        } else {
          const reply = data?.content?.[0]?.text || 'I did not get a response. Please try again.';
          setMessages((m) => [...m, { role: 'assistant', content: reply, id: Date.now().toString() + 'a' }]);
        }
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `Network error: ${e.message || 'Unable to connect'}.`, id: Date.now().toString() + 'n', error: true },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    },
    [messages, apiKey, loading, buildSystemPrompt]
  );

  if (!keyLoaded) {
    return (
      <View style={[aiStyles.center]}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (!apiKey) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={aiStyles.connectWrap}>
        <GlassCard style={aiStyles.connectCard}>
          <View style={[aiStyles.connectIcon, { backgroundColor: ACCENT + '22' }]}>
            <Ionicons name="sparkles" size={32} color={ACCENT} />
          </View>
          <Text style={[aiStyles.connectTitle, { color: colors.textPrimary }]}>Meet your AI Advisor</Text>
          <Text style={[aiStyles.connectSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
            Connect Claude Opus to get personalized financial insights based on your real spending data. Your key is stored securely on this device.
          </Text>
          <View style={[aiStyles.keyInputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F7FF' }]}>
            <Ionicons name="key" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <TextInput
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="sk-ant-api03-..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              secureTextEntry
              autoCapitalize="none"
              style={[aiStyles.keyInput, { color: colors.textPrimary }]}
            />
          </View>
          <TouchableOpacity onPress={saveKey} disabled={!keyInput.trim()} style={[aiStyles.connectBtn, { backgroundColor: keyInput.trim() ? ACCENT : ACCENT + '55' }]}>
            <Ionicons name="link" size={16} color="#fff" />
            <Text style={aiStyles.connectBtnTxt}>Connect AI Advisor</Text>
          </TouchableOpacity>
          <View style={aiStyles.note}>
            <Ionicons name="shield-checkmark" size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text style={[aiStyles.noteTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Stored locally via expo-secure-store</Text>
          </View>
        </GlassCard>
      </ScrollView>
    );
  }

  const showSuggestions = messages.length === 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={aiStyles.headerBar}>
        <View style={aiStyles.headerLeft}>
          <View style={[aiStyles.headerAvatar, { backgroundColor: ACCENT + '22' }]}>
            <Ionicons name="sparkles" size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={[aiStyles.headerName, { color: colors.textPrimary }]}>Claude Opus</Text>
            <Text style={[aiStyles.headerStatus, { color: '#4CAF82' }]}>● Connected</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearKey}>
          <Ionicons name="settings-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={aiStyles.chatList}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}>
        {messages.length === 0 && (
          <View style={aiStyles.welcomeWrap}>
            <View style={[aiStyles.welcomeIcon, { backgroundColor: ACCENT + '18' }]}>
              <Ionicons name="sparkles" size={28} color={ACCENT} />
            </View>
            <Text style={[aiStyles.welcomeTitle, { color: colors.textPrimary }]}>How can I help you today?</Text>
            <Text style={[aiStyles.welcomeSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Ask anything about your spending, budgets, or savings goals.
            </Text>
          </View>
        )}

        {messages.map((m) => (
          <View key={m.id} style={[aiStyles.bubbleWrap, { alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }]}>
            {m.role === 'assistant' && (
              <View style={aiStyles.assistantHeader}>
                <Ionicons name="sparkles" size={11} color={ACCENT} />
                <Text style={[aiStyles.assistantLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Claude Opus</Text>
              </View>
            )}
            <View
              style={[
                aiStyles.bubble,
                m.role === 'user'
                  ? { backgroundColor: ACCENT, borderBottomRightRadius: 4 }
                  : {
                      backgroundColor: m.error ? '#FF6B6B22' : isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF',
                      borderBottomLeftRadius: 4,
                    },
              ]}>
              <Text
                style={[
                  aiStyles.bubbleTxt,
                  { color: m.role === 'user' ? '#fff' : m.error ? '#FF6B6B' : colors.textPrimary },
                ]}>
                {m.content}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[aiStyles.bubbleWrap, { alignItems: 'flex-start' }]}>
            <View style={aiStyles.assistantHeader}>
              <Ionicons name="sparkles" size={11} color={ACCENT} />
              <Text style={[aiStyles.assistantLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Claude Opus</Text>
            </View>
            <View style={[aiStyles.bubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF', flexDirection: 'row', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={ACCENT} />
              <Text style={[aiStyles.bubbleTxt, { color: colors.textPrimary, marginLeft: 10 }]}>Analyzing your finances…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {showSuggestions && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={aiStyles.suggestionRow}>
          {SUGGESTION_CHIPS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => sendMessage(s)}
              style={[aiStyles.suggestionChip, { backgroundColor: isDark ? 'rgba(108,99,255,0.18)' : '#F0EEFF' }]}>
              <Text style={[aiStyles.suggestionTxt, { color: ACCENT }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={[aiStyles.inputBar, { backgroundColor: isDark ? '#0D0D1A' : '#FFFFFF', borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEE' }]}>
        <View style={[aiStyles.inputWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF' }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your spending..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            style={[aiStyles.input, { color: colors.textPrimary }]}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={[aiStyles.sendBtn, { backgroundColor: input.trim() && !loading ? ACCENT : ACCENT + '55' }]}>
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const aiStyles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  connectWrap: { padding: 16, paddingTop: 30 },
  connectCard: { padding: 24, alignItems: 'center' },
  connectIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  connectTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  connectSub: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 20 },
  keyInputWrap: { width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 14 },
  keyInput: { flex: 1, fontSize: 13, fontWeight: '500', padding: 0 },
  connectBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  connectBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  noteTxt: { fontSize: 11, fontWeight: '500' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerName: { fontSize: 14, fontWeight: '800' },
  headerStatus: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  chatList: { paddingHorizontal: 16, paddingBottom: 12 },
  welcomeWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  welcomeIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  welcomeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  welcomeSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  bubbleWrap: { marginVertical: 6, maxWidth: '100%' },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4, marginLeft: 4 },
  assistantLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '88%' },
  bubbleTxt: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  suggestionRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  suggestionTxt: { fontSize: 12, fontWeight: '700' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  inputWrap: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, minHeight: 44, maxHeight: 120, justifyContent: 'center' },
  input: { fontSize: 14, fontWeight: '500', padding: 0, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

function AddExpenseModal({ visible, onClose, onSave, isDark, colors }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [method, setMethod] = useState('upi');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setDescription('');
      setCategory('food');
      setMethod('upi');
    }
  }, [visible]);

  const handleSave = useCallback(() => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a short description.');
      return;
    }
    onSave({
      id: Date.now().toString(),
      amount: amt,
      description: description.trim(),
      category,
      method,
      date: TODAY,
    });
    onClose();
  }, [amount, description, category, method, onSave, onClose]);

  const todayLabel = useMemo(() => {
    const d = parseDate(TODAY);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={addStyles.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={addStyles.backdrop} />
        <View style={[addStyles.sheet, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}>
          <View style={addStyles.handle} />
          <Text style={[addStyles.title, { color: colors.textPrimary }]}>Add Expense</Text>

          <View style={[addStyles.amountWrap, { backgroundColor: isDark ? 'rgba(108,99,255,0.12)' : '#F0EEFF' }]}>
            <Text style={[addStyles.amountCurrency, { color: ACCENT }]}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              style={[addStyles.amountInput, { color: colors.textPrimary }]}
              autoFocus
            />
          </View>

          <Text style={[addStyles.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DESCRIPTION</Text>
          <View style={[addStyles.fieldInputWrap, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' }]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              style={[addStyles.fieldInput, { color: colors.textPrimary }]}
            />
          </View>

          <Text style={[addStyles.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={addStyles.catRow}>
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[
                    addStyles.catChip,
                    {
                      backgroundColor: active ? c.color : isDark ? 'rgba(255,255,255,0.05)' : '#F8F7FF',
                      borderColor: active ? c.color : isDark ? 'rgba(255,255,255,0.08)' : '#EEE',
                    },
                  ]}>
                  <Ionicons name={c.icon} size={16} color={active ? '#fff' : c.color} />
                  <Text style={[addStyles.catChipTxt, { color: active ? '#fff' : colors.textPrimary }]}>{c.label.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[addStyles.fieldLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>PAYMENT METHOD</Text>
          <View style={addStyles.methodRow}>
            {PAYMENT_METHODS.map((m) => {
              const active = method === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[
                    addStyles.methodBtn,
                    {
                      backgroundColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.05)' : '#F8F7FF',
                      borderColor: active ? ACCENT : isDark ? 'rgba(255,255,255,0.08)' : '#EEE',
                    },
                  ]}>
                  <Ionicons name={m.icon} size={18} color={active ? '#fff' : ACCENT} />
                  <Text style={[addStyles.methodTxt, { color: active ? '#fff' : colors.textPrimary }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[addStyles.dateRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F7FF' }]}>
            <Ionicons name="calendar" size={16} color={ACCENT} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[addStyles.dateLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DATE</Text>
              <Text style={[addStyles.dateValue, { color: colors.textPrimary }]}>{todayLabel}</Text>
            </View>
          </View>

          <View style={addStyles.actions}>
            <TouchableOpacity onPress={onClose} style={[addStyles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF' }]}>
              <Text style={[addStyles.actionTxt, { color: ACCENT }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[addStyles.actionBtn, { backgroundColor: ACCENT }]}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={[addStyles.actionTxt, { color: '#fff', marginLeft: 4 }]}>Save Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const addStyles = StyleSheet.create({
  bg: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 22 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 22, paddingVertical: 18, marginBottom: 18 },
  amountCurrency: { fontSize: 34, fontWeight: '800', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 34, fontWeight: '800', padding: 0 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  fieldInputWrap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  fieldInput: { fontSize: 14, fontWeight: '500', padding: 0 },
  catRow: { paddingVertical: 4, paddingRight: 12, gap: 8, marginBottom: 16 },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, marginRight: 8, borderWidth: 1, gap: 6 },
  catChipTxt: { fontSize: 12, fontWeight: '700' },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  methodTxt: { fontSize: 11, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 18 },
  dateLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dateValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  actionTxt: { fontSize: 14, fontWeight: '800' },
});

export default function ExpensesScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = useCallback((expense) => {
    setExpenses((list) => [expense, ...list]);
  }, []);

  const handleDelete = useCallback((id) => {
    setExpenses((list) => list.filter((e) => e.id !== id));
  }, []);

  const updateBudget = useCallback((catId, value) => {
    setBudgets((b) => ({ ...b, [catId]: value }));
  }, []);

  return (
    <View style={styles.root}>
      <TabsBar active={activeTab} onChange={setActiveTab} isDark={isDark} />

      {activeTab === 'Overview' && (
        <OverviewTab
          expenses={expenses}
          budgets={budgets}
          onAdd={() => setAddOpen(true)}
          onSeeAll={() => setActiveTab('Transactions')}
          onAskAI={() => setActiveTab('AI Advisor')}
          isDark={isDark}
          colors={colors}
        />
      )}
      {activeTab === 'Transactions' && (
        <TransactionsTab expenses={expenses} onDelete={handleDelete} onAdd={() => setAddOpen(true)} isDark={isDark} colors={colors} />
      )}
      {activeTab === 'Budget' && (
        <BudgetTab expenses={expenses} budgets={budgets} onUpdateBudget={updateBudget} isDark={isDark} colors={colors} />
      )}
      {activeTab === 'AI Advisor' && <AIAdvisorTab expenses={expenses} budgets={budgets} isDark={isDark} colors={colors} />}

      <AddExpenseModal visible={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} isDark={isDark} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
