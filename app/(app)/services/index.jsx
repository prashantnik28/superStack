import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

// ── Data ──────────────────────────────────────────────────────────────────────

const SUBSCRIBED = [
  { id: 'c', name: 'Cleaning', icon: 'sparkles', color: '#6C63FF', status: 'active', detail: 'Next: Tomorrow, 10 AM' },
  { id: 'm', name: 'Milk Delivery', icon: 'water', color: '#4CAF82', status: 'active', detail: 'Daily · 7:00 AM' },
  { id: 'g', name: 'Grocery', icon: 'cart', color: '#FFB347', status: 'active', detail: 'Arrives Wed, 3–5 PM' },
  { id: 'r', name: 'Repair Service', icon: 'construct', color: '#FF6B9D', status: 'on-demand', detail: 'On request' },
  { id: 'l', name: 'Laundry', icon: 'shirt', color: '#9C27B0', status: 'active', detail: 'Pickup: Friday' },
];

const FEATURED = {
  id: 'kitchen',
  name: 'Kitchen',
  tagline: 'App of the Week',
  description: 'Track expiry dates, manage your pantry and auto-generate shopping lists for your family.',
  icon: 'restaurant',
  gradient: ['#FF8C42', '#FFB347', '#E67E22'],
  route: '/(app)/kitchen',
};

const MOST_USED = [
  { id: 'wardrobe',  name: 'Wardrobe',  icon: 'shirt',            color: '#6C63FF', route: '/(app)/wardrobe' },
  { id: 'kitchen',   name: 'Kitchen',   icon: 'restaurant',       color: '#FFB347', route: '/(app)/kitchen' },
  { id: 'expenses',  name: 'Expenses',  icon: 'wallet',           color: '#10B981', route: '/(app)/expenses' },
  { id: 'tracking',  name: 'Tracking',  icon: 'navigate-circle',  color: '#3B82F6', route: '/(app)/tracking' },
];

const ALL_SERVICES = [
  { id: 'wardrobe',  name: 'Wardrobe',     icon: 'shirt',           color: '#6C63FF', route: '/(app)/wardrobe' },
  { id: 'kitchen',   name: 'Kitchen',      icon: 'restaurant',      color: '#FFB347', route: '/(app)/kitchen' },
  { id: 'cctv',      name: 'CCTV',         icon: 'videocam',        color: '#6C63FF', route: '/(app)/cctv' },
  { id: 'tracking',  name: 'Tracking',     icon: 'navigate-circle', color: '#3B82F6', route: '/(app)/tracking' },
  { id: 'jaap',      name: 'Jaap Counter', icon: 'infinite',        color: '#8B5CF6', route: '/(app)/jaap' },
  { id: 'wellbeing', name: 'Well-being',   icon: 'heart',           color: '#FF6B9D', route: '/(app)/wellbeing' },
  { id: 'calendar',  name: 'Calendar',     icon: 'calendar',        color: '#4CAF82', route: '/(app)/calendar' },
  { id: 'laundry',   name: 'Laundry',      icon: 'water',           color: '#06B6D4', route: null },
  { id: 'pharmacy',  name: 'Pharmacy',     icon: 'medkit',          color: '#EF4444', route: null },
  { id: 'sweethome', name: 'Sweet Home',   icon: 'home',            color: '#8B5CF6', route: null },
  { id: 'fitness',   name: 'Fitness Track',icon: 'barbell',         color: '#F59E0B', route: null },
  { id: 'expenses',  name: 'Expenses',     icon: 'wallet',          color: '#10B981', route: '/(app)/expenses' },
  { id: 'transport', name: 'Transport',    icon: 'car',             color: '#3B82F6', route: null },
  { id: 'more',      name: 'More Soon',    icon: 'ellipsis-horizontal-circle', color: '#9CA3AF', route: null },
];

const STATUS_COLOR = { active: '#4CAF82', 'on-demand': '#FF6B9D' };
const STATUS_LABEL = { active: 'Active', 'on-demand': 'On Demand' };

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ServicesScreen() {
  const { isDark } = useTheme();
  const { width: screenW } = useWindowDimensions();

  const txt = isDark ? '#F0EEFF' : '#16163A';
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  // 3-per-row grid: padding 16 each side + 2 gaps of 8 between tiles
  const tileW = Math.floor((screenW - 32 - 16) / 3);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Section 1: Subscribed Services ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.secLabel, { color: sub }]}>SUBSCRIBED SERVICES</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: '#6C63FF' }]}>Manage</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.subCard}>
            {SUBSCRIBED.map((s, i) => (
              <View key={s.id}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: divColor }]} />}
                <View style={styles.subRow}>
                  <View style={[styles.subIcon, { backgroundColor: s.color + '1E' }]}>
                    <Ionicons name={s.icon} size={16} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subName, { color: txt }]}>{s.name}</Text>
                    <Text style={[styles.subDetail, { color: sub }]}>{s.detail}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[s.status] + '1E' }]}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[s.status] }]} />
                    <Text style={[styles.statusTxt, { color: STATUS_COLOR[s.status] }]}>
                      {STATUS_LABEL[s.status]}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ── Section 2: Explore (App Store style) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.secLabel, { color: sub }]}>EXPLORE</Text>
          </View>

          {/* Featured — App of the Week */}
          {/* Outer shadow wrapper — no overflow */}
          <View style={styles.featuredOuter}>
            {/* Inner gradient — overflow:hidden for rounded corners */}
            <LinearGradient
              colors={FEATURED.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featuredInner}
            >
              <View style={styles.featuredTopRow}>
                <View style={styles.featuredTagWrap}>
                  <Ionicons name="star" size={10} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.featuredTag}>{FEATURED.tagline}</Text>
                </View>
              </View>
              <View style={styles.featuredBody}>
                <View style={styles.featuredIconWrap}>
                  <Ionicons name={FEATURED.icon} size={36} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.featuredName}>{FEATURED.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>{FEATURED.description}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.featuredBtn}
                onPress={() => router.push(FEATURED.route)}
                activeOpacity={0.85}
              >
                <Text style={styles.featuredBtnTxt}>Open</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Most Used */}
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={[styles.secLabel, { color: sub }]}>MOST USED</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: '#6C63FF' }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mostUsedRow}>
            {MOST_USED.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.mostUsedItem}
                onPress={() => router.push(s.route)}
                activeOpacity={0.75}
              >
                <View style={[styles.mostUsedIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : s.color + '15' }]}>
                  <View style={[styles.mostUsedIconInner, { backgroundColor: s.color + '25' }]}>
                    <Ionicons name={s.icon} size={26} color={s.color} />
                  </View>
                </View>
                <Text style={[styles.mostUsedName, { color: txt }]} numberOfLines={1}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Section 3: All Services ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.secLabel, { color: sub }]}>ALL SERVICES</Text>
            <Text style={[styles.subDetail, { color: sub }]}>{ALL_SERVICES.length} apps</Text>
          </View>
          <View style={styles.allGrid}>
            {ALL_SERVICES.map(s => {
              const isAvail = !!s.route;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.appTile, { width: tileW }]}
                  onPress={() => { if (isAvail) router.push(s.route); }}
                  activeOpacity={isAvail ? 0.75 : 1}
                >
                  {/* App icon */}
                  <View style={[
                    styles.appIcon,
                    {
                      backgroundColor: isDark
                        ? (isAvail ? s.color + '28' : 'rgba(255,255,255,0.05)')
                        : (isAvail ? s.color + '18' : '#F3F4F6'),
                    },
                  ]}>
                    <Ionicons
                      name={s.icon}
                      size={26}
                      color={isAvail ? s.color : (isDark ? '#4B5563' : '#9CA3AF')}
                    />
                    {!isAvail && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonTxt}>Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.appName, { color: isAvail ? txt : sub }]}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 20 },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  seeAll: { fontSize: 12, fontWeight: '600' },

  // Subscribed
  subCard: { padding: 0 },
  subRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  subIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 13, fontWeight: '600' },
  subDetail: { fontSize: 11, marginTop: 1 },
  divider: { height: 0.5, marginHorizontal: 14 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700' },

  // Featured card — outer shadow wrapper (no overflow)
  featuredOuter: {
    borderRadius: 18,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  // Inner gradient — overflow:hidden clips rounded corners
  featuredInner: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 18,
    gap: 12,
  },
  featuredTopRow: { flexDirection: 'row', alignItems: 'center' },
  featuredTagWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  featuredTag: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  featuredBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featuredIconWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  featuredName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 17 },
  featuredBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  featuredBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Most Used
  mostUsedRow: { gap: 14, paddingVertical: 2, paddingHorizontal: 2 },
  mostUsedItem: { alignItems: 'center', gap: 6, width: 72 },
  mostUsedIcon: {
    width: 62, height: 62, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  mostUsedIconInner: {
    width: 52, height: 52, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  mostUsedName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // All Services grid
  allGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  appTile: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  appIcon: {
    width: '100%', aspectRatio: 1, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  appName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  soonBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: '#FFB34730',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  soonTxt: { fontSize: 8, fontWeight: '800', color: '#FFB347' },
});
