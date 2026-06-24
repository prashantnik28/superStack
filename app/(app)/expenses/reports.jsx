import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../src/context/ThemeContext';
import { useExpensesStore } from '../../../src/stores/useExpensesStore';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';
const { width: SCREEN_W } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'food',          label: 'Food & Dining',    icon: 'restaurant',         color: '#FF6B6B' },
  { id: 'transport',     label: 'Transport',         icon: 'car',                color: '#4ECDC4' },
  { id: 'shopping',      label: 'Shopping',          icon: 'bag',                color: '#45B7D1' },
  { id: 'entertainment', label: 'Entertainment',     icon: 'game-controller',    color: '#96CEB4' },
  { id: 'health',        label: 'Health',            icon: 'medical',            color: '#FF9FF3' },
  { id: 'education',     label: 'Education',         icon: 'school',             color: '#A29BFE' },
  { id: 'bills',         label: 'Bills & Utilities', icon: 'receipt',            color: '#FD79A8' },
  { id: 'salary',        label: 'Salary',            icon: 'briefcase',          color: '#6BCB77' },
  { id: 'freelance',     label: 'Freelance',         icon: 'laptop',             color: '#4D96FF' },
  { id: 'others',        label: 'Others',            icon: 'ellipsis-horizontal',color: '#B2BEC3' },
];
const CAT_MAP = CATEGORIES.reduce((a, c) => { a[c.id] = c; return a; }, {});

const PERIODS = [
  { label: '1M',  months: 1  },
  { label: '3M',  months: 3  },
  { label: '6M',  months: 6  },
  { label: '1Y',  months: 12 },
];

const formatCurrency = (n, cur = 'INR') => {
  const num = Number(n);
  if (cur === 'USD') return `$${num.toLocaleString('en-US')}`;
  return `₹${num.toLocaleString('en-IN')}`;
};
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function DonutChart({ data, size = 160 }) {
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 6;
  const innerR = outerR * 0.65;
  const total = data.reduce((s, d) => s + d.value, 0);
  const GAP = 2.5;
  if (total <= 0) return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={(outerR + innerR) / 2} stroke="#E5E7EB" strokeWidth={outerR - innerR} fill="none" />
    </Svg>
  );
  const active = data.filter((d) => d.value > 0);
  let angle = 0;
  const slices = active.length === 1
    ? [{ key: active[0].key, color: active[0].color, full: true }]
    : active.map((d) => {
        const sweep = (d.value / total) * 360;
        const start = angle + GAP / 2;
        const end   = angle + sweep - GAP / 2;
        angle += sweep;
        return { key: d.key, color: d.color, start, end, full: false };
      });

  return (
    <Svg width={size} height={size}>
      {slices.map((s) =>
        s.full
          ? <Circle key={s.key} cx={cx} cy={cy} r={(outerR + innerR) / 2} stroke={s.color} strokeWidth={outerR - innerR} fill="none" />
          : <Path key={s.key} d={donutSlicePath(cx, cy, outerR, innerR, s.start, s.end)} fill={s.color} />
      )}
    </Svg>
  );
}

function MonthlyBarsChart({ monthlyData, isDark }) {
  if (!monthlyData.length) return null;
  const maxVal = Math.max(1, ...monthlyData.map((d) => d.expense));
  const chartH = 120;
  const barW = Math.min(28, (SCREEN_W - 80) / monthlyData.length - 6);

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartH + 30, justifyContent: 'space-around' }}>
        {monthlyData.map((d, i) => {
          const h = Math.max(4, (d.expense / maxVal) * chartH);
          const incH = Math.max(0, (d.income / maxVal) * chartH);
          return (
            <View key={i} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 4 }}>
                {d.expense >= 1000 ? `${(d.expense / 1000).toFixed(1)}k` : d.expense || ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                {d.income > 0 && (
                  <View style={{ width: barW * 0.5, height: incH, backgroundColor: '#4CAF82', borderRadius: 4 }} />
                )}
                <View style={{ width: barW, height: h, backgroundColor: ACCENT, borderRadius: 4 }} />
              </View>
              <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 6 }}>
                {MONTH_LABELS[d.month]}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: ACCENT }} />
          <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '600' }}>Expense</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#4CAF82' }} />
          <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '600' }}>Income</Text>
        </View>
      </View>
    </View>
  );
}

function HeatmapCalendar({ transactions, month, year, isDark }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const spendByDay = useMemo(() => {
    const map = {};
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.type !== 'income';
    }).forEach((t) => {
      const day = new Date(t.date).getDate();
      map[day] = (map[day] || 0) + t.amount;
    });
    return map;
  }, [transactions, month, year]);

  const maxSpend = Math.max(1, ...Object.values(spendByDay));

  function heatColor(amount) {
    if (!amount) return isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6';
    const intensity = amount / maxSpend;
    if (intensity < 0.33) return '#4CAF8244';
    if (intensity < 0.66) return '#FFB34766';
    return '#FF6B6B88';
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF' }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => (
          <View key={i} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}>
            {day ? (
              <View style={{ flex: 1, borderRadius: 6, backgroundColor: heatColor(spendByDay[day]), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#E5E7EB' : '#374151' }}>{day}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '600' }}>Low</Text>
        {['#4CAF8244', '#FFB34766', '#FF6B6B88'].map((c, i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: c }} />
        ))}
        <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '600' }}>High</Text>
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const { colors, isDark, radius } = useTheme();
  const { fetchTransactionsRange, selectedMonth, selectedYear, currency } = useExpensesStore();
  const fmt = (n) => formatCurrency(n, currency);
  const [period, setPeriod]       = useState(1);
  const [txns, setTxns]           = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now   = new Date();
      const to    = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const from  = new Date(now.getFullYear(), now.getMonth() - (period - 1), 1);
      const data  = await fetchTransactionsRange(from.toISOString(), to.toISOString());
      setTxns(data);
    } catch {}
    setLoading(false);
  }, [period, fetchTransactionsRange]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalExpense = useMemo(() => txns.filter((t) => t.type !== 'income').reduce((s, t) => s + t.amount, 0), [txns]);
  const totalIncome  = useMemo(() => txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [txns]);
  const net          = totalIncome - totalExpense;

  const byCategory = useMemo(() => {
    const map = {};
    txns.filter((t) => t.type !== 'income').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [txns]);

  const donutData = useMemo(() =>
    CATEGORIES.map((c) => ({ key: c.id, value: byCategory[c.id] || 0, color: c.color }))
      .filter((d) => d.value > 0),
    [byCategory]
  );

  const rankedCats = useMemo(() =>
    CATEGORIES.map((c) => ({ ...c, spent: byCategory[c.id] || 0 }))
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent),
    [byCategory]
  );

  const monthlyData = useMemo(() => {
    const map = {};
    txns.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { month: d.getMonth(), year: d.getFullYear(), expense: 0, income: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else                     map[key].expense += t.amount;
    });
    return Object.values(map).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  }, [txns]);

  const topMerchants = useMemo(() => {
    const map = {};
    txns.filter((t) => t.type !== 'income').forEach((t) => {
      const k = t.description;
      if (!map[k]) map[k] = { name: k, total: 0, count: 0, category: t.category };
      map[k].total += t.amount;
      map[k].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [txns]);

  const nowMonth = new Date().getMonth();
  const nowYear  = new Date().getFullYear();

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Period selector */}
      <View style={[S.periodRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0EEFF', borderRadius: radius }]}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.months}
            onPress={() => setPeriod(p.months)}
            style={[S.periodBtn, { borderRadius: radius - 2 }, period === p.months && { backgroundColor: ACCENT }]}
            activeOpacity={0.8}>
            <Text style={[S.periodTxt, { color: period === p.months ? '#fff' : ACCENT }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <View style={S.loader}><ActivityIndicator color={ACCENT} size="large" /></View>
        ) : (
          <>
            {/* Summary hero — gradient */}
            <LinearGradient
              colors={['#7B6CFF', '#3D2F9E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[S.hero, { borderRadius: radius + 4 }]}>
              <Text style={[S.heroLabel, { color: 'rgba(255,255,255,0.65)' }]}>
                {period === 1 ? 'THIS MONTH' : `LAST ${period} MONTHS`}
              </Text>
              <View style={S.heroRow}>
                <View style={S.heroStat}>
                  <Text style={[S.heroVal, { color: '#F9A8D4' }]}>{fmt(totalExpense)}</Text>
                  <Text style={[S.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Total Expense</Text>
                </View>
                <View style={[S.heroDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <View style={S.heroStat}>
                  <Text style={[S.heroVal, { color: '#A8EDEA' }]}>{fmt(totalIncome)}</Text>
                  <Text style={[S.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Total Income</Text>
                </View>
                <View style={[S.heroDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <View style={S.heroStat}>
                  <Text style={[S.heroVal, { color: net >= 0 ? '#A8EDEA' : '#F9A8D4' }]}>{net >= 0 ? '+' : ''}{fmt(net)}</Text>
                  <Text style={[S.heroStatLabel, { color: 'rgba(255,255,255,0.6)' }]}>Net</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Monthly trend */}
            {monthlyData.length > 0 && (
              <GlassCard style={S.section}>
                <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Monthly Trend</Text>
                <MonthlyBarsChart monthlyData={monthlyData} isDark={isDark} />
              </GlassCard>
            )}

            {/* Category breakdown */}
            {rankedCats.length > 0 && (
              <GlassCard style={S.section}>
                <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Category Breakdown</Text>
                <View style={S.donutRow}>
                  <DonutChart data={donutData} size={150} />
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                    {rankedCats.slice(0, 5).map((c) => (
                      <View key={c.id} style={S.catLegendRow}>
                        <View style={[S.catDot, { backgroundColor: c.color }]} />
                        <Text style={[S.catLegendLabel, { color: colors.textPrimary }]} numberOfLines={1}>{c.label.split(' ')[0]}</Text>
                        <Text style={[S.catLegendAmt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                          {totalExpense > 0 ? `${Math.round((c.spent / totalExpense) * 100)}%` : '0%'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                {rankedCats.map((c) => (
                  <View key={c.id} style={S.catListRow}>
                    <View style={[S.catIcon, { backgroundColor: c.color + '22' }]}>
                      <Ionicons name={c.icon} size={15} color={c.color} />
                    </View>
                    <Text style={[S.catListLabel, { color: colors.textPrimary }]}>{c.label}</Text>
                    <Text style={[S.catListAmt, { color: colors.textPrimary }]}>{fmt(c.spent)}</Text>
                    <Text style={[S.catListPct, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      {totalExpense > 0 ? `${Math.round((c.spent / totalExpense) * 100)}%` : '0%'}
                    </Text>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Spending heatmap */}
            <GlassCard style={S.section}>
              <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>
                {MONTH_LABELS[nowMonth]} {nowYear} Heatmap
              </Text>
              <HeatmapCalendar
                transactions={txns}
                month={nowMonth}
                year={nowYear}
                isDark={isDark}
              />
            </GlassCard>

            {/* Top merchants */}
            {topMerchants.length > 0 && (
              <GlassCard style={S.section}>
                <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Top Merchants</Text>
                {topMerchants.map((m, i) => {
                  const cat = CAT_MAP[m.category] || CAT_MAP.others;
                  return (
                    <View key={i} style={[S.merchantRow, i < topMerchants.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={[S.merchantIcon, { backgroundColor: cat.color + '22' }]}>
                        <Ionicons name={cat.icon} size={16} color={cat.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[S.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>{m.name}</Text>
                        <Text style={[S.merchantCount, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{m.count}x transaction{m.count > 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={[S.merchantAmt, { color: colors.textPrimary }]}>{fmt(m.total)}</Text>
                    </View>
                  );
                })}
              </GlassCard>
            )}

            {txns.length === 0 && (
              <View style={S.empty}>
                <Ionicons name="bar-chart-outline" size={56} color={ACCENT + '55'} />
                <Text style={[S.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
                <Text style={[S.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Add transactions to see your reports</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:         { flex: 1 },
  periodRow:    { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, padding: 4 },
  periodBtn:    { flex: 1, paddingVertical: 9, alignItems: 'center' },
  periodTxt:    { fontSize: 13, fontWeight: '800' },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  hero:         { marginHorizontal: 16, marginTop: 14, padding: 18 },
  heroLabel:    { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 14 },
  heroRow:      { flexDirection: 'row', alignItems: 'center' },
  heroStat:     { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider:  { width: 1, height: 32, borderRadius: 1 },
  heroVal:      { fontSize: 15, fontWeight: '800' },
  heroStatLabel:{ fontSize: 10, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center' },
  section:      { marginHorizontal: 16, marginTop: 14, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
  donutRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  catLegendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catDot:       { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  catLegendLabel:{ flex: 1, fontSize: 12, fontWeight: '600' },
  catLegendAmt: { fontSize: 11, fontWeight: '700' },
  catListRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  catIcon:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catListLabel: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600' },
  catListAmt:   { fontSize: 13, fontWeight: '800', marginRight: 8 },
  catListPct:   { fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  merchantRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  merchantIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  merchantName: { fontSize: 13, fontWeight: '700' },
  merchantCount:{ fontSize: 11, fontWeight: '500', marginTop: 1 },
  merchantAmt:  { fontSize: 14, fontWeight: '800' },
  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptySub:     { fontSize: 13, marginTop: 6, textAlign: 'center' },
});
