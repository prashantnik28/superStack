import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Animated, Dimensions, PanResponder, Platform,
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
          <TouchableOpacity key={tab.label} onPress={() => router.push(tab.route)} style={styles.navItem} activeOpacity={0.7}>
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
  const txt = isDark ? '#F0EEFF' : '#16163A';
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View style={[styles.infoPanel, {
          height: MAX_PANEL_H,
          backgroundColor: Platform.OS !== 'ios' ? (isDark ? '#12122A' : '#FFFFFF') : 'transparent',
          paddingTop: insets.top + 8,
          transform: [{ translateY: panelTranslate }],
        }]}>
          {Platform.OS === 'ios' && (
            <>
              <BlurView intensity={isDark ? 40 : 28} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(10,5,22,0.62)' : 'rgba(248,244,255,0.72)' }]} />
            </>
          )}

          <View style={styles.dragHandleArea} {...handlePan.panHandlers}>
            <View style={[styles.panelHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)' }]} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent} bounces={false}>
            <View style={styles.panelHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.panelTitle, { color: txt }]}>Quick Overview</Text>
                <Text style={[styles.panelSubtitle, { color: sub }]}>smartStack Family Hub</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
                <Ionicons name="close" size={16} color={sub} />
              </TouchableOpacity>
            </View>

            <View style={[styles.statsBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.06)', borderColor: border }]}>
              {[
                { label: 'Tasks', value: '5/8', icon: 'checkmark-circle', color: '#4CAF82' },
                { label: 'Expiring', value: '3', icon: 'warning', color: '#FFB347' },
                { label: 'Members', value: `${members.length}`, icon: 'people', color: '#6C63FF' },
                { label: 'Alerts', value: '3', icon: 'notifications', color: '#FF6B9D' },
              ].map((q, i, arr) => (
                <React.Fragment key={q.label}>
                  <View style={styles.statItem}>
                    <Ionicons name={q.icon} size={17} color={q.color} />
                    <Text style={[styles.statVal, { color: txt }]}>{q.value}</Text>
                    <Text style={[styles.statLabel, { color: sub }]}>{q.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: border }]} />}
                </React.Fragment>
              ))}
            </View>

            <Text style={[styles.panelSec, { color: sub }]}>FAMILY STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 2 }}>
              {members.map(m => (
                <View key={m.id} style={{ alignItems: 'center', gap: 4, position: 'relative' }}>
                  <View style={[styles.panelAvatar, { backgroundColor: m.color }]}>
                    <Text style={styles.panelAvatarTxt}>{m.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.onlineDot, { backgroundColor: '#4CAF82', borderColor: isDark ? '#10051E' : '#F8F4FF' }]} />
                  <Text style={[styles.panelMemberName, { color: txt }]}>{m.name}</Text>
                  <Text style={[styles.panelMemberStatus, { color: sub }]}>{m.status || 'Active'}</Text>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.panelSec, { color: sub }]}>QUICK ACTIONS</Text>
            <View style={styles.actionsRow}>
              {[
                { icon: 'add-circle', label: 'Add Task', color: '#6C63FF' },
                { icon: 'scan', label: 'Scan Item', color: '#FFB347' },
                { icon: 'location', label: 'Check In', color: '#4CAF82' },
                { icon: 'calendar', label: 'Schedule', color: '#FF6B9D' },
              ].map(a => (
                <TouchableOpacity key={a.label} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : a.color + '10' }]} activeOpacity={0.7}>
                  <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                    <Ionicons name={a.icon} size={20} color={a.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: txt }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.panelSec, { color: sub }]}>ALL SERVICES</Text>
            <View style={styles.servicesGrid}>
              {ALL_SERVICES.map(s => {
                const isAct = activeService === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => { if (s.route) { switchService(s.id); router.push(s.route); onClose(); } }}
                    style={[styles.svcTile, { backgroundColor: isAct ? s.color : (isDark ? 'rgba(255,255,255,0.06)' : s.color + '10') }]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.svcTileIcon, { backgroundColor: isAct ? 'rgba(255,255,255,0.22)' : s.color + '25' }]}>
                      <Ionicons name={s.icon} size={16} color={isAct ? '#fff' : s.color} />
                    </View>
                    <Text style={[styles.svcTileName, { color: isAct ? '#fff' : txt }]} numberOfLines={1}>{s.name}</Text>
                    {!s.route && <Text style={[styles.soonTxt, { color: isAct ? 'rgba(255,255,255,0.7)' : sub }]}>Soon</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.themeRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.06)', borderColor: border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.themeIconWrap, { backgroundColor: isDark ? '#A78BFA22' : '#FFB34722' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#A78BFA' : '#FFB347'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeLabel, { color: txt }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={[styles.themeSub, { color: sub }]}>Tap to switch</Text>
              </View>
              <View style={[styles.togglePill, { backgroundColor: isDark ? '#6C63FF' : '#E5E7EB' }]}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 16 : 0 }], backgroundColor: isDark ? '#fff' : '#9CA3AF' }]} />
              </View>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
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
          backgroundColor: Platform.OS !== 'ios' ? (isDark ? '#0D0D1A' : '#FFFFFF') : 'transparent',
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
    { id: 'c', name: 'Cleaning',      icon: 'sparkles',  color: '#6C63FF', status: 'active',    detail: 'Tomorrow, 10 AM' },
    { id: 'm', name: 'Milk Delivery', icon: 'water',     color: '#4CAF82', status: 'active',    detail: 'Daily · 7:00 AM' },
    { id: 'g', name: 'Grocery',       icon: 'cart',      color: '#FFB347', status: 'active',    detail: 'Wed, 3–5 PM' },
    { id: 'r', name: 'Repair',        icon: 'construct', color: '#FF6B9D', status: 'on-demand', detail: 'On request' },
    { id: 'l', name: 'Laundry',       icon: 'shirt',     color: '#9C27B0', status: 'active',    detail: 'Pickup: Friday' },
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
          backgroundColor: isDark ? '#0D0D1A' : '#FFFFFF',
          paddingTop: insets.top + 16,
          width: DRAWER_W,
          transform: [{ translateX: slideX }],
        }]}>
          <View style={[styles.drawerProfile, { backgroundColor: isDark ? '#1A1A2E' : '#F7F4FF' }]}>
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
              <View key={svc.id} style={styles.drawerItem}>
                <View style={[styles.drawerItemIcon, { backgroundColor: svc.color + '18' }]}>
                  <Ionicons name={svc.icon} size={18} color={svc.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.drawerItemLabel, { color: isDark ? '#F0EEFF' : '#16163A' }]}>{svc.name}</Text>
                  <Text style={[styles.drawerSvcDetail, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{svc.detail}</Text>
                </View>
                <View style={[styles.drawerSvcDot, { backgroundColor: svc.status === 'active' ? '#4CAF82' : '#FFB347' }]} />
              </View>
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

  const gradientDark = ['#0D0D1A', '#110B24', '#0A0E20', '#0D0D1A'];
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

  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Info Panel
  infoPanel: {
    position: 'absolute', top: 0, left: 0, right: 0,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 24,
  },
  dragHandleArea: { alignItems: 'center', paddingVertical: 10 },
  panelHandle: { width: 44, height: 4, borderRadius: 2 },
  panelContent: { paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
  panelHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  panelTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  panelSubtitle: { fontSize: 12, marginTop: 2 },
  statsBar: { flexDirection: 'row', borderRadius: 12, padding: 14, borderWidth: 0.5 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 0.5, marginVertical: 4 },
  panelSec: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  panelAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  panelAvatarTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  onlineDot: { position: 'absolute', bottom: 22, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  panelMemberName: { fontSize: 12, fontWeight: '700' },
  panelMemberStatus: { fontSize: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 6 },
  actionIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  svcTile: { width: '22%', padding: 10, borderRadius: 12, alignItems: 'center', gap: 5 },
  svcTileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  svcTileName: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  soonTxt: { fontSize: 8, fontWeight: '600' },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  themeIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 14, fontWeight: '600' },
  themeSub: { fontSize: 11, marginTop: 1 },
  togglePill: { width: 38, height: 22, borderRadius: 11, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 18, height: 18, borderRadius: 9 },

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
