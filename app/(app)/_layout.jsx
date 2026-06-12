import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Animated, Dimensions, PanResponder, Platform,
  DeviceEventEmitter,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useServiceStore } from '../../src/stores/useServiceStore';
import { useFamilyStore } from '../../src/stores/useFamilyStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DRAWER_W = SCREEN_W * 0.78;
const MAX_PANEL_H = Math.round(SCREEN_H * 0.82);

const H = { href: null };

const SERVICE_MAP = {
  wardrobe: 'wardrobe',
  kitchen: 'kitchen',
  calendar: 'calendar',
  profile: 'profile',
};

function getService(pathname) {
  for (const key of Object.keys(SERVICE_MAP)) {
    if (pathname.includes(`/${key}`)) return key;
  }
  return 'overview';
}

const NAV_BASE = [
  { label: 'Home', icon: 'grid', iconOff: 'grid-outline', route: '/(app)/overview' },
  { label: 'Calendar', icon: 'calendar', iconOff: 'calendar-outline', route: '/(app)/calendar' },
  { center: true },
  { label: 'Services', icon: 'apps', iconOff: 'apps-outline', route: '/(app)/services' },
  { label: 'Profile', icon: 'person-circle', iconOff: 'person-circle-outline', route: '/(app)/profile' },
];

const NAV = {
  overview: NAV_BASE,
  calendar: NAV_BASE,
  profile: NAV_BASE,
  wardrobe: [
    { label: 'Closet', icon: 'shirt', iconOff: 'shirt-outline', route: '/(app)/wardrobe' },
    { label: 'Add Item', icon: 'add-circle', iconOff: 'add-circle-outline', route: '/(app)/wardrobe/add-item' },
    { label: 'Outfits', icon: 'sparkles', iconOff: 'sparkles-outline', route: '/(app)/wardrobe/suggestions' },
  ],
  kitchen: [
    { label: 'Pantry', icon: 'grid', iconOff: 'grid-outline', route: '/(app)/kitchen' },
    { label: 'Scan', icon: 'barcode', iconOff: 'barcode-outline', route: '/(app)/kitchen/scan' },
    { label: 'Expiry', icon: 'time', iconOff: 'time-outline', route: '/(app)/kitchen/expiry' },
    { label: 'Shopping', icon: 'cart', iconOff: 'cart-outline', route: '/(app)/kitchen/shopping' },
  ],
};

const SERVICE_COLORS = {
  wardrobe: '#6C63FF',
  kitchen: '#FFB347',
  calendar: '#4CAF82',
};

const ALL_SERVICES = [
  { id: 'wardrobe',  name: 'Wardrobe',  icon: 'shirt',           color: '#6C63FF', route: '/(app)/wardrobe' },
  { id: 'kitchen',   name: 'Kitchen',   icon: 'restaurant',      color: '#FFB347', route: '/(app)/kitchen' },
  { id: 'cctv',      name: 'CCTV',      icon: 'videocam',        color: '#6C63FF', route: '/(app)/cctv' },
  { id: 'tracking',  name: 'Tracking',  icon: 'navigate-circle', color: '#3B82F6', route: '/(app)/tracking' },
  { id: 'calendar',  name: 'Calendar',  icon: 'calendar',        color: '#4CAF82', route: '/(app)/calendar' },
  { id: 'wellbeing', name: 'Well-being',icon: 'heart',           color: '#FF6B9D', route: '/(app)/wellbeing' },
  { id: 'laundry',   name: 'Laundry',   icon: 'water',           color: '#06B6D4', route: null },
  { id: 'pharmacy',  name: 'Pharmacy',  icon: 'medkit',          color: '#EF4444', route: null },
  { id: 'sweethome', name: 'Sweet Home',icon: 'home',            color: '#8B5CF6', route: null },
  { id: 'fitness',   name: 'Fitness',   icon: 'barbell',         color: '#F59E0B', route: null },
  { id: 'expenses',  name: 'Expenses',  icon: 'wallet',          color: '#10B981', route: '/(app)/expenses' },
];

const NOTIFICATIONS_DATA = [
  { id: '1', icon: 'school', color: '#6C63FF', title: 'Aarav checked in at school', body: 'St. Joseph School · 8:40 AM', time: 'Just now', read: false },
  { id: '2', icon: 'cart', color: '#FFB347', title: 'Grocery delivery scheduled', body: 'Arrives Wednesday 3–5 PM', time: '10 min ago', read: false },
  { id: '3', icon: 'warning', color: '#FF6B6B', title: '3 items expiring soon', body: 'Milk, Yogurt, Bread expiring tomorrow', time: '1 hr ago', read: false },
  { id: '4', icon: 'musical-notes', color: '#FF6B9D', title: "Myra's dance class soon", body: 'Starts in 45 minutes · City Dance Studio', time: '2 hrs ago', read: true },
  { id: '5', icon: 'shield-checkmark', color: '#4CAF82', title: 'Home security active', body: 'All sensors online and working fine', time: 'Yesterday', read: true },
  { id: '6', icon: 'sparkles', color: '#6C63FF', title: 'Cleaning service tomorrow', body: 'Home Cleaning · 10:00 AM – 12:00 PM', time: 'Yesterday', read: true },
];


// ── Glass blur helper ──────────────────────────────────────────────────────────
function GlassLayer({ isDark, intensityMult = 1 }) {
  if (Platform.OS !== 'ios') return null;
  return (
    <>
      <BlurView intensity={isDark ? Math.round(32 * intensityMult) : Math.round(22 * intensityMult)} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,6,24,0.52)' : 'rgba(246,247,252,0.75)' }]} />
    </>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────────
function BottomNav({ pathname, isDark, colors, insets, onPressCenter }) {
  const service = getService(pathname);
  const tabs = NAV[service] || NAV.overview;
  const accentColor = SERVICE_COLORS[service] || colors.primary;

  const isActive = (route) => {
    const clean = route.replace('/(app)', '');
    const ROOT_ROUTES = ['/overview', '/wellbeing', '/wardrobe', '/kitchen', '/calendar', '/profile', '/services'];
    if (pathname === clean) return true;
    if (ROOT_ROUTES.includes(clean)) return false;
    return pathname.startsWith(clean);
  };

  return (
    <View style={[styles.bottomNav, {
      paddingBottom: insets.bottom,
      borderTopWidth: isDark ? 0.5 : 0,
      borderTopColor: 'rgba(255,255,255,0.08)',
      backgroundColor: Platform.OS !== 'ios'
        ? (isDark ? 'rgba(10,6,24,0.97)' : '#F6F7FC')
        : 'transparent',
    }]}>
      <GlassLayer isDark={isDark} />
      {tabs.map((tab) => {
        if (tab.center) {
          return (
            <View key="center" style={styles.navCenterWrap}>
              <TouchableOpacity
                style={[styles.navCenterBtn, { backgroundColor: accentColor }]}
                activeOpacity={0.85}
                onPress={onPressCenter}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.label}
            onPress={() => {
              if (active) {
                DeviceEventEmitter.emit('scrollToTop', tab.route);
              } else {
                router.push(tab.route);
              }
            }}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            {active && <View style={[styles.navActivePill, { backgroundColor: accentColor + '20' }]} />}
            <Ionicons name={active ? tab.icon : tab.iconOff} size={22} color={active ? accentColor : colors.textSecondary} />
            <Text style={[styles.navLabel, { color: active ? accentColor : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Info Panel ─────────────────────────────────────────────────────────────────
const MEMBER_STATUS = [
  { status: 'At Home',   color: '#4CAF82', icon: 'home' },
  { status: 'At Office', color: '#3B82F6', icon: 'business' },
  { status: 'At School', color: '#FFB347', icon: 'school' },
  { status: 'At School', color: '#FFB347', icon: 'school' },
];

const SUGGESTIONS = [
  { id: 'barcode',  icon: 'barcode',     color: '#FFB347', label: 'Scan Barcode', desc: 'Add to grocery',   route: '/(app)/kitchen/scan' },
  { id: 'grocery',  icon: 'cart',        color: '#4CAF82', label: 'Add Grocery',  desc: 'Quick list update', route: '/(app)/kitchen/shopping' },
  { id: 'reminder', icon: 'alarm',       color: '#6C63FF', label: 'Reminder',     desc: 'Set family alert',  route: '/(app)/calendar' },
  { id: 'expiry',   icon: 'time',        color: '#EF4444', label: 'Expiry Check', desc: 'Items expiring',    route: '/(app)/kitchen/expiry' },
  { id: 'report',   icon: 'stats-chart', color: '#FF6B9D', label: 'Report',       desc: 'Weekly summary',    route: '/(app)/wellbeing' },
  { id: 'checkin',  icon: 'location',    color: '#06B6D4', label: 'Check In',     desc: 'Share location',    route: '/(app)/wellbeing/tracking' },
];

const AI_SUGGESTIONS = [
  { id: 1,  icon: 'calendar',        color: '#6C63FF', category: 'Task',      text: 'Pick children from school today at 3:30 PM',                   action: 'Add Task',   route: '/(app)/calendar' },
  { id: 2,  icon: 'cart',            color: '#4CAF82', category: 'Grocery',   text: 'Milk is running low — reorder before Thursday',                action: 'Add Item',   route: '/(app)/kitchen/shopping' },
  { id: 3,  icon: 'alarm',           color: '#FFB347', category: 'Reminder',  text: "Aarav's football practice tomorrow at 4:00 PM",                action: 'Remind',     route: '/(app)/calendar' },
  { id: 4,  icon: 'medkit',          color: '#EF4444', category: 'Health',    text: "Myra's next doctor checkup is due this week",                  action: 'Schedule',   route: '/(app)/wellbeing' },
  { id: 5,  icon: 'sparkles',        color: '#9C27B0', category: 'Service',   text: 'Home cleaning is scheduled tomorrow at 10 AM',                 action: 'View',       route: '/(app)/services' },
  { id: 6,  icon: 'school',          color: '#3B82F6', category: 'School',    text: "Annual day event on Friday — don't forget costumes",           action: 'Add Task',   route: '/(app)/calendar' },
  { id: 7,  icon: 'wallet',          color: '#10B981', category: 'Finance',   text: 'Monthly grocery budget is 80% used with 10 days left',         action: 'View',       route: '/(app)/expenses' },
  { id: 8,  icon: 'heart',           color: '#FF6B9D', category: 'Wellbeing', text: 'No mood check-in from Rajan today — send a nudge',             action: 'Nudge',      route: '/(app)/wellbeing' },
  { id: 9,  icon: 'time',            color: '#F59E0B', category: 'Expiry',    text: '3 kitchen items expiring in 2 days — review now',              action: 'Check',      route: '/(app)/kitchen/expiry' },
  { id: 10, icon: 'navigate-circle', color: '#06B6D4', category: 'Location',  text: 'Aarav arrived at school at 8:15 AM — all good',                action: 'Track',      route: '/(app)/wellbeing/tracking' },
  { id: 11, icon: 'shirt',           color: '#8B5CF6', category: 'Wardrobe',  text: "Myra hasn't logged an outfit in 3 days — check wardrobe",      action: 'View',       route: '/(app)/wardrobe' },
  { id: 12, icon: 'barbell',         color: '#F97316', category: 'Fitness',   text: 'Family fitness goal is 60% complete this week — keep going!',  action: 'View',       route: '/(app)/wellbeing' },
  { id: 13, icon: 'water',           color: '#0EA5E9', category: 'Delivery',  text: 'Milk delivery arrives tomorrow at 7 AM — gate unlocked?',      action: 'Confirm',    route: '/(app)/services' },
  { id: 14, icon: 'restaurant',      color: '#FF6B9D', category: 'Meal',      text: 'Plan dinner for tonight — check pantry for ingredients',       action: 'Check',      route: '/(app)/kitchen' },
  { id: 15, icon: 'construct',       color: '#DC2626', category: 'Repair',    text: 'AC service is overdue — last serviced 8 months ago',           action: 'Schedule',   route: '/(app)/services' },
];

const QUICK_ACTIONS = [
  { icon: 'add-circle', label: 'Add Task',    color: '#6C63FF', route: '/(app)/calendar' },
  { icon: 'scan',       label: 'Scan',        color: '#FFB347', route: '/(app)/kitchen/scan' },
  { icon: 'location',   label: 'Check In',    color: '#4CAF82', route: '/(app)/wellbeing/tracking' },
  { icon: 'calendar',   label: 'Schedule',    color: '#FF6B9D', route: '/(app)/calendar' },
  { icon: 'wallet',     label: 'Expense',     color: '#10B981', route: '/(app)/expenses' },
  { icon: 'heart',      label: 'Wellbeing',   color: '#EF4444', route: '/(app)/wellbeing' },
];

function InfoPanel({ visible, onClose, insets }) {
  const { isDark, toggleTheme } = useTheme();
  const { members } = useFamilyStore();
  const { activeService, switchService } = useServiceStore();
  const slideY = useRef(new Animated.Value(-MAX_PANEL_H)).current;
  const panOffset = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const handlePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gs) => { if (gs.dy < 0) panOffset.setValue(gs.dy); },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy < -70 || gs.vy < -0.5) onClose();
      else Animated.spring(panOffset, { toValue: 0, tension: 200, friction: 20, useNativeDriver: true }).start();
    },
  })).current;

  React.useEffect(() => {
    if (visible) {
      panOffset.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -MAX_PANEL_H, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panelTranslate = Animated.add(slideY, panOffset);
  const txt  = isDark ? '#F0EEFF' : '#16163A';
  const sub  = isDark ? '#9CA3AF' : '#6B7280';
  const bdr  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.09)';
  const navAndClose = (route) => { onClose(); setTimeout(() => router.push(route), 300); };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.infoPanel, {
          height: MAX_PANEL_H,
          backgroundColor: isDark ? 'transparent' : '#FFFFFF',
          paddingTop: insets.top + 4,
          transform: [{ translateY: panelTranslate }],
        }]}>
          {isDark && (
            <>
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,6,24,0.55)' }]} />
            </>
          )}

          {/* drag handle */}
          <View style={styles.dragHandleArea} {...handlePan.panHandlers}>
            <View style={[styles.panelHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(108,99,255,0.18)' }]} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent} bounces={false}>

            {/* ── Header ── */}
            <View style={styles.panelHeaderRow}>
              <View style={[styles.panelLogoWrap, { backgroundColor: '#6C63FF18' }]}>
                <Ionicons name="home" size={14} color="#6C63FF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={[styles.panelTitle, { color: txt }]}>Family Hub</Text>
                  <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTxt}>LIVE</Text>
                  </View>
                </View>
                <Text style={[styles.panelSubtitle, { color: sub }]}>Sat, 16 May 2026 · 4 members active</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.10)' }]}>
                <Ionicons name="close" size={14} color={sub} />
              </TouchableOpacity>
            </View>

            {/* ── Stats single row ── */}
            <View style={[styles.statsBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : '#F7F5FF', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(108,99,255,0.08)' }]}>
              {[
                { label: 'Tasks',    value: '5/8',               icon: 'checkmark-circle', color: '#4CAF82' },
                { label: 'Expiring', value: '3',                 icon: 'warning',          color: '#FFB347' },
                { label: 'Members',  value: `${members.length}`, icon: 'people',           color: '#6C63FF' },
                { label: 'Alerts',   value: '3',                 icon: 'notifications',    color: '#FF6B9D' },
              ].map((q, i, arr) => (
                <React.Fragment key={q.label}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: q.color + '18' }]}>
                      <Ionicons name={q.icon} size={13} color={q.color} />
                    </View>
                    <Text style={[styles.statVal, { color: q.color }]}>{q.value}</Text>
                    <Text style={[styles.statLabel, { color: sub }]}>{q.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />}
                </React.Fragment>
              ))}
            </View>

            {/* ── Family Status ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: '#4CAF82' }]} />
              <Text style={[styles.panelSec, { color: sub }]}>FAMILY STATUS</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
              {members.map((m, idx) => {
                const ms = MEMBER_STATUS[idx % MEMBER_STATUS.length];
                return (
                  <View key={m.id} style={[styles.memberCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)' }]}>
                    <View style={[styles.memberColorBar, { backgroundColor: ms.color }]} />
                    <View style={styles.memberCardInner}>
                      <View style={{ position: 'relative' }}>
                        <View style={[styles.panelAvatar, { backgroundColor: m.color }]}>
                          <Text style={styles.panelAvatarTxt}>{m.name.slice(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={[styles.onlineDot, { backgroundColor: ms.color, borderColor: isDark ? '#0F0B1E' : '#fff' }]} />
                      </View>
                      <Text style={[styles.panelMemberName, { color: txt }]} numberOfLines={1}>{m.name.split(' ')[0]}</Text>
                      <View style={[styles.statusPill, { backgroundColor: ms.color + '1A' }]}>
                        <Ionicons name={ms.icon} size={8} color={ms.color} />
                        <Text style={[styles.statusPillTxt, { color: ms.color }]}>{ms.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* ── Suggested ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: '#6C63FF' }]} />
              <Text style={[styles.panelSec, { color: sub }]}>SUGGESTED FOR YOU</Text>
              <View style={[styles.aiBadge, { backgroundColor: '#6C63FF' }]}>
                <Ionicons name="sparkles" size={9} color="#fff" />
                <Text style={styles.aiBadgeTxt}>AI</Text>
              </View>
            </View>

            {/* Run Family Scan — gradient card */}
            <TouchableOpacity activeOpacity={0.88} onPress={() => navAndClose('/(app)/wellbeing')} style={styles.scanCardWrap}>
              <LinearGradient colors={['#7C3AED', '#4F46E5', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.scanCard}>
                <View style={[styles.scanIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                  <Ionicons name="scan-circle" size={26} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.scanTitle}>Run Family Scan</Text>
                    <View style={styles.scanBadge}>
                      <Ionicons name="sparkles" size={8} color="#fff" />
                      <Text style={styles.scanBadgeTxt}>AI</Text>
                    </View>
                  </View>
                  <Text style={styles.scanDesc}>Attendance · Location · Wellbeing · Grocery</Text>
                  <View style={{ flexDirection: 'row', gap: 5, marginTop: 7 }}>
                    {[
                      { icon: 'school',   label: '2 at school' },
                      { icon: 'navigate', label: 'All tracked'  },
                      { icon: 'heart',    label: 'Reports ok'   },
                    ].map(chip => (
                      <View key={chip.label} style={styles.scanChip}>
                        <Ionicons name={chip.icon} size={9} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.scanChipTxt}>{chip.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.scanRunBtn}>
                  <Ionicons name="play" size={11} color="#4F46E5" />
                  <Text style={styles.scanRunTxt}>Scan</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Suggestion cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.suggestCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)' }]}
                  activeOpacity={0.8}
                  onPress={() => navAndClose(s.route)}
                >
                  <View style={[styles.suggestTopLine, { backgroundColor: s.color }]} />
                  <View style={styles.suggestCardInner}>
                    <View style={[styles.suggestIcon, { backgroundColor: s.color + '18' }]}>
                      <Ionicons name={s.icon} size={17} color={s.color} />
                    </View>
                    <Text style={[styles.suggestLabel, { color: txt }]}>{s.label}</Text>
                    <Text style={[styles.suggestDesc, { color: sub }]}>{s.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Quick Actions ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: '#FFB347' }]} />
              <Text style={[styles.panelSec, { color: sub }]}>QUICK ACTIONS</Text>
            </View>
            <View style={styles.actionsGrid}>
              {QUICK_ACTIONS.map(a => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)' }]}
                  activeOpacity={0.75}
                  onPress={() => navAndClose(a.route)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                    <Ionicons name={a.icon} size={18} color={a.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: txt }]}>{a.label}</Text>
                  <Ionicons name="chevron-forward" size={11} color={sub} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </View>

            {/* ── AI Suggestions ── */}
            <View style={styles.secRow}>
              <View style={[styles.secDot, { backgroundColor: '#6C63FF' }]} />
              <Text style={[styles.panelSec, { color: sub }]}>AI SUGGESTIONS</Text>
              <View style={[styles.aiBadge, { backgroundColor: '#6C63FF' }]}>
                <Ionicons name="sparkles" size={9} color="#fff" />
                <Text style={styles.aiBadgeTxt}>Smart</Text>
              </View>
            </View>
            <View style={[styles.aiCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.08)' }]}>
              {AI_SUGGESTIONS.map((s, i) => (
                <View key={s.id}>
                  {i > 0 && <View style={[styles.aiDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />}
                  <TouchableOpacity style={styles.aiRow} activeOpacity={0.7} onPress={() => navAndClose(s.route)}>
                    <View style={[styles.aiIconWrap, { backgroundColor: s.color + '18' }]}>
                      <Ionicons name={s.icon} size={13} color={s.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.aiCategory, { color: s.color }]}>{s.category}</Text>
                      <Text style={[styles.aiText, { color: txt }]}>{s.text}</Text>
                    </View>
                    <View style={[styles.aiActionChip, { backgroundColor: s.color + '15' }]}>
                      <Text style={[styles.aiActionTxt, { color: s.color }]}>{s.action}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* ── Appearance ── */}
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.58)' }]}
              activeOpacity={0.8}
            >
              <View style={[styles.themeIconWrap, { backgroundColor: isDark ? '#A78BFA18' : '#FFB34718' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={isDark ? '#A78BFA' : '#FFB347'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeLabel, { color: txt }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={[styles.themeSub, { color: sub }]}>Tap to switch</Text>
              </View>
              <View style={[styles.togglePill, { backgroundColor: isDark ? '#6C63FF' : '#D1D5DB' }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 16 : 0 }], backgroundColor: isDark ? '#fff' : '#9CA3AF' }]} />
              </View>
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Notification Panel ─────────────────────────────────────────────────────────
function NotifPanel({ visible, onClose, insets, notifs, onMarkAllRead }) {
  const { isDark } = useTheme();
  const slideX = useRef(new Animated.Value(SCREEN_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: SCREEN_W, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const unread = notifs.filter(n => !n.read);
  const read = notifs.filter(n => n.read);
  const txt = isDark ? '#F0EEFF' : '#16163A';
  const sub = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.notifPanel, {
          backgroundColor: Platform.OS !== 'ios' ? (isDark ? '#000000' : '#FFFFFF') : 'transparent',
          paddingTop: insets.top + 8,
          transform: [{ translateX: slideX }],
        }]}>
          {Platform.OS === 'ios' && (
            <>
              <BlurView intensity={isDark ? 38 : 26} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,5,22,0.65)' : 'rgba(248,244,255,0.75)' }]} />
            </>
          )}

          <View style={[styles.notifHeaderRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)' }]}>
            <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
              <Ionicons name="arrow-back" size={18} color={txt} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.notifTitle, { color: txt }]}>Notifications</Text>
              <Text style={[styles.notifSubtitle, { color: sub }]}>{unread.length > 0 ? `${unread.length} unread` : 'All caught up'}</Text>
            </View>
            {unread.length > 0 && (
              <TouchableOpacity onPress={onMarkAllRead}>
                <Text style={styles.markRead}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10 }}>
            {unread.length > 0 && <Text style={[styles.notifGroup, { color: sub }]}>NEW</Text>}
            {unread.map(n => (
              <View key={n.id} style={[styles.notifCard, {
                backgroundColor: isDark ? 'rgba(108,99,255,0.14)' : '#F0EEFF',
                borderColor: isDark ? 'rgba(108,99,255,0.28)' : 'rgba(108,99,255,0.2)',
              }]}>
                <View style={[styles.notifIcon, { backgroundColor: n.color + '22' }]}>
                  <Ionicons name={n.icon} size={17} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifCardTitle, { color: txt }]}>{n.title}</Text>
                  <Text style={[styles.notifCardBody, { color: sub }]}>{n.body}</Text>
                  <Text style={[styles.notifTime, { color: isDark ? '#6B7280' : '#C4C4C4' }]}>{n.time}</Text>
                </View>
                <View style={[styles.unreadDot, { backgroundColor: '#6C63FF' }]} />
              </View>
            ))}

            {read.length > 0 && <Text style={[styles.notifGroup, { color: sub, marginTop: 6 }]}>EARLIER</Text>}
            {read.map(n => (
              <View key={n.id} style={[styles.notifCard, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              }]}>
                <View style={[styles.notifIcon, { backgroundColor: n.color + '15' }]}>
                  <Ionicons name={n.icon} size={17} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifCardTitle, { color: isDark ? '#9CA3AF' : '#374151', fontWeight: '500' }]}>{n.title}</Text>
                  <Text style={[styles.notifCardBody, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{n.body}</Text>
                  <Text style={[styles.notifTime, { color: isDark ? '#4B5563' : '#D1D5DB' }]}>{n.time}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Settings Drawer ────────────────────────────────────────────────────────────
function SettingsDrawer({ visible, onClose }) {
  const { colors, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const slideX = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -DRAWER_W, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = () => {
    onClose();
    setTimeout(() => { logout(); router.replace('/(auth)/welcome'); }, 300);
  };

  const SUBSCRIBED = [
    { id: 'c', name: 'Cleaning',      icon: 'sparkles',  color: '#6C63FF', status: 'active',    detail: 'Tomorrow, 10 AM', route: '/(app)/services' },
    { id: 'm', name: 'Milk Delivery', icon: 'water',     color: '#4CAF82', status: 'active',    detail: 'Daily · 7:00 AM', route: '/(app)/services' },
    { id: 'g', name: 'Grocery',       icon: 'cart',      color: '#FFB347', status: 'active',    detail: 'Wed, 3–5 PM',     route: '/(app)/kitchen/shopping' },
    { id: 'r', name: 'Repair',        icon: 'construct', color: '#FF6B9D', status: 'on-demand', detail: 'On request',      route: '/(app)/services' },
    { id: 'l', name: 'Laundry',       icon: 'shirt',     color: '#9C27B0', status: 'active',    detail: 'Pickup: Friday',  route: '/(app)/services' },
  ];

  const nav = (route) => { onClose(); setTimeout(() => router.push(route), 300); };
  const ITEMS = [
    { icon: 'shield-checkmark',label: 'Privacy & Security',color: '#4CAF82', action: () => nav('/(app)/settings/privacy') },
    { icon: 'language',        label: 'Language',          color: '#FFB347', value: 'English', action: () => nav('/(app)/settings/language') },
    { icon: 'help-circle',     label: 'Help & Support',    color: '#9CA3AF', action: () => nav('/(app)/settings/help') },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>
        <Animated.View style={[styles.drawer, {
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          paddingTop: insets.top + 16,
          width: DRAWER_W,
          transform: [{ translateX: slideX }],
        }]}>
          <View style={[styles.drawerProfile, { backgroundColor: isDark ? '#111111' : '#F7F4FF' }]}>
            <View style={[styles.drawerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.drawerAvatarTxt}>{(user?.name || 'P').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.drawerName, { color: isDark ? '#F0EEFF' : '#16163A' }]}>{user?.name || 'Somya Singh'}</Text>
              <Text style={[styles.drawerEmail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{user?.email || 'somya@example.com'}</Text>
              <View style={styles.planChip}>
                <Ionicons name="star" size={10} color="#FFD700" />
                <Text style={styles.planChipTxt}>Family Pro</Text>
              </View>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.drawerSec, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SUBSCRIBED SERVICES</Text>
            {SUBSCRIBED.map(svc => (
              <TouchableOpacity key={svc.id} style={styles.drawerItem} activeOpacity={0.75} onPress={() => nav(svc.route)}>
                <View style={[styles.drawerItemIcon, { backgroundColor: svc.color + '18' }]}>
                  <Ionicons name={svc.icon} size={18} color={svc.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemLabel, { color: isDark ? '#F0EEFF' : '#16163A' }]}>{svc.name}</Text>
                  <Text style={[styles.drawerSvcDetail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{svc.detail}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Text style={[styles.drawerSec, { color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 8 }]}>ACCOUNT & SETTINGS</Text>
            {ITEMS.map(item => (
              <TouchableOpacity key={item.label} style={styles.drawerItem} onPress={item.action}>
                <View style={[styles.drawerItemIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={[styles.drawerItemLabel, { color: isDark ? '#F0EEFF' : '#16163A' }]}>{item.label}</Text>
                {item.badge
                  ? <View style={[styles.badge, { backgroundColor: colors.primary, position: 'relative', top: 0, right: 0 }]}><Text style={styles.badgeTxt}>{item.badge}</Text></View>
                  : item.value
                  ? <Text style={[styles.drawerItemVal, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{item.value}</Text>
                  : <Ionicons name="chevron-forward" size={15} color={isDark ? '#9CA3AF' : '#C4C4C4'} />
                }
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.drawerItem, { marginTop: 12 }]} onPress={handleLogout}>
              <View style={[styles.drawerItemIcon, { backgroundColor: '#FF6B6B18' }]}>
                <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
              </View>
              <Text style={[styles.drawerItemLabel, { color: '#FF6B6B' }]}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={[styles.appVer, { color: isDark ? '#9CA3AF' : '#C4C4C4' }]}>smartStack v1.0.0</Text>
            <View style={{ height: 30 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Page config helper ────────────────────────────────────────────────────────
function getPageConfig(pathname, members) {
  if (pathname === '/overview') return { type: 'home' };

  const memberMatch = pathname.match(/\/overview\/member\/(.+)/);
  if (memberMatch) {
    const member = members.find(m => m.id === memberMatch[1]);
    return { type: 'member', title: member?.name || 'Profile', backRoute: '/(app)/overview/family' };
  }

  const STANDALONE = {
    '/calendar': 'Calendar',
    '/notifications': 'Notifications',
    '/profile': 'Profile',
    '/services': 'Services',
  };
  if (STANDALONE[pathname]) return { type: 'standalone', title: STANDALONE[pathname] };

  const SERVICES = {
    '/wellbeing': 'Well-being',
    '/wardrobe': 'Wardrobe',
    '/kitchen': 'Kitchen',
    '/jaap': 'Jaap Counter',
    '/cctv': 'CCTV',
    '/tracking': 'Trackers',
    '/expenses': 'Expenses',
  };
  if (SERVICES[pathname]) return { type: 'page', title: SERVICES[pathname], backRoute: '/(app)/overview' };

  const TITLES = {
    '/overview/family': 'Home Sweet Home',
    '/overview/children': 'Children',
    '/emergency': 'Emergency & SOS',
    '/wellbeing/tracking': 'Tracking',
    '/wellbeing/checkins': 'Check-ins',
    '/wellbeing/sos': 'SOS',
    '/wardrobe/suggestions': 'Suggestions',
    '/kitchen/expiry': 'Expiry Tracker',
    '/kitchen/shopping': 'Shopping',
    '/settings/privacy': 'Privacy & Security',
    '/settings/devices': 'Connected Devices',
    '/settings/language': 'Language',
    '/settings/help': 'Help & Support',
  };
  return { type: 'page', title: TITLES[pathname] || '' };
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { members } = useFamilyStore();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [infoOpen, setInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS_DATA);

  const unreadCount = notifs.filter(n => !n.read).length;
  const handleMarkAllRead = () => setNotifs(p => p.map(n => ({ ...n, read: true })));

  const hour = new Date().getHours();
  const greetWord = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name?.split(' ')[0] || 'Somya';

  const pageConfig = getPageConfig(pathname, members);
  const isOverviewHome = pageConfig.type === 'home';

  const gradientDark = ['#000000', '#0A0A0A', '#050505', '#000000'];
  const gradientLight = ['#F6F7FC', '#F6F7FC', '#F6F7FC', '#F6F7FC'];

  const SOSButton = (
    <TouchableOpacity style={styles.sosBtnCircle} onPress={() => router.push('/(app)/emergency')} activeOpacity={0.85}>
      <Text style={styles.sosBtnTxt}>SOS</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LinearGradient
        colors={isDark ? gradientDark : gradientLight}
        style={styles.root}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* ── Header ── */}
        <View style={[isOverviewHome ? styles.header : styles.backHeader, {
          paddingTop: insets.top + 4,
          borderBottomWidth: isDark ? 0.5 : 0,
          borderBottomColor: 'rgba(255,255,255,0.08)',
          backgroundColor: Platform.OS !== 'ios'
            ? (isDark ? 'rgba(10,6,22,0.97)' : '#F6F7FC')
            : 'transparent',
        }]}>
          <GlassLayer isDark={isDark} />

          {isOverviewHome ? (
            <>
              <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.hBtn}>
                <Ionicons name="menu" size={20} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.greetWrap} onPress={() => setInfoOpen(true)} activeOpacity={0.7}>
                <Text style={[styles.greetMain, { color: colors.textPrimary }]} numberOfLines={1}>
                  {greetWord}, {userName} 👋
                </Text>
                <Text style={[styles.greetSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {"Here's what's happening..."}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {SOSButton}
                <TouchableOpacity
                  style={[styles.hBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                  onPress={() => router.push('/(app)/notifications')}
                >
                  <Ionicons
                    name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                    size={20}
                    color={unreadCount > 0 ? colors.primary : colors.textPrimary}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeTxt}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : pageConfig.type === 'standalone' ? (
            <>
              <View style={styles.hBtn} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {pageConfig.title}
              </Text>
              <View style={styles.hBtn} />
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => pageConfig.backRoute ? router.push(pageConfig.backRoute) : router.back()}
                style={styles.hBtn}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>

              <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {pageConfig.title}
              </Text>

              <View style={styles.hBtn} />
            </>
          )}
        </View>

        {/* ── Screens ── */}
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, sceneStyle: { backgroundColor: 'transparent' } }}>
            <Tabs.Screen name="overview/index" options={{ title: 'Home' }} />
            <Tabs.Screen name="overview/family" options={H} />
            <Tabs.Screen name="overview/children" options={H} />
            <Tabs.Screen name="overview/member/[id]" options={H} />
            <Tabs.Screen name="notifications" options={H} />
            <Tabs.Screen name="calendar/index" options={{ title: 'Calendar' }} />
            <Tabs.Screen name="services/index" options={{ title: 'Services' }} />
            <Tabs.Screen name="emergency/index" options={H} />
            <Tabs.Screen name="wellbeing/index" options={H} />
            <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
            <Tabs.Screen name="wellbeing/tracking" options={H} />
            <Tabs.Screen name="wellbeing/checkins" options={H} />
            <Tabs.Screen name="wellbeing/sos" options={H} />
            <Tabs.Screen name="wardrobe/index" options={H} />
            <Tabs.Screen name="wardrobe/add-item" options={H} />
            <Tabs.Screen name="wardrobe/suggestions" options={H} />
            <Tabs.Screen name="kitchen/index" options={H} />
            <Tabs.Screen name="kitchen/scan" options={H} />
            <Tabs.Screen name="kitchen/expiry" options={H} />
            <Tabs.Screen name="kitchen/shopping" options={H} />
            <Tabs.Screen name="cctv/index" options={H} />
            <Tabs.Screen name="tracking/index" options={H} />
            <Tabs.Screen name="expenses/index" options={H} />
            <Tabs.Screen name="settings/privacy" options={H} />
            <Tabs.Screen name="settings/devices" options={H} />
            <Tabs.Screen name="settings/language" options={H} />
            <Tabs.Screen name="settings/help" options={H} />
          </Tabs>
        </View>

        {!pathname.includes('/jaap') && !pathname.includes('/cctv') && !pathname.includes('/tracking') && !pathname.includes('/expenses') && (
          <BottomNav
            pathname={pathname}
            isDark={isDark}
            colors={colors}
            insets={insets}
            onPressCenter={() => setInfoOpen(true)}
          />
        )}

        <InfoPanel visible={infoOpen} onClose={() => setInfoOpen(false)} insets={insets} />
        <NotifPanel visible={notifOpen} onClose={() => setNotifOpen(false)} insets={insets} notifs={notifs} onMarkAllRead={handleMarkAllRead} />
        <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </LinearGradient>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 8,
    gap: 10, overflow: 'hidden',
  },
  backHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 8,
    gap: 6, overflow: 'hidden',
  },
  headerTitle: {
    flex: 1, fontSize: 15, fontWeight: '700',
    textAlign: 'center', letterSpacing: -0.2,
  },
  hBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  greetWrap: { flex: 1, gap: 1 },
  greetMain: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  greetSub: { fontSize: 11 },
  badge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)',
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // SOS button in header (home only)
  sosBtnCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: '#FF3B30',
    alignItems: 'center', justifyContent: 'center',
  },
  sosBtnTxt: { color: '#FF3B30', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Bottom Nav — overflow removed so Plus button floats above
  bottomNav: {
    flexDirection: 'row', paddingTop: 4,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4, position: 'relative' },
  navActivePill: { position: 'absolute', top: -4, width: 44, height: 3, borderRadius: 2 },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
  navCenterWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  navCenterBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
    marginTop: -22,
  },

  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Info Panel
  infoPanel: {
    position: 'absolute', top: 0, left: 0, right: 0,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25, shadowRadius: 28, elevation: 28,
  },
  dragHandleArea: { alignItems: 'center', paddingVertical: 8 },
  panelHandle: { width: 36, height: 3, borderRadius: 2 },
  panelContent: { paddingHorizontal: 14, gap: 12, paddingBottom: 16 },
  panelHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelLogoWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 10, marginTop: 1 },

  // Header live badge
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4CAF8220', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF82' },
  liveTxt: { fontSize: 8, fontWeight: '800', color: '#4CAF82', letterSpacing: 0.5 },

  // Section row label
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secDot: { width: 6, height: 6, borderRadius: 3 },
  panelSec: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, flex: 1 },

  // Stats single row
  statsBar: {
    flexDirection: 'row', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 6,
    borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 8, fontWeight: '600' },
  statDivider: { width: StyleSheet.hairlineWidth, marginVertical: 4 },

  // Member cards
  memberCard: {
    width: 80, borderRadius: 13, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  memberColorBar: { height: 3, width: '100%' },
  memberCardInner: { paddingVertical: 9, paddingHorizontal: 8, alignItems: 'center', gap: 5 },
  panelAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  panelAvatarTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  onlineDot: { position: 'absolute', bottom: 0, right: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  panelMemberName: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 99 },
  statusPillTxt: { fontSize: 8, fontWeight: '700' },

  // AI badge
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  aiBadgeTxt: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },

  // Scan card (gradient)
  scanCardWrap: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 14, elevation: 8,
  },
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 14, paddingVertical: 14, paddingLeft: 12 },
  scanIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
  scanDesc: { fontSize: 10, marginTop: 2, color: 'rgba(255,255,255,0.75)' },
  scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  scanBadgeTxt: { fontSize: 8, fontWeight: '800', color: '#fff' },
  scanChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' },
  scanChipTxt: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  scanRunBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff' },
  scanRunTxt: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },

  // Suggestion cards
  suggestCard: {
    width: 86, borderRadius: 12, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 3,
  },
  suggestTopLine: { height: 3, width: '100%' },
  suggestCardInner: { padding: 10, gap: 5 },
  suggestIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  suggestLabel: { fontSize: 10, fontWeight: '700' },
  suggestDesc: { fontSize: 9, lineHeight: 13 },

  // Quick actions — 2-col horizontal rows
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actionBtn: {
    width: '47.8%', flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 3,
  },
  actionIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700', flex: 1 },

  // AI Suggestions list
  aiCard: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  aiIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  aiCategory: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, marginBottom: 2 },
  aiText: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  aiDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  aiActionChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99 },
  aiActionTxt: { fontSize: 10, fontWeight: '700' },
  soonTxt: { fontSize: 7, fontWeight: '700' },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 3,
  },
  themeIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 12, fontWeight: '700' },
  themeSub: { fontSize: 10, marginTop: 1 },
  togglePill: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 16, height: 16, borderRadius: 8 },

  // Notif Panel
  notifPanel: {
    position: 'absolute', top: 0, right: 0, bottom: 0, width: SCREEN_W,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  notifHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 16, fontWeight: '800' },
  notifSubtitle: { fontSize: 11, marginTop: 1 },
  markRead: { fontSize: 12, fontWeight: '600', color: '#6C63FF' },
  notifGroup: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  notifIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  notifCardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  notifCardBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  notifTime: { fontSize: 10, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  // Settings Drawer
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    shadowColor: '#000', shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  drawerProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, padding: 14, borderRadius: 12, marginBottom: 8,
  },
  drawerAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  drawerAvatarTxt: { color: '#fff', fontSize: 22, fontWeight: '800' },
  drawerName: { fontSize: 15, fontWeight: '800' },
  drawerEmail: { fontSize: 11, marginTop: 1 },
  planChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#6C63FF22', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 999, alignSelf: 'flex-start', marginTop: 4,
  },
  planChipTxt: { color: '#6C63FF', fontSize: 9, fontWeight: '700' },
  drawerSec: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginHorizontal: 20, marginTop: 8, marginBottom: 4 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  drawerItemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  drawerItemLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  drawerItemVal: { fontSize: 12 },
  drawerSvcDetail: { fontSize: 11, marginTop: 1 },
  drawerSvcDot: { width: 8, height: 8, borderRadius: 4 },
  appVer: { textAlign: 'center', fontSize: 11, marginTop: 20, paddingHorizontal: 20 },
});
