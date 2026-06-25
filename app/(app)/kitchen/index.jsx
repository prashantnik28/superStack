import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, Animated, Platform, Dimensions,
  Keyboard, Alert, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import AppBottomNav from '../../../src/components/ui/AppBottomNav';
import { MEALS_DATA } from '../../../src/data/mealsData';
import { usePantryStore } from '../../../src/stores/usePantryStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ACCENT   = '#6C63FF';
const ACCENT2  = '#5851E6';
const ACCENT3  = '#A78BFA';
const CRITICAL = '#EF4444';
const WARN     = '#F59E0B';
const OK       = '#10B981';

const STATUS = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Expiring!', icon: 'warning-outline' },
  expiring: { color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   label: 'Use Soon',  icon: 'time-outline' },
  fresh:    { color: '#64748B', bg: 'rgba(100,116,139,0.09)', label: 'Good',      icon: 'checkmark-circle-outline' },
};

const CATS = ['All', 'Dairy', 'Produce', 'Grains', 'Beverages', 'Snacks', 'Frozen', 'Condiments'];
const CAT_ICON = {
  All: 'apps-outline', Dairy: 'water-outline', Produce: 'leaf-outline',
  Grains: 'restaurant-outline', Beverages: 'wine-outline', Snacks: 'pizza-outline',
  Frozen: 'snow-outline', Condiments: 'flask-outline',
};


const CAT_EMOJI = {
  Dairy: '🥛', Produce: '🥦', Grains: '🌾', Beverages: '🧃',
  Snacks: '🍿', Frozen: '🧊', Condiments: '🫙', Other: '🛒',
};
const SHOPPING_DATA = [
  { id: 's1', name: 'Eggs',           qty: '12',  unit: 'pcs',    category: 'Dairy',      emoji: '🥚', done: false, priority: true },
  { id: 's2', name: 'Onions',         qty: '1',   unit: 'kg',     category: 'Produce',    emoji: '🧅', done: false, priority: false },
  { id: 's3', name: 'Butter',         qty: '200', unit: 'g',      category: 'Dairy',      emoji: '🧈', done: false, priority: false },
  { id: 's4', name: 'Olive Oil',      qty: '1',   unit: 'bottle', category: 'Condiments', emoji: '🫙', done: true,  priority: false },
  { id: 's5', name: 'Chicken Breast', qty: '500', unit: 'g',      category: 'Frozen',     emoji: '🍗', done: false, priority: true },
  { id: 's6', name: 'Tomatoes',       qty: '6',   unit: 'pcs',    category: 'Produce',    emoji: '🍅', done: false, priority: false },
  { id: 's7', name: 'Garlic',         qty: '1',   unit: 'bulb',   category: 'Produce',    emoji: '🧄', done: false, priority: false },
];


function daysLeft(dateStr) {
  if (!dateStr) return Infinity;
  const iso = dateStr.slice(0, 10); // handles both YYYY-MM-DD and ISO strings
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return Infinity;
  const exp = new Date(y, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((exp - now) / 86400000);
}
function statusFor(days) {
  if (!isFinite(days)) return 'fresh';
  if (days <= 7)  return 'critical'; // bright red
  if (days <= 14) return 'expiring'; // muted red
  return 'fresh';                    // dark neutral
}
function daysLabel(days) {
  if (!isFinite(days)) return '—';
  if (days <= 0)  return 'Exp';
  if (days === 1) return '1d';
  if (days > 30)  return `${Math.ceil(days / 30)}mo`;
  return `${days}d`;
}
function fmtExpiry(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(5, 10); // "YYYY-MM-DD" → "MM-DD"
}

// ── Kitchen Bottom Nav ─────────────────────────────────────────────────────────
const KITCHEN_TABS = [
  { id: 'Pantry',   label: 'Pantry', icon: 'grid-outline',       iconOn: 'grid' },
  { id: 'Expiry',   label: 'Expiry', icon: 'time-outline',       iconOn: 'time' },
  { center: true,   label: 'Scan',   icon: 'barcode-outline',    iconOn: 'barcode' },
  { id: 'Shopping', label: 'Shop',   icon: 'cart-outline',       iconOn: 'cart' },
  { id: 'Meals',    label: 'Meals',  icon: 'restaurant-outline', iconOn: 'restaurant' },
];

// ── Pantry Tab ─────────────────────────────────────────────────────────────────
const URGENT_CARD_W = Math.floor((SCREEN_W - 32 - 24) / 4); // 4 per row with 8px gaps

function PantryTab({ pantry, isDark, colors, navBottom, onEdit, onDelete }) {
  const handleItemPress = useCallback((item) => onEdit(item), [onEdit]);
  const [cat,      setCat]      = useState('All');
  const [search,   setSearch]   = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const computed = useMemo(() =>
    pantry.map(i => { const d = daysLeft(i.expiry); return { ...i, days: d, status: statusFor(d) }; }),
    [pantry]
  );

  const critical = computed.filter(i => i.status === 'critical').length;
  const expiring = computed.filter(i => i.status === 'expiring').length;
  const fresh    = computed.filter(i => i.status === 'fresh').length;
  const healthPct = pantry.length > 0 ? Math.round(((expiring + fresh) / pantry.length) * 100) : 100;

  const list = useMemo(() => {
    let r = cat === 'All' ? computed : computed.filter(i => i.category === cat);
    if (search.trim()) r = r.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return r.sort((a, b) => a.days - b.days);
  }, [computed, cat, search]);

  const urgentItems = computed.filter(i => i.status !== 'fresh').slice(0, 8);

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: healthPct / 100,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [healthPct]);
  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: navBottom }} showsVerticalScrollIndicator={false}>

      {/* ── Credit-card Hero ── */}
      <View style={PT.hero}>
        {Platform.OS === 'ios' && <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />}
        <LinearGradient
          colors={['rgba(100,85,255,0.88)', 'rgba(38,18,100,0.96)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Glass highlight line */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.32)' }} />
        {/* Decorative circles */}
        <View style={PT.heroBubble1} />
        <View style={PT.heroBubble2} />

        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <View style={PT.heroChip}><Text style={PT.heroChipTxt}>KITCHEN PANTRY</Text></View>
          <View style={PT.heroHealthPill}>
            <Text style={PT.heroHealthN}>{healthPct}%</Text>
            <Text style={PT.heroHealthL}>healthy</Text>
          </View>
        </View>

        {/* Big number row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
          <View>
            <Text style={PT.heroLabel}>TOTAL ITEMS</Text>
            <Text style={PT.heroCount}>{pantry.length}</Text>
            <Text style={PT.heroSub}>items in pantry</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={PT.heroProgTrack}>
          <Animated.View style={[PT.heroProgFill, { width: widthInterp, backgroundColor: critical > 2 ? CRITICAL : critical > 0 ? WARN : OK }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 14 }}>
          <Text style={PT.heroProgMeta}>{fresh} fresh · {expiring} expiring</Text>
          <Text style={[PT.heroProgMeta, { color: critical > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.4)' }]}>
            {critical > 0 ? `${critical} critical` : 'All good ✓'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 14 }} />

        {/* 4-stat row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {[
            { val: critical,        label: 'Critical', color: '#FCA5A5' },
            { val: expiring,        label: 'Expiring', color: '#FCD34D' },
            { val: fresh,           label: 'Fresh',    color: '#6EE7B7' },
            { val: pantry.length,   label: 'Total',    color: '#C4B5FD' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={PT.heroStatDiv} />}
              <View style={PT.heroStat}>
                <Text style={[PT.heroStatN, { color: s.color }]}>{s.val}</Text>
                <Text style={PT.heroStatL}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Use Soon — wrapping 2-row grid ── */}
      {urgentItems.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View style={PT.sectionRow}>
            <View style={[PT.sectionDot, { backgroundColor: CRITICAL }]} />
            <Text style={[PT.sectionTitle, { color: colors.textPrimary }]}>Use Soon</Text>
            <Text style={[PT.sectionCount, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{urgentItems.length}</Text>
          </View>
          <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {urgentItems.map(item => {
              const s = STATUS[item.status];
              return (
                <View key={item.id} style={[PT.urgentCard, { width: URGENT_CARD_W, backgroundColor: isDark ? '#1A1635' : '#FAFAFA', borderColor: s.color + '45' }]}>
                  <Text style={{ fontSize: 24, marginBottom: 5 }}>{item.emoji}</Text>
                  <Text style={[PT.urgentName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                  <View style={[PT.urgentBadge, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={8} color={s.color} />
                    <Text style={[PT.urgentBadgeTxt, { color: s.color }]}>{daysLabel(item.days)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Search + view toggle ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, gap: 8 }}>
        <View style={[PT.search, { flex: 1, backgroundColor: isDark ? '#1A1635' : '#F5F4FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
          <Ionicons name="search" size={14} color={isDark ? '#4B5563' : '#A78BFA'} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search pantry..."
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={[PT.searchInput, { color: colors.textPrimary }]} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={14} color="#A78BFA" /></TouchableOpacity>}
        </View>
        <TouchableOpacity
          onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
          activeOpacity={0.75}
          style={[PT.viewToggle, { backgroundColor: isDark ? '#1A1635' : '#F0EEFF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}
        >
          <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={17} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 7, paddingVertical: 8 }}>
        {CATS.map(c => {
          const on = cat === c;
          return (
            <TouchableOpacity key={c} onPress={() => setCat(c)} activeOpacity={0.75}
              style={[PT.chip, { backgroundColor: on ? ACCENT : (isDark ? 'rgba(108,99,255,0.12)' : '#F0EEFF'), borderColor: on ? ACCENT2 : 'transparent' }]}>
              <Ionicons name={CAT_ICON[c] || 'ellipse-outline'} size={10} color={on ? '#fff' : ACCENT} />
              <Text style={[PT.chipTxt, { color: on ? '#fff' : ACCENT }]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Item list / grid ── */}
      {list.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 36 }}>
          <Text style={{ fontSize: 36 }}>🫙</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#4B5563' : '#9CA3AF', marginTop: 10 }}>Nothing here yet</Text>
        </View>
      ) : viewMode === 'list' ? (
        <View style={{ paddingHorizontal: 16, gap: 7 }}>
          {list.map(item => {
            const s = STATUS[item.status];
            return (
              <TouchableOpacity key={item.id} onPress={() => handleItemPress(item)} activeOpacity={0.82}>
                <GlassCard style={PT.listRow}>
                  <View style={[PT.listEmoji, { backgroundColor: s.color + '15' }]}>
                    <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[PT.listName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[PT.listQtyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                        <Text style={[PT.listQtyTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{item.qty}{item.unit}</Text>
                      </View>
                      <Text style={[PT.listCat, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{item.category}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 5 }}>
                    <View style={[PT.listStatusBadge, { backgroundColor: s.bg }]}>
                      <Ionicons name={s.icon} size={10} color={s.color} />
                      <Text style={[PT.listStatusTxt, { color: s.color }]}>{daysLabel(item.days)}</Text>
                    </View>
                    {!!item.expiry && (
                      <View style={PT.listExpRow}>
                        <Ionicons name="calendar-outline" size={9} color={s.color} />
                        <Text style={[PT.listExpTxt, { color: s.color }]}>Exp {fmtExpiry(item.expiry)}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {list.map(item => {
            const s = STATUS[item.status];
            const cardW = (SCREEN_W - 32 - 10) / 2;
            return (
              <TouchableOpacity key={item.id} onPress={() => handleItemPress(item)} activeOpacity={0.82}>
              <GlassCard style={[PT.gridCard, { width: cardW, borderTopWidth: 3, borderTopColor: s.color }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={[PT.gridEmoji, { backgroundColor: s.color + '15' }]}>
                    <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                  </View>
                  <View style={[PT.gridStatusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[PT.gridStatusTxt, { color: s.color }]}>{daysLabel(item.days)}</Text>
                  </View>
                </View>
                <Text style={[PT.gridName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[PT.gridQty, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{item.qty}{item.unit} · {item.category}</Text>
                <View style={[PT.gridDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6' }]} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {!!item.expiry && <>
                    <Ionicons name="calendar-outline" size={9} color={s.color} />
                    <Text style={[PT.gridExp, { color: s.color }]}>Exp {fmtExpiry(item.expiry)}</Text>
                  </>}
                  <View style={{ flex: 1 }} />
                </View>
              </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
const PT = StyleSheet.create({
  // Hero card
  hero:          { marginHorizontal: 16, padding: 18, borderRadius: 20, overflow: 'hidden' },
  heroBubble1:   { position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  heroBubble2:   { position: 'absolute', bottom: -30, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(167,139,250,0.12)' },
  heroChip:      { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  heroChipTxt:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.9 },
  heroHealthPill:{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7, alignItems: 'center', minWidth: 54 },
  heroHealthN:   { fontSize: 20, fontWeight: '900', color: '#fff' },
  heroHealthL:   { fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  heroLabel:     { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, marginBottom: 2 },
  heroCount:     { fontSize: 42, fontWeight: '900', color: '#fff', lineHeight: 46 },
  heroSub:       { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  heroProgTrack: { height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  heroProgFill:  { height: '100%', borderRadius: 2.5 },
  heroProgMeta:  { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  heroStatDiv:   { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  heroStat:      { flex: 1, alignItems: 'center' },
  heroStatN:     { fontSize: 18, fontWeight: '900' },
  heroStatL:     { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 1 },
  // Use Soon
  sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  sectionDot:    { width: 6, height: 6, borderRadius: 3 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', flex: 1 },
  sectionCount:  { fontSize: 10, fontWeight: '700' },
  urgentCard:    { padding: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 3 },
  urgentName:    { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 },
  urgentBadge:   { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, marginTop: 2 },
  urgentBadgeTxt:{ fontSize: 9, fontWeight: '800' },
  // Search + toggle
  search:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderWidth: 1, gap: 7 },
  searchInput:   { flex: 1, fontSize: 13, padding: 0 },
  viewToggle:    { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // Category chips
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  chipTxt:       { fontSize: 11, fontWeight: '600' },
  // List view
  listRow:       { flexDirection: 'row', alignItems: 'center', padding: 11, gap: 10 },
  listEmoji:     { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listName:      { fontSize: 13, fontWeight: '700' },
  listQtyPill:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  listQtyTxt:    { fontSize: 10, fontWeight: '600' },
  listCat:       { fontSize: 10 },
  listStatusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  listStatusTxt: { fontSize: 12, fontWeight: '800' },
  listExpRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  listExpTxt:    { fontSize: 10, fontWeight: '600' },
  // Grid view
  gridCard:      { padding: 12, borderRadius: 14, overflow: 'hidden' },
  gridEmoji:     { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  gridStatusBadge:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gridStatusTxt: { fontSize: 11, fontWeight: '800' },
  gridName:      { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  gridQty:       { fontSize: 10, marginTop: 2 },
  gridDivider:   { height: 1, marginVertical: 8 },
  gridExp:       { fontSize: 10, fontWeight: '700' },
});

// ── Cart Quantity Sheet (shown when tapping cart in ExpiryTab) ─────────────────
function CartSheet({ item, isDark, colors, onConfirm, onClose }) {
  const [qty,  setQty]  = useState(item?.qty  ?? '1');
  const [unit, setUnit] = useState(item?.unit ?? 'pcs');
  const slideAnim = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }).start();
  }, []);
  const close = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }).start(onClose);
  };
  if (!item) return null;
  const s = STATUS[item.status] || STATUS.fresh;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <TouchableOpacity activeOpacity={1} onPress={close} style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
      <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, transform: [{ translateY: slideAnim }] }}>
        <View style={[CS.sheet, { backgroundColor: isDark ? '#0F0C1D' : '#FAFBFF' }]}>
          <View style={CS.handle} />
          {/* Item preview */}
          <View style={CS.itemRow}>
            <View style={[CS.itemEmoji, { backgroundColor: s.color + '18' }]}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[CS.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[CS.itemMeta, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{item.category} · expires {fmtExpiry(item.expiry)}</Text>
            </View>
            <View style={[CS.urgentTag, { backgroundColor: s.bg }]}>
              <Ionicons name={s.icon} size={10} color={s.color} />
              <Text style={[CS.urgentTagTxt, { color: s.color }]}>{daysLabel(item.days)}</Text>
            </View>
          </View>

          <View style={[CS.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6' }]} />

          <Text style={[CS.sheetTitle, { color: colors.textPrimary }]}>Add to Shopping List</Text>
          <Text style={[CS.sheetSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Set the quantity you need to buy</Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <View style={[CS.field, { flex: 2, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
              <Text style={[CS.fieldLabel, { color: isDark ? '#6B7280' : ACCENT }]}>QUANTITY</Text>
              <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" style={[CS.fieldInput, { color: colors.textPrimary }]} placeholder="e.g. 2" placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} />
            </View>
            <View style={[CS.field, { flex: 1.5, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
              <Text style={[CS.fieldLabel, { color: isDark ? '#6B7280' : ACCENT }]}>UNIT</Text>
              <TextInput value={unit} onChangeText={setUnit} style={[CS.fieldInput, { color: colors.textPrimary }]} placeholder="pcs" placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} />
            </View>
          </View>

          {/* Quick unit chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 10 }}>
            {['pcs', 'g', 'kg', 'ml', 'L', 'pack', 'bottle', 'box'].map(u => (
              <TouchableOpacity key={u} onPress={() => setUnit(u)}
                style={[CS.unitChip, { backgroundColor: unit === u ? ACCENT : (isDark ? 'rgba(108,99,255,0.1)' : '#EEE'), borderColor: unit === u ? ACCENT2 : 'transparent' }]}>
                <Text style={[CS.unitChipTxt, { color: unit === u ? '#fff' : (isDark ? '#9CA3AF' : '#6B7280') }]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={() => { onConfirm({ ...item, qty, unit }); close(); }} activeOpacity={0.85} style={CS.confirmBtn}>
            <LinearGradient colors={[ACCENT3, ACCENT, ACCENT2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={CS.confirmTxt}>Add {qty} {unit} to Shopping</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}
const CS = StyleSheet.create({
  sheet:       { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle:      { width: 32, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  itemRow:     { flexDirection: 'row', alignItems: 'center' },
  itemEmoji:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemName:    { fontSize: 14, fontWeight: '800' },
  itemMeta:    { fontSize: 11, marginTop: 2 },
  urgentTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  urgentTagTxt:{ fontSize: 11, fontWeight: '800' },
  divider:     { height: 1, marginVertical: 14 },
  sheetTitle:  { fontSize: 16, fontWeight: '800' },
  sheetSub:    { fontSize: 12, marginTop: 2 },
  field:       { borderWidth: 1, borderRadius: 10, padding: 10 },
  fieldLabel:  { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  fieldInput:  { fontSize: 16, fontWeight: '700', padding: 0 },
  unitChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  unitChipTxt: { fontSize: 12, fontWeight: '700' },
  confirmBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  confirmTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
});

// ── Expiry Tab ─────────────────────────────────────────────────────────────────
function ExpiryTab({ pantry, onAddToShopping, isDark, colors, navBottom }) {
  const [cartItem, setCartItem] = useState(null);

  const computed = useMemo(() =>
    pantry.map(i => { const d = daysLeft(i.expiry); return { ...i, days: d, status: statusFor(d) }; })
      .sort((a, b) => a.days - b.days),
    [pantry]
  );

  const criticals = computed.filter(i => i.status === 'critical');
  const expirings = computed.filter(i => i.status === 'expiring');
  const freshs    = computed.filter(i => i.status === 'fresh');
  const total     = computed.length;
  const healthyCount = expirings.length + freshs.length;
  const healthPct    = total > 0 ? Math.round((healthyCount / total) * 100) : 100;

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: healthPct / 100, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [healthPct]);
  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const handleCartConfirm = useCallback((item) => { onAddToShopping(item); }, [onAddToShopping]);

  const URGENCY_COLOR = { critical: CRITICAL, expiring: WARN, fresh: OK };

  const groups = [
    { key: 'critical', label: 'Use Now',       items: criticals },
    { key: 'expiring', label: 'Expiring Soon', items: expirings },
    { key: 'fresh',    label: 'All Good',      items: freshs },
  ];

  return (
    <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: navBottom, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>

      {/* ── Gradient Hero ── */}
      <View style={EX.hero}>
        {Platform.OS === 'ios' && <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />}
        <LinearGradient colors={['rgba(100,85,255,0.85)', 'rgba(38,18,100,0.94)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.32)' }} />
        <View style={EX.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={EX.chip}><Text style={EX.chipTxt}>PANTRY HEALTH</Text></View>
            <Text style={EX.heroLabel}>FRESHNESS SCORE</Text>
            <Text style={EX.heroAmt}>{healthPct}%</Text>
            <Text style={EX.heroSub}>{total} items tracked</Text>
          </View>
          <View style={EX.heroRight}>
            <Text style={EX.heroRightN}>{criticals.length}</Text>
            <Text style={EX.heroRightL}>urgent</Text>
          </View>
        </View>
        <View style={EX.progTrack}>
          <Animated.View style={[EX.progFill, { width: widthInterp, backgroundColor: criticals.length > 2 ? CRITICAL : OK }]} />
        </View>
        <View style={EX.progMeta}>
          <Text style={EX.progTxt}>{healthyCount} items healthy</Text>
          <Text style={EX.progTxt}>{healthPct}% fresh or ok</Text>
        </View>
        <View style={EX.divider} />
        <View style={EX.statsRow}>
          {[
            { val: criticals.length.toString(), label: 'Critical', color: '#FCA5A5' },
            { val: expirings.length.toString(), label: 'Expiring', color: '#FCD34D' },
            { val: freshs.length.toString(),    label: 'Fresh',    color: '#6EE7B7' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={EX.statDiv} />}
              <View style={EX.stat}>
                <Text style={[EX.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={EX.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Groups ── */}
      {groups.map(({ key, label, items: gItems }) => {
        if (!gItems.length) return null;
        const urgColor = URGENCY_COLOR[key];
        return (
          <View key={key} style={{ marginBottom: 18 }}>

            {/* Section label — minimal, just text + count */}
            <View style={EX.sectionHdr}>
              <View style={[EX.sectionDot, { backgroundColor: urgColor }]} />
              <Text style={[EX.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label.toUpperCase()}</Text>
              <View style={EX.sectionLine} />
              <Text style={[EX.sectionCount, { color: isDark ? '#4B5563' : '#C4B5FD' }]}>{gItems.length}</Text>
            </View>

            <View style={{ gap: 7 }}>
            {gItems.map(item => (
              <GlassCard key={item.id} style={PT.listRow}>
                <View style={[PT.listEmoji, { backgroundColor: urgColor + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[PT.listName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={[PT.listQtyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                      <Text style={[PT.listQtyTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{item.qty}{item.unit}</Text>
                    </View>
                    <Text style={[PT.listCat, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{item.category}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[PT.listStatusBadge, { backgroundColor: urgColor + '18' }]}>
                    <Ionicons name={STATUS[item.status].icon} size={10} color={urgColor} />
                    <Text style={[PT.listStatusTxt, { color: urgColor }]}>{daysLabel(item.days)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={[PT.listExpRow]}>
                      <Ionicons name="calendar-outline" size={9} color={isDark ? '#4B5563' : '#9CA3AF'} />
                      <Text style={[PT.listExpTxt, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>Exp {fmtExpiry(item.expiry)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setCartItem(item)} activeOpacity={0.8}
                      style={[EX.cartBtn, { backgroundColor: ACCENT + '15' }]}>
                      <Ionicons name="cart-outline" size={11} color={ACCENT} />
                    </TouchableOpacity>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
          </View>
        );
      })}
    </ScrollView>

    {cartItem && (
      <CartSheet item={cartItem} isDark={isDark} colors={colors}
        onConfirm={handleCartConfirm} onClose={() => setCartItem(null)} />
    )}
    </>
  );
}
const EX = StyleSheet.create({
  hero:          { borderRadius: 18, overflow: 'hidden', padding: 16, marginBottom: 16 },
  heroRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  chip:          { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  chipTxt:       { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.8 },
  heroLabel:     { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 2 },
  heroAmt:       { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  heroRight:     { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 52 },
  heroRightN:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroRightL:    { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 1 },
  progTrack:     { height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  progFill:      { height: '100%', borderRadius: 2.5 },
  progMeta:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progTxt:       { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  divider:       { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  statsRow:      { flexDirection: 'row', alignItems: 'center' },
  statDiv:       { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  stat:          { flex: 1, alignItems: 'center' },
  statVal:       { fontSize: 17, fontWeight: '900' },
  statLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 1 },
  // Section header
  sectionHdr:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  sectionDot:    { width: 5, height: 5, borderRadius: 3 },
  sectionLabel:  { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: 'rgba(108,99,255,0.1)' },
  sectionCount:  { fontSize: 9.5, fontWeight: '800' },
  cartBtn:       { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});

// ── Shopping Tab ───────────────────────────────────────────────────────────────
const CAT_COLOR = {
  Dairy: '#3B82F6', Produce: '#10B981', Grains: '#F59E0B',
  Beverages: '#8B5CF6', Snacks: '#EC4899', Frozen: '#06B6D4',
  Condiments: '#F97316', Other: '#6B7280',
};

function ShoppingTab({ isDark, colors, navBottom }) {
  const [items,   setItems]   = useState(SHOPPING_DATA);
  const [newName, setNewName] = useState('');
  const [newQty,  setNewQty]  = useState('');
  const [newUnit, setNewUnit] = useState('pcs');
  const [showAddForm, setShowAddForm] = useState(false);

  const toggle         = useCallback((id) => setItems(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i)), []);
  const remove         = useCallback((id) => setItems(p => p.filter(i => i.id !== id)), []);
  const togglePriority = useCallback((id) => setItems(p => p.map(i => i.id === id ? { ...i, priority: !i.priority } : i)), []);
  const updateQty      = useCallback((id, qty) => setItems(p => p.map(i => i.id === id ? { ...i, qty } : i)), []);
  const add = useCallback(() => {
    if (!newName.trim()) return;
    setItems(p => [...p, { id: Date.now().toString(), name: newName.trim(), qty: newQty || '1', unit: newUnit, category: 'Other', done: false, priority: false }]);
    setNewName(''); setNewQty(''); setShowAddForm(false); Keyboard.dismiss();
  }, [newName, newQty, newUnit]);
  const clearDone = useCallback(() => setItems(p => p.filter(i => !i.done)), []);

  const priority  = items.filter(i => !i.done && i.priority);
  const normal    = items.filter(i => !i.done && !i.priority);
  const done      = items.filter(i => i.done);
  const total     = items.length;
  const doneCount = done.length;
  const remaining = total - doneCount;
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const fillAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: total > 0 ? doneCount / total : 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [doneCount, total]);
  const widthInterp = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  const renderSection = (label, icon, accentColor, sItems, isDone) => {
    if (!sItems.length) return null;
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        {/* Section header */}
        <View style={SH.sectionHdr}>
          <View style={[SH.sectionDot, { backgroundColor: accentColor }]} />
          <Text style={[SH.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{label.toUpperCase()}</Text>
          <View style={SH.sectionLine} />
          {isDone ? (
            <TouchableOpacity onPress={clearDone}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: CRITICAL }}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ fontSize: 10, fontWeight: '800', color: isDark ? '#4B5563' : '#C4B5FD' }}>{sItems.length}</Text>
          )}
        </View>
        {/* Individual cards with gap */}
        <View style={{ gap: 7 }}>
          {sItems.map((item) => (
            <ShopRow key={item.id} item={item}
              onToggle={toggle} onRemove={remove} onTogglePriority={togglePriority} onQtyChange={updateQty}
              isDark={isDark} colors={colors} done={isDone} accentColor={accentColor} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingBottom: navBottom }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* ── Gradient Hero ── */}
      <View style={[SH.hero, { marginHorizontal: 16 }]}>
        {Platform.OS === 'ios' && <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />}
        <LinearGradient colors={['rgba(100,85,255,0.85)', 'rgba(38,18,100,0.94)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.32)' }} />
        <View style={SH.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={SH.chip}><Text style={SH.chipTxt}>TODAY'S TRIP</Text></View>
            <Text style={SH.heroLabel}>ITEMS REMAINING</Text>
            <Text style={SH.heroAmt}>{remaining}</Text>
            <Text style={SH.heroSub}>of {total} total items</Text>
          </View>
          <View style={SH.heroRight}>
            <Text style={SH.heroRightN}>{pct}%</Text>
            <Text style={SH.heroRightL}>done</Text>
          </View>
        </View>
        <View style={SH.progTrack}>
          <Animated.View style={[SH.progFill, { width: widthInterp, backgroundColor: pct >= 80 ? OK : pct >= 40 ? WARN : ACCENT3 }]} />
        </View>
        <View style={SH.progMeta}>
          <Text style={SH.progTxt}>{doneCount} checked off</Text>
          <Text style={SH.progTxt}>{priority.length} priority items</Text>
        </View>
        <View style={SH.divider} />
        <View style={SH.statsRow}>
          {[
            { val: remaining.toString(),       label: 'Remaining', color: '#FCD9A5' },
            { val: priority.length.toString(), label: 'Priority',  color: '#FCA5A5' },
            { val: doneCount.toString(),       label: 'Done',      color: '#6EE7B7' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={SH.statDiv} />}
              <View style={SH.stat}>
                <Text style={[SH.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={SH.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Add item bar ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        {!showAddForm ? (
          <TouchableOpacity onPress={() => setShowAddForm(true)} activeOpacity={0.8}
            style={[SH.addTrigger, { backgroundColor: isDark ? '#1A1635' : '#F5F4FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
            <View style={[SH.addTriggerIcon, { backgroundColor: ACCENT + '18' }]}>
              <Ionicons name="add" size={16} color={ACCENT} />
            </View>
            <Text style={{ fontSize: 13, color: isDark ? '#4B5563' : '#C4B5FD', flex: 1 }}>Add an item to your list...</Text>
            <Ionicons name="chevron-down" size={14} color={ACCENT} />
          </TouchableOpacity>
        ) : (
          <GlassCard style={SH.addForm}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[SH.addFormTitle, { color: colors.textPrimary }]}>New Item</Text>
              <TouchableOpacity onPress={() => { setShowAddForm(false); Keyboard.dismiss(); }}>
                <Ionicons name="close" size={18} color={isDark ? '#6B7280' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>
            <TextInput value={newName} onChangeText={setNewName} placeholder="Item name *"
              placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
              style={[SH.addInput, { color: colors.textPrimary, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput value={newQty} onChangeText={setNewQty} placeholder="Qty" keyboardType="numeric"
                placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                style={[SH.addInput, { flex: 1, color: colors.textPrimary, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]} />
              <TextInput value={newUnit} onChangeText={setNewUnit} placeholder="Unit"
                placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                style={[SH.addInput, { flex: 1, color: colors.textPrimary, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 8 }}>
              {['pcs', 'g', 'kg', 'ml', 'L', 'pack', 'bottle'].map(u => (
                <TouchableOpacity key={u} onPress={() => setNewUnit(u)}
                  style={[SH.unitChip, { backgroundColor: newUnit === u ? ACCENT : (isDark ? 'rgba(108,99,255,0.1)' : '#EEE') }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: newUnit === u ? '#fff' : (isDark ? '#9CA3AF' : '#6B7280') }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={add} activeOpacity={0.85} style={[SH.addBtn, { backgroundColor: ACCENT }]}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Add to List</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </View>

      {renderSection('Priority', 'flame',          CRITICAL, priority, false)}
      {renderSection('To Buy',  'cart-outline',    ACCENT,   normal,   false)}
      {renderSection('Done',    'checkmark-circle', OK,      done,     true)}
    </ScrollView>
  );
}

function ShopRow({ item, onToggle, onRemove, onTogglePriority, onQtyChange, isDark, colors, done, accentColor }) {
  const emoji = item.emoji || CAT_EMOJI[item.category] || '🛒';

  return (
    <GlassCard style={[SH.row, { opacity: done ? 0.55 : 1 }]}>
      {/* Checkbox */}
      <TouchableOpacity onPress={() => onToggle(item.id)} activeOpacity={0.75}
        style={[SH.check, { borderColor: done ? OK : (item.priority ? CRITICAL : accentColor), backgroundColor: done ? OK : 'transparent' }]}>
        {done && <Ionicons name="checkmark" size={11} color="#fff" />}
      </TouchableOpacity>

      {/* Emoji box — always visible, purple-tinted */}
      <View style={[SH.emojiBox, { backgroundColor: isDark ? ACCENT + '22' : ACCENT + '12' }]}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[SH.rowName, { color: colors.textPrimary, textDecorationLine: done ? 'line-through' : 'none' }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <View style={[SH.qtyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
            <Text style={[SH.qtyTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{item.qty} {item.unit}</Text>
          </View>
          <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#9CA3AF' }}>{item.category}</Text>
        </View>
      </View>

      {/* Qty stepper */}
      {!done && (
        <View style={SH.stepper}>
          <TouchableOpacity onPress={() => onQtyChange(item.id, String(Math.max(1, parseInt(item.qty || '1') - 1)))} style={SH.stepBtn}>
            <Ionicons name="remove" size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
          <Text style={[SH.stepVal, { color: colors.textPrimary }]}>{item.qty}</Text>
          <TouchableOpacity onPress={() => onQtyChange(item.id, String(parseInt(item.qty || '1') + 1))} style={SH.stepBtn}>
            <Ionicons name="add" size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Priority + delete */}
      {!done && (
        <TouchableOpacity onPress={() => onTogglePriority(item.id)} activeOpacity={0.7}
          style={[SH.flameBtn, { backgroundColor: item.priority ? CRITICAL + '15' : 'transparent' }]}>
          <Ionicons name={item.priority ? 'flame' : 'flame-outline'} size={14} color={item.priority ? CRITICAL : (isDark ? '#4B5563' : '#D1D5DB')} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => onRemove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ padding: 3 }}>
        <Ionicons name="trash-outline" size={12} color={isDark ? '#374151' : '#D1D5DB'} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const SH = StyleSheet.create({
  hero:         { borderRadius: 18, overflow: 'hidden', padding: 16 },
  heroRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  chip:         { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  chipTxt:      { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.8 },
  heroLabel:    { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2, marginBottom: 2 },
  heroAmt:      { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  heroRight:    { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', minWidth: 52 },
  heroRightN:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroRightL:   { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 1 },
  progTrack:    { height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  progFill:     { height: '100%', borderRadius: 2.5 },
  progMeta:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  progTxt:      { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  statsRow:     { flexDirection: 'row', alignItems: 'center' },
  statDiv:      { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  stat:         { flex: 1, alignItems: 'center' },
  statVal:      { fontSize: 17, fontWeight: '900' },
  statLabel:    { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 1 },
  // Add trigger
  addTrigger:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12, borderWidth: 1 },
  addTriggerIcon:{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // Add form
  addForm:       { padding: 12 },
  addFormTitle:  { fontSize: 13, fontWeight: '800' },
  addInput:      { fontSize: 13, padding: 10, borderRadius: 9, borderWidth: 1 },
  unitChip:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  // Section header — same minimal style as expiry
  sectionHdr:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  sectionDot:    { width: 5, height: 5, borderRadius: 3 },
  sectionLabel:  { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: 'rgba(108,99,255,0.1)' },
  // Row — GlassCard based
  row:           { flexDirection: 'row', alignItems: 'center', padding: 11, gap: 10 },
  check:         { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emojiBox:      { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowName:       { fontSize: 13, fontWeight: '700' },
  qtyPill:       { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  qtyTxt:        { fontSize: 10, fontWeight: '600' },
  stepper:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,99,255,0.08)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  stepBtn:       { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  stepVal:       { fontSize: 11, fontWeight: '800', minWidth: 16, textAlign: 'center' },
  flameBtn:      { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
});

// ── Meals Tab ──────────────────────────────────────────────────────────────────

const MEAL_CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];
const CAT_ICON_MEAL   = { All: 'apps-outline', Breakfast: 'sunny-outline', Lunch: 'partly-sunny-outline', Dinner: 'moon-outline', Snacks: 'nutrition-outline', Desserts: 'ice-cream-outline' };
const RECIPE_CARD_W   = 158;

function MealsTab({ pantry, isDark, colors, navBottom }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [bookmarked,     setBookmarked]     = useState(new Set());

  const pantryNames = useMemo(() => new Set(pantry.map(p => p.name)), [pantry]);

  const meals = useMemo(() =>
    MEALS_DATA.map(m => {
      const owned    = m.uses.filter(u => pantryNames.has(u)).length;
      const total    = m.uses.length;
      const coverage = total === 0 ? 55 : Math.round((owned / total) * 100);
      return { ...m, owned, total, coverage, ready: total > 0 && coverage === 100 };
    }).sort((a, b) => b.coverage - a.coverage),
    [pantryNames]
  );

  const featured   = meals[0];
  const readyNow   = meals.filter(m => m.ready);
  const expirySet  = useMemo(() => new Set(pantry.filter(p => daysLeft(p.expiry) <= 3).map(p => p.name)), [pantry]);
  const urgency    = meals.filter(m => m.uses.some(u => expirySet.has(u)));
  const filtered   = activeCategory === 'All' ? meals : meals.filter(m => m.category === activeCategory);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const GRID_W = Math.floor((SCREEN_W - 32 - 10) / 2);

  const toggleBookmark = useCallback(id => {
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const goRecipe = useCallback(id => router.push(`/(app)/kitchen/recipe/${id}`), []);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 14, paddingBottom: navBottom }} showsVerticalScrollIndicator={false}>

      {/* ── Cinematic Hero ── */}
      <TouchableOpacity onPress={() => goRecipe(featured.id)} activeOpacity={0.92} style={{ marginHorizontal: 16, marginBottom: 14 }}>
        <View style={ML.hero}>
          {Platform.OS === 'ios' && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={['rgba(88,70,230,0.95)', 'rgba(26,10,80,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {/* Decorative bubbles */}
          <View style={[ML.bubble1]} /><View style={[ML.bubble2]} />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.28)' }} />

          {/* Top row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={ML.chefChip}><Ionicons name="star" size={9} color="#FFD700" /><Text style={ML.chefChipTxt}>CHEF'S PICK TODAY</Text></View>
            {featured.ready && (
              <View style={ML.readyPill}><Ionicons name="checkmark-circle" size={10} color={OK} /><Text style={ML.readyPillTxt}>Ready!</Text></View>
            )}
          </View>

          {/* Big emoji */}
          <View style={ML.heroEmojiWrap}>
            <View style={ML.heroEmojiCircle}><Text style={{ fontSize: 56 }}>{featured.emoji}</Text></View>
          </View>

          {/* Name */}
          <Text style={ML.heroName}>{featured.name}</Text>
          <Text style={ML.heroCategory}>{featured.category} · {featured.tags[0]}</Text>

          {/* Info chips */}
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { icon: 'time-outline',  label: `${featured.time} min` },
              { icon: 'flame-outline', label: `${featured.cal} cal` },
              { icon: 'star-outline',  label: featured.diff },
              { icon: 'people-outline',label: `${featured.servings} servings` },
            ].map(c => (
              <View key={c.label} style={ML.heroInfoChip}>
                <Ionicons name={c.icon} size={10} color="rgba(255,255,255,0.7)" />
                <Text style={ML.heroInfoTxt}>{c.label}</Text>
              </View>
            ))}
          </View>

          {/* Coverage */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={ML.heroCoverLabel}>Pantry coverage</Text>
              <Text style={ML.heroCoverPct}>{featured.coverage}%</Text>
            </View>
            <View style={ML.heroCoverTrack}>
              <View style={[ML.heroCoverFill, { width: `${featured.coverage}%`, backgroundColor: featured.ready ? OK : ACCENT3 }]} />
            </View>
          </View>

          {/* CTA */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <View style={[ML.heroCTA, { flex: 1, backgroundColor: featured.ready ? OK : ACCENT }]}>
              <Ionicons name="restaurant" size={13} color="#fff" />
              <Text style={ML.heroCTATxt}>{featured.ready ? 'Cook Now' : 'View Recipe'}</Text>
            </View>
            <View style={[ML.heroCTA, { backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 12 }]}>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Urgency Banner ── */}
      {urgency.length > 0 && (
        <View style={[ML.urgencyBanner, { marginHorizontal: 16 }]}>
          <LinearGradient colors={['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.08)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
          <View style={[ML.urgencyIcon, { backgroundColor: CRITICAL + '25' }]}>
            <Ionicons name="warning" size={15} color={CRITICAL} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ML.urgencyTitle, { color: CRITICAL }]}>Use before it expires!</Text>
            <Text style={[ML.urgencySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {urgency.map(m => m.emoji + ' ' + m.name).slice(0, 2).join(' · ')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={CRITICAL} />
        </View>
      )}

      {/* ── Category Strip ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 7, paddingVertical: 12 }}>
        {MEAL_CATEGORIES.map(cat => {
          const on = activeCategory === cat;
          return (
            <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)} activeOpacity={0.8}
              style={[ML.catChip, { backgroundColor: on ? ACCENT : (isDark ? 'rgba(255,255,255,0.07)' : '#F5F3FF'), borderColor: on ? ACCENT2 : (isDark ? 'rgba(255,255,255,0.1)' : '#E0DBFF') }]}>
              <Ionicons name={CAT_ICON_MEAL[cat]} size={12} color={on ? '#fff' : (isDark ? '#6B7280' : '#7C3AED')} />
              <Text style={[ML.catChipTxt, { color: on ? '#fff' : (isDark ? '#6B7280' : '#7C3AED') }]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Ready to Cook ── */}
      {readyNow.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={ML.sectionHdr}>
            <View style={[ML.sectionDot, { backgroundColor: OK }]} />
            <Text style={[ML.sectionTitle, { color: colors.textPrimary }]}>Ready to Cook</Text>
            <View style={ML.sectionLine} />
            <Text style={[ML.sectionCount, { color: isDark ? '#4B5563' : '#C4B5FD' }]}>{readyNow.length}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {readyNow.map(meal => (
              <TouchableOpacity key={meal.id} onPress={() => goRecipe(meal.id)} activeOpacity={0.88}>
                <View style={[ML.hCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#fff', borderRadius: 14, borderWidth: isDark ? 0 : 1, borderColor: '#EEE9FF' }]}>
                  {/* Gradient top */}
                  <View style={ML.hCardTop}>
                    <LinearGradient colors={['rgba(88,70,230,0.82)', 'rgba(26,10,80,0.92)']} style={StyleSheet.absoluteFill} />
                    <TouchableOpacity onPress={() => toggleBookmark(meal.id)} activeOpacity={0.8} style={ML.hCardBookmark}>
                      <Ionicons name={bookmarked.has(meal.id) ? 'bookmark' : 'bookmark-outline'} size={15} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 44 }}>{meal.emoji}</Text>
                    <View style={ML.hCardReadyBadge}>
                      <Ionicons name="checkmark-circle" size={10} color={OK} />
                      <Text style={{ fontSize: 9, fontWeight: '800', color: OK }}>Ready</Text>
                    </View>
                  </View>
                  {/* Bottom info */}
                  <View style={ML.hCardBottom}>
                    <Text style={[ML.hCardName, { color: colors.textPrimary }]} numberOfLines={2}>{meal.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Ionicons name="time-outline" size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      <Text style={[ML.hCardChipTxt, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{meal.time}m</Text>
                      <Text style={{ color: isDark ? '#374151' : '#D1D5DB' }}>·</Text>
                      <Ionicons name="flame-outline" size={10} color={isDark ? '#6B7280' : '#9CA3AF'} />
                      <Text style={[ML.hCardChipTxt, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{meal.cal} cal</Text>
                    </View>
                    <View style={[ML.hCardCookBtn, { backgroundColor: ACCENT + '15', marginTop: 8 }]}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: ACCENT }}>Cook Now</Text>
                      <Ionicons name="arrow-forward" size={10} color={ACCENT} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Meal Plan Strip ── */}
      <View style={[ML.planCard, {
        marginHorizontal: 16, marginBottom: 16,
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: isDark ? 'rgba(108,99,255,0.18)' : '#DDD9FF',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0 : 0.1,
        shadowRadius: 16,
        elevation: 4,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <LinearGradient colors={[ACCENT, ACCENT2]} style={ML.planIconGrad}>
            <Ionicons name="calendar" size={15} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[ML.planTitle, { color: colors.textPrimary }]}>Weekly Meal Plan</Text>
            <Text style={[ML.planSub, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>Plan your meals for the week</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/kitchen/meal-plan')} activeOpacity={0.85}
            style={[ML.planBtn, { backgroundColor: ACCENT }]}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>Plan Week</Text>
            <Ionicons name="arrow-forward" size={11} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {DAYS.map((d, i) => {
            const isToday = i === new Date().getDay() - 1;
            return (
              <TouchableOpacity key={d} onPress={() => router.push('/(app)/kitchen/meal-plan')} activeOpacity={0.8}
                style={[ML.daySlot, { backgroundColor: isToday ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF'), borderColor: isToday ? ACCENT2 : (isDark ? 'rgba(255,255,255,0.08)' : '#EDE9FE') }]}>
                <Text style={[ML.dayLabel, { color: isToday ? 'rgba(255,255,255,0.75)' : (isDark ? '#4B5563' : '#C4B5FD') }]}>{d}</Text>
                <Ionicons name="add" size={15} color={isToday ? '#fff' : (isDark ? '#374151' : '#C4B5FD')} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Explore All ── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[ML.sectionHdr, { marginBottom: 10 }]}>
          <View style={[ML.sectionDot, { backgroundColor: ACCENT }]} />
          <Text style={[ML.sectionTitle, { color: colors.textPrimary }]}>Explore Recipes</Text>
          <View style={ML.sectionLine} />
          <TouchableOpacity onPress={() => router.push('/(app)/kitchen/add-recipe')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="add-circle-outline" size={14} color={ACCENT} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: ACCENT }}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {filtered.map(meal => (
            <TouchableOpacity key={meal.id} onPress={() => goRecipe(meal.id)} activeOpacity={0.88}>
              <GlassCard style={[ML.gridCard, { width: GRID_W }]}>
                {/* Top row: emoji + bookmark */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={[ML.gridEmoji, { backgroundColor: isDark ? ACCENT + '22' : ACCENT + '12' }]}>
                    <Text style={{ fontSize: 26 }}>{meal.emoji}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleBookmark(meal.id)} style={{ padding: 2 }}>
                    <Ionicons name={bookmarked.has(meal.id) ? 'bookmark' : 'bookmark-outline'} size={16} color={bookmarked.has(meal.id) ? ACCENT : (isDark ? '#374151' : '#D1D5DB')} />
                  </TouchableOpacity>
                </View>
                <Text style={[ML.gridName, { color: colors.textPrimary }]} numberOfLines={2}>{meal.name}</Text>
                <Text style={[ML.gridMeta, { color: isDark ? '#4B5563' : '#9CA3AF' }]}>{meal.time}m · {meal.cal} cal</Text>

                {/* Coverage bar */}
                <View style={[ML.gridCoverTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#EDE9FE', marginTop: 8 }]}>
                  <View style={[ML.gridCoverFill, { width: `${meal.coverage}%`, backgroundColor: meal.ready ? OK : ACCENT }]} />
                </View>

                {/* Bottom row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                  <View style={[ML.diffBadge, { backgroundColor: meal.diff === 'Easy' ? OK + '18' : meal.diff === 'Medium' ? WARN + '18' : CRITICAL + '18' }]}>
                    <Text style={[ML.diffTxt, { color: meal.diff === 'Easy' ? OK : meal.diff === 'Medium' ? WARN : CRITICAL }]}>{meal.diff}</Text>
                  </View>
                  {meal.uses.length > 0 ? (
                    <Text style={{ fontSize: 9, fontWeight: '700', color: meal.ready ? OK : (isDark ? '#4B5563' : '#9CA3AF') }}>
                      {meal.owned}/{meal.uses.length} in pantry
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#4B5563' : '#9CA3AF' }}>custom</Text>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
const ML = StyleSheet.create({
  // Hero
  hero:           { borderRadius: 20, overflow: 'hidden', padding: 18 },
  bubble1:        { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.06)' },
  bubble2:        { position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(167,139,250,0.1)' },
  chefChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.2)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  chefChipTxt:    { fontSize: 9, fontWeight: '800', color: '#FFD700', letterSpacing: 0.7 },
  readyPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: OK + '20', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  readyPillTxt:   { fontSize: 9, fontWeight: '800', color: OK },
  heroEmojiWrap:  { alignItems: 'center', paddingVertical: 16 },
  heroEmojiCircle:{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroName:       { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  heroCategory:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3, fontWeight: '600' },
  heroInfoChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  heroInfoTxt:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  heroCoverLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.7 },
  heroCoverPct:   { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  heroCoverTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  heroCoverFill:  { height: '100%', borderRadius: 2 },
  heroCTA:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12 },
  heroCTATxt:     { fontSize: 13, fontWeight: '800', color: '#fff' },
  // Urgency
  urgencyBanner:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: CRITICAL + '35', marginBottom: 4, overflow: 'hidden' },
  urgencyIcon:    { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  urgencyTitle:   { fontSize: 12, fontWeight: '800' },
  urgencySub:     { fontSize: 10, marginTop: 1 },
  // Category strip
  catChip:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  catChipTxt:     { fontSize: 11, fontWeight: '700' },
  // Section header
  sectionHdr:     { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, marginBottom: 8 },
  sectionDot:     { width: 6, height: 6, borderRadius: 3 },
  sectionTitle:   { fontSize: 13, fontWeight: '800' },
  sectionLine:    { flex: 1, height: 1, backgroundColor: 'rgba(108,99,255,0.1)' },
  sectionCount:   { fontSize: 10, fontWeight: '800' },
  // Horizontal recipe card
  hCard:          { width: RECIPE_CARD_W, padding: 0, overflow: 'hidden', shadowOpacity: 0, elevation: 0 },
  hCardTop:       { height: 116, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 6 },
  hCardReadyBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: OK + '28', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  hCardBookmark:  { position: 'absolute', top: 8, right: 8 },
  hCardBottom:    { padding: 10 },
  hCardName:      { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  hCardChipTxt:   { fontSize: 10, fontWeight: '600' },
  hCardCookBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: 8 },
  // Meal plan strip
  planCard:       { padding: 14 },
  planIconGrad:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  planTitle:      { fontSize: 13, fontWeight: '800' },
  planSub:        { fontSize: 10, marginTop: 1 },
  planBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  daySlot:        { width: 46, alignItems: 'center', paddingVertical: 9, borderRadius: 10, borderWidth: 1, gap: 3 },
  dayLabel:       { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  // Grid
  gridCard:       { padding: 12, overflow: 'hidden' },
  gridEmoji:      { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gridName:       { fontSize: 13, fontWeight: '800', lineHeight: 17, marginTop: 2 },
  gridMeta:       { fontSize: 10, marginTop: 3 },
  gridCoverTrack: { height: 3, borderRadius: 1.5, overflow: 'hidden' },
  gridCoverFill:  { height: '100%', borderRadius: 1.5 },
  diffBadge:      { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  diffTxt:        { fontSize: 9, fontWeight: '800' },
});

// ── Date Field (DD / MM / YYYY auto-advance) ───────────────────────────────────
function DateField({ label, value, onChange, isDark, colors }) {
  const mmRef   = useRef();
  const yyyyRef = useRef();
  const [dd,   setDd]   = useState('');
  const [mm,   setMm]   = useState('');
  const [yyyy, setYyyy] = useState('');

  useEffect(() => {
    if (value && value.length >= 8) {
      const [y, mo, d] = value.split('-');
      setYyyy(y || '');
      setMm(mo || '');
      setDd((d || '').slice(0, 2));
    }
  }, []);

  const emit = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) onChange(`${y}-${m}-${d}`);
  };
  const handleDd = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 2);
    setDd(c); emit(c, mm, yyyy);
    if (c.length === 2) mmRef.current?.focus();
  };
  const handleMm = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 2);
    setMm(c); emit(dd, c, yyyy);
    if (c.length === 2) yyyyRef.current?.focus();
  };
  const handleYyyy = (v) => {
    const c = v.replace(/\D/g, '').slice(0, 4);
    setYyyy(c); emit(dd, mm, c);
  };
  const box = {
    flex: 1, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', paddingVertical: 11,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E8E6FF',
  };
  return (
    <View style={{ marginBottom: 14 }}>
      {!!label && <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', marginBottom: 6 }}>{label}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={box}>
          <TextInput value={dd} onChangeText={handleDd} keyboardType="numeric" placeholder="DD" maxLength={2}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
        <Text style={{ fontWeight: '800', color: isDark ? '#4B5563' : '#9CA3AF', fontSize: 18 }}>/</Text>
        <View style={box}>
          <TextInput ref={mmRef} value={mm} onChangeText={handleMm} keyboardType="numeric" placeholder="MM" maxLength={2}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
        <Text style={{ fontWeight: '800', color: isDark ? '#4B5563' : '#9CA3AF', fontSize: 18 }}>/</Text>
        <View style={[box, { flex: 2 }]}>
          <TextInput ref={yyyyRef} value={yyyy} onChangeText={handleYyyy} keyboardType="numeric" placeholder="YYYY" maxLength={4}
            placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
            style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center', padding: 0 }} />
        </View>
      </View>
    </View>
  );
}

// ── Edit Pantry Item Sheet ─────────────────────────────────────────────────────
const EDIT_LOCS      = ['Pantry', 'Fridge', 'Freezer', 'Counter'];
const EDIT_LOC_ICON  = { Pantry: 'cube-outline', Fridge: 'snow-outline', Freezer: 'thermometer-outline', Counter: 'home-outline' };
const EDIT_UNITS     = ['pcs', 'g', 'kg', 'ml', 'L', 'pack', 'bottle', 'box'];

function EditPantrySheet({ item, visible, onClose, onSave, onDelete, isDark, colors }) {
  const insets       = useSafeAreaInsets();
  const slideAnim    = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [qty,      setQty]      = useState('1');
  const [unit,     setUnit]     = useState('pcs');
  const [location, setLocation] = useState('Pantry');
  const [expiry,   setExpiry]   = useState('');
  const [notes,    setNotes]    = useState('');

  useEffect(() => {
    if (visible && item) {
      setQty(String(item.qty || '1'));
      setUnit(item.unit || 'pcs');
      setLocation(item.storageLocation || item.location || 'Pantry');
      setExpiry(item.expiryDate || item.expiry || '');
      setNotes(item.notes || '');
      slideAnim.setValue(SCREEN_H);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, item]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  }, [onClose]);

  const save = useCallback(() => {
    onSave(item.id, {
      qty:             Number(qty) || 1,
      unit,
      storageLocation: location,
      expiryDate:      expiry || undefined,
      notes:           notes  || undefined,
    });
    close();
  }, [item, qty, unit, location, expiry, notes, close, onSave]);

  if (!visible || !item) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.58)', opacity: backdropAnim }]}>
        <TouchableOpacity activeOpacity={1} onPress={close} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <Animated.View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, transform: [{ translateY: slideAnim }] }}>
        <View style={{ backgroundColor: isDark ? '#0F0C1D' : '#FAFBFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: (insets.bottom || 14) + 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: isDark ? '#374151' : '#D1D5DB' }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: isDark ? '#4B5563' : '#9CA3AF', marginTop: 2 }}>{item.category}</Text>
              </View>
              <Text style={{ fontSize: 30 }}>{item.emoji || '📦'}</Text>
            </View>

            {/* Qty + Unit */}
            <Text style={ES.fieldLabel}>QUANTITY</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <View style={[ES.inputBox, { flex: 1, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
                <TextInput value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="1"
                  placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                  style={[ES.input, { color: colors.textPrimary }]} />
              </View>
              <View style={[ES.inputBox, { flex: 1.5, backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
                <TextInput value={unit} onChangeText={setUnit} placeholder="pcs"
                  placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                  style={[ES.input, { color: colors.textPrimary }]} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
              {EDIT_UNITS.map(u => (
                <TouchableOpacity key={u} onPress={() => setUnit(u)} activeOpacity={0.8}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: unit === u ? ACCENT : (isDark ? 'rgba(108,99,255,0.1)' : '#EEE') }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: unit === u ? '#fff' : (isDark ? '#9CA3AF' : '#6B7280') }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Storage Location */}
            <Text style={ES.fieldLabel}>STORAGE LOCATION</Text>
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
              {EDIT_LOCS.map(loc => (
                <TouchableOpacity key={loc} onPress={() => setLocation(loc)} activeOpacity={0.8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                    backgroundColor: location === loc ? ACCENT       : (isDark ? 'rgba(255,255,255,0.06)' : '#F5F3FF'),
                    borderColor:     location === loc ? '#5851E6'    : (isDark ? 'rgba(255,255,255,0.08)' : '#EDE9FE') }}>
                  <Ionicons name={EDIT_LOC_ICON[loc]} size={13} color={location === loc ? '#fff' : (isDark ? '#6B7280' : '#7C3AED')} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: location === loc ? '#fff' : (isDark ? '#6B7280' : '#7C3AED') }}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Expiry Date */}
            <DateField label="Expiry Date" value={expiry} onChange={setExpiry} isDark={isDark} colors={colors} />

            {/* Notes */}
            <Text style={ES.fieldLabel}>NOTES (optional)</Text>
            <View style={[ES.inputBox, { backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF', minHeight: 64 }]}>
              <TextInput value={notes} onChangeText={setNotes} multiline placeholder="Optional notes…"
                placeholderTextColor={isDark ? '#374151' : '#C4B5FD'}
                style={[ES.input, { color: colors.textPrimary, textAlignVertical: 'top' }]} />
            </View>

            {/* Save */}
            <TouchableOpacity onPress={save} activeOpacity={0.88} style={{ marginTop: 16, borderRadius: 13, overflow: 'hidden' }}>
              <LinearGradient colors={[ACCENT, ACCENT2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 14 }}>
                <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#fff' }}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Remove Item', `Remove "${item.name}" from pantry?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => { close(); onDelete(item.id); } },
                ]);
              }}
              activeOpacity={0.8}
              style={{ marginTop: 10, borderRadius: 13, borderWidth: 1.5, borderColor: '#EF4444', paddingVertical: 13, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Remove from Pantry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}
const ES = StyleSheet.create({
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, color: '#9CA3AF', marginBottom: 7 },
  inputBox:   { borderWidth: 1.5, borderRadius: 10, overflow: 'hidden' },
  input:      { paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 11 : 9, fontSize: 14, fontWeight: '600' },
});

// ── Add Item Sheet ─────────────────────────────────────────────────────────────
function AddSheet({ visible, onClose, onSave, isDark, colors }) {
  const insets       = useSafeAreaInsets();
  const slideAnim    = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetHAnim   = useRef(new Animated.Value(SCREEN_H * 0.66)).current;
  const kbLiftAnim   = useRef(new Animated.Value(0)).current;
  const sheetHRef    = useRef(SCREEN_H * 0.66);

  const [mode,     setMode]     = useState('choice');
  const [name,     setName]     = useState('');
  const [qty,      setQty]      = useState('');
  const [unit,     setUnit]     = useState('pcs');
  const [category, setCategory] = useState('Produce');
  const [expiry,   setExpiry]   = useState('');

  const resetForm = () => { setMode('choice'); setName(''); setQty(''); setUnit('pcs'); setCategory('Produce'); setExpiry(''); };

  useEffect(() => {
    if (visible) {
      sheetHAnim.setValue(SCREEN_H * 0.66); sheetHRef.current = SCREEN_H * 0.66;
      slideAnim.setValue(SCREEN_H); backdropAnim.setValue(0); kbLiftAnim.setValue(0);
      resetForm();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      const kb = e.endCoordinates.height;
      const newH = Math.min(sheetHRef.current, SCREEN_H - kb - 44);
      sheetHRef.current = newH;
      Animated.parallel([
        Animated.timing(kbLiftAnim, { toValue: kb, duration: e.duration || 260, useNativeDriver: false }),
        Animated.timing(sheetHAnim, { toValue: newH, duration: e.duration || 260, useNativeDriver: false }),
      ]).start();
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', (e) => {
      const h = SCREEN_H * 0.66;
      sheetHRef.current = h;
      Animated.parallel([
        Animated.timing(kbLiftAnim, { toValue: 0, duration: e.duration || 260, useNativeDriver: false }),
        Animated.timing(sheetHAnim, { toValue: h, duration: e.duration || 260, useNativeDriver: false }),
      ]).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const close = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(kbLiftAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(onClose);
  }, [onClose]);

  const save = useCallback(() => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    const d7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
    onSave({ id: Date.now().toString(), name: name.trim(), qty: qty || '1', unit, category, expiry: expiry || d7, expiryDate: expiry || d7, emoji: '🛒' });
    close();
  }, [name, qty, unit, category, expiry, close, onSave]);

  if (!visible) return null;

  const sheetBg = isDark ? '#0F0C1D' : '#FAFBFF';

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.58)', opacity: backdropAnim }]}>
        <TouchableOpacity activeOpacity={1} onPress={close} style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <Animated.View style={{ position: 'absolute', bottom: kbLiftAnim, left: 0, right: 0 }}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Animated.View style={{ height: sheetHAnim, backgroundColor: sheetBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', paddingBottom: insets.bottom || 14 }}>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: isDark ? '#374151' : '#D1D5DB' }} />
            </View>

            {mode === 'choice' ? (
              <View style={{ flex: 1, paddingHorizontal: 18 }}>
                <Text style={[AS.sheetTitle, { color: colors.textPrimary }]}>Add to Pantry</Text>
                <Text style={[AS.sheetSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>How would you like to add?</Text>

                <View style={{ gap: 10, marginTop: 18 }}>
                  <TouchableOpacity onPress={() => { close(); setTimeout(() => router.push('/(app)/kitchen/scan'), 320); }}
                    activeOpacity={0.85}
                    style={[AS.choice, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '35' }]}>
                    <View style={[AS.choiceIcon, { backgroundColor: ACCENT }]}>
                      <Ionicons name="barcode-outline" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[AS.choiceTitle, { color: colors.textPrimary }]}>Scan Barcode</Text>
                      <Text style={[AS.choiceSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Point camera at the product</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={ACCENT} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setMode('manual')} activeOpacity={0.85}
                    style={[AS.choice, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                    <View style={[AS.choiceIcon, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                      <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[AS.choiceTitle, { color: colors.textPrimary }]}>Add Manually</Text>
                      <Text style={[AS.choiceSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>Type item details by hand</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={isDark ? '#4B5563' : '#D1D5DB'} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 18 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => setMode('choice')} style={{ padding: 3 }}>
                    <Ionicons name="arrow-back" size={18} color={ACCENT} />
                  </TouchableOpacity>
                  <Text style={[AS.sheetTitle, { color: colors.textPrimary }]}>Manual Entry</Text>
                </View>

                {[
                  { label: 'ITEM NAME *', placeholder: 'e.g. Full Cream Milk', value: name, setter: setName, keyboard: 'default' },
                  { label: 'QUANTITY',    placeholder: 'e.g. 500',             value: qty,  setter: setQty,  keyboard: 'numeric' },
                  { label: 'UNIT',        placeholder: 'g / ml / pcs / kg',    value: unit, setter: setUnit, keyboard: 'default' },
                ].map(f => (
                  <View key={f.label} style={{ marginBottom: 12 }}>
                    <Text style={[AS.fieldLabel, { color: isDark ? '#6B7280' : '#7C3AED' }]}>{f.label}</Text>
                    <View style={[AS.fieldBox, { backgroundColor: isDark ? 'rgba(108,99,255,0.08)' : '#F5F3FF', borderColor: isDark ? 'rgba(108,99,255,0.2)' : '#DDD9FF' }]}>
                      <TextInput value={f.value} onChangeText={f.setter} placeholder={f.placeholder} keyboardType={f.keyboard}
                        placeholderTextColor={isDark ? '#374151' : '#C4B5FD'} style={[AS.fieldInput, { color: colors.textPrimary }]} />
                    </View>
                  </View>
                ))}
                <Text style={[AS.fieldLabel, { color: isDark ? '#6B7280' : '#7C3AED' }]}>EXPIRY DATE</Text>
                <DateField value={expiry} onChange={setExpiry} isDark={isDark} colors={{ textPrimary: colors.textPrimary }} />

                <Text style={[AS.fieldLabel, { color: isDark ? '#6B7280' : '#7C3AED', marginBottom: 7 }]}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 14 }}>
                  {CATS.filter(c => c !== 'All').map(c => (
                    <TouchableOpacity key={c} onPress={() => setCategory(c)}
                      style={[AS.catChip, { backgroundColor: category === c ? ACCENT : (isDark ? 'rgba(108,99,255,0.1)' : '#F0EEFF'), borderColor: category === c ? ACCENT2 : 'transparent' }]}>
                      <Text style={[AS.catTxt, { color: category === c ? '#fff' : ACCENT }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity onPress={save} activeOpacity={0.85} style={AS.saveBtn}>
                  <LinearGradient colors={[ACCENT3, ACCENT, ACCENT2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: 11 }]} />
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={AS.saveTxt}>Add to Pantry</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
const AS = StyleSheet.create({
  sheetTitle:  { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  sheetSub:    { fontSize: 11 },
  choice:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 12, borderWidth: 1 },
  choiceIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontSize: 14, fontWeight: '800' },
  choiceSub:   { fontSize: 11, marginTop: 2 },
  fieldLabel:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.9, marginBottom: 5 },
  fieldBox:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  fieldInput:  { fontSize: 14, padding: 0 },
  catChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  catTxt:      { fontSize: 11, fontWeight: '700' },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 11, overflow: 'hidden', marginTop: 4 },
  saveTxt:     { fontSize: 14, fontWeight: '800', color: '#fff' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function KitchenScreen() {
  const { colors, isDark } = useTheme();
  const [tab,      setTab]      = useState('Pantry');
  const [addOpen,  setAddOpen]  = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { items: pantry, addItem, deleteItemRemote, updateItemRemote } = usePantryStore();

  const NAV_BOTTOM = 110;

  const addToShop = useCallback((item) => Alert.alert('Added', `${item.name} added to shopping list.`), []);

  const handleDelete = useCallback((id) => {
    Alert.alert('Remove Item', 'Remove from pantry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItemRemote(id) },
    ]);
  }, [deleteItemRemote]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0818' : '#F8F7FF' }}>
      {tab === 'Pantry'   && <PantryTab   pantry={pantry} isDark={isDark} colors={colors} navBottom={NAV_BOTTOM} onEdit={setEditItem} onDelete={handleDelete} />}
      {tab === 'Expiry'   && <ExpiryTab   pantry={pantry} onAddToShopping={addToShop} isDark={isDark} colors={colors} navBottom={NAV_BOTTOM} />}
      {tab === 'Shopping' && <ShoppingTab isDark={isDark} colors={colors} navBottom={NAV_BOTTOM} />}
      {tab === 'Meals'    && <MealsTab    pantry={pantry} isDark={isDark} colors={colors} navBottom={NAV_BOTTOM} />}

      <AppBottomNav
        tabs={KITCHEN_TABS}
        active={tab}
        onPress={(t) => setTab(t.id)}
        onAdd={() => router.push('/(app)/kitchen/scan')}
        isDark={isDark}
        accentColor={ACCENT}
      />
      <AddSheet visible={addOpen} onClose={() => setAddOpen(false)} onSave={addItem} isDark={isDark} colors={colors} />
      <EditPantrySheet
        item={editItem}
        visible={!!editItem}
        onClose={() => setEditItem(null)}
        onSave={updateItemRemote}
        onDelete={handleDelete}
        isDark={isDark}
        colors={colors}
      />
    </View>
  );
}
