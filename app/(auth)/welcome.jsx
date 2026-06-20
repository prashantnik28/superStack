import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// ── Widget card contents (always dark since welcome is always dark) ───────────

function Card1() {
  const txt = '#F0EEFF';
  const sub = 'rgba(240,238,255,0.45)';
  const sep = 'rgba(255,255,255,0.07)';

  const members = [
    { initial: 'D', color: '#6C63FF', name: 'Dad',   role: 'Admin',  status: 'Home' },
    { initial: 'M', color: '#FF6B9D', name: 'Mom',   role: 'Member', status: 'Work' },
    { initial: 'A', color: '#4CAF82', name: 'Aryan', role: 'Child',  status: 'School' },
    { initial: 'S', color: '#FFB347', name: 'Sara',  role: 'Child',  status: 'Home' },
  ];

  const services = [
    { icon: 'restaurant',      label: 'Kitchen',   color: '#FFB347' },
    { icon: 'wallet',          label: 'Expenses',  color: '#10B981' },
    { icon: 'shirt',           label: 'Wardrobe',  color: '#8B5CF6' },
    { icon: 'navigate-circle', label: 'Tracking',  color: '#6C63FF' },
    { icon: 'heart',           label: 'Wellbeing', color: '#FF6B9D' },
    { icon: 'calendar',        label: 'Calendar',  color: '#3B82F6' },
  ];

  return (
    <View style={c.body}>
      {members.map((m, i) => (
        <View key={m.name}>
          <View style={c.memberRow}>
            <View style={[c.avatar, { backgroundColor: m.color + '22' }]}>
              <Text style={[c.avatarTxt, { color: m.color }]}>{m.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[c.memberName, { color: txt }]}>{m.name}</Text>
              <Text style={[c.memberRole, { color: sub }]}>{m.role}</Text>
            </View>
            <View style={[c.statusChip, { backgroundColor: m.color + '18' }]}>
              <View style={[c.statusDot, { backgroundColor: m.color }]} />
              <Text style={[c.statusTxt, { color: m.color }]}>{m.status}</Text>
            </View>
          </View>
          {i < members.length - 1 && <View style={[c.sep, { backgroundColor: sep }]} />}
        </View>
      ))}
      <View style={[c.sep, { backgroundColor: sep }]} />
      <View style={c.chipsWrap}>
        {services.map(s => (
          <View key={s.label} style={[c.chip, { backgroundColor: s.color + '18' }]}>
            <Ionicons name={s.icon} size={12} color={s.color} />
            <Text style={[c.chipTxt, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Card2() {
  const txt = '#F0EEFF';
  const sub = 'rgba(240,238,255,0.45)';
  const sep = 'rgba(255,255,255,0.07)';

  const locs = [
    { initial: 'M', color: '#FF6B9D', name: 'Mom',   place: 'Office, Sector 18', time: '2m ago' },
    { initial: 'A', color: '#4CAF82', name: 'Aryan', place: 'DPS School, Noida', time: 'Live' },
    { initial: 'S', color: '#FFB347', name: 'Sara',  place: 'Home',              time: '5m ago' },
  ];

  const actions = [
    { icon: 'warning-outline',          label: 'SOS Alert',  color: '#EF4444' },
    { icon: 'checkmark-circle-outline', label: 'Check-in',   color: '#4CAF82' },
    { icon: 'shield-checkmark-outline', label: 'Safe Zones', color: '#3B82F6' },
  ];

  return (
    <View style={c.body}>
      <View style={c.liveHeader}>
        <Text style={[c.sectionLabel, { color: sub }]}>LIVE LOCATION</Text>
        <View style={c.livePill}>
          <View style={c.liveDot} />
          <Text style={c.liveTxt}>Live</Text>
        </View>
      </View>
      {locs.map((m, i) => (
        <View key={m.name}>
          <View style={c.locRow}>
            <View style={[c.avatar, { backgroundColor: m.color + '22' }]}>
              <Text style={[c.avatarTxt, { color: m.color }]}>{m.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[c.memberName, { color: txt }]}>{m.name}</Text>
              <Text style={[c.memberRole, { color: sub }]}>{m.place}</Text>
            </View>
            <Text style={[c.timeAgo, { color: sub }]}>{m.time}</Text>
          </View>
          {i < locs.length - 1 && <View style={[c.sep, { backgroundColor: sep }]} />}
        </View>
      ))}
      <View style={[c.sep, { backgroundColor: sep }]} />
      <View style={c.chipsWrap}>
        {actions.map(a => (
          <View key={a.label} style={[c.chip, { backgroundColor: a.color + '18' }]}>
            <Ionicons name={a.icon} size={12} color={a.color} />
            <Text style={[c.chipTxt, { color: a.color }]}>{a.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Card3() {
  const txt = '#F0EEFF';
  const sub = 'rgba(240,238,255,0.45)';
  const sep = 'rgba(255,255,255,0.07)';

  const pantry = [
    { name: 'Whole Milk',   color: '#EF4444', label: 'Expires tomorrow' },
    { name: 'Brown Eggs',   color: '#FFB347', label: 'Expires in 3 days' },
    { name: 'Greek Yogurt', color: '#4CAF82', label: '5 days left' },
  ];

  const budget = [
    { label: 'Grocery',   pct: 72, color: '#10B981' },
    { label: 'Dining',    pct: 45, color: '#FFB347' },
    { label: 'Utilities', pct: 88, color: '#EF4444' },
  ];

  return (
    <View style={c.body}>
      <Text style={[c.sectionLabel, { color: sub }]}>PANTRY EXPIRY</Text>
      {pantry.map((item, i) => (
        <View key={item.name}>
          <View style={c.pantryRow}>
            <View style={[c.dot, { backgroundColor: item.color }]} />
            <Text style={[c.memberName, { color: txt, flex: 1 }]}>{item.name}</Text>
            <Text style={[c.pantryLabel, { color: item.color }]}>{item.label}</Text>
          </View>
          {i < pantry.length - 1 && <View style={[c.sep, { backgroundColor: sep }]} />}
        </View>
      ))}
      <View style={[c.sep, { backgroundColor: sep }]} />
      <Text style={[c.sectionLabel, { color: sub }]}>MONTHLY BUDGET</Text>
      {budget.map(b => (
        <View key={b.label} style={c.budgetRow}>
          <Text style={[c.budgetLabel, { color: txt }]}>{b.label}</Text>
          <View style={[c.barBg, { backgroundColor: b.color + '20' }]}>
            <View style={[c.barFill, { backgroundColor: b.color, width: `${b.pct}%` }]} />
          </View>
          <Text style={[c.budgetPct, { color: b.color }]}>{b.pct}%</Text>
        </View>
      ))}
    </View>
  );
}

const CARDS = [Card1, Card2, Card3];
const CARD_TITLES = ['Family Hub', 'Safety & Tracking', 'AI Living'];
const CARD_ACCENTS = ['#6C63FF', '#4CAF82', '#FFB347'];

// ── Welcome screen ────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const dragAnim = useRef(new Animated.Value(0)).current;

  const accent = CARD_ACCENTS[idx];

  // Auto-cycle every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      advanceTo((idx + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, [idx]);

  const advanceTo = (newIdx) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setIdx(newIdx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  // Drag-up gesture — only claims when user moves upward, so button taps still fire
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) =>
      gs.dy < -10 && Math.abs(gs.dy) > Math.abs(gs.dx),
    onPanResponderMove: (_, gs) => {
      dragAnim.setValue(Math.max(gs.dy, -130));
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dy < -70) {
        router.push('/(auth)/login');
      } else {
        Animated.spring(dragAnim, { toValue: 0, useNativeDriver: true, tension: 140, friction: 9 }).start();
      }
    },
  })).current;

  const CardComponent = CARDS[idx];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0D0B1F', '#16163A', '#1A1040']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative orbs */}
      <View style={[styles.orb, { top: -90, right: -80, backgroundColor: accent + '22', width: 280, height: 280 }]} />
      <View style={[styles.orb, { bottom: 120, left: -100, backgroundColor: '#FF6B9D18', width: 240, height: 240 }]} />

      <SafeAreaView style={styles.safe}>

        {/* Brand row */}
        <View style={styles.brandRow}>
          <LinearGradient colors={['#8B5CF6', '#FF6B9D']} style={styles.logoBox}>
            <Text style={styles.logoLetter}>S</Text>
          </LinearGradient>
          <Text style={styles.brandName}>smartStack</Text>
        </View>

        {/* Hero text */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroText}>Control Everything{'\n'}in One Place</Text>
          <View style={[styles.featureBadge, { backgroundColor: accent + '22' }]}>
            <View style={[styles.featureDot, { backgroundColor: accent }]} />
            <Text style={[styles.featureLabel, { color: accent }]}>{CARD_TITLES[idx]}</Text>
          </View>
        </View>

        {/* Auto-cycling widget card */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <CardComponent />
          <View style={styles.tapHint}>
            <Text style={styles.tapTxt}>tap dots or wait to explore</Text>
          </View>
        </Animated.View>

        {/* Dot indicators */}
        <View style={styles.dots}>
          {[0, 1, 2].map(i => (
            <TouchableOpacity key={i} onPress={() => advanceTo(i)}>
              <View style={[styles.dot, {
                backgroundColor: i === idx ? accent : 'rgba(255,255,255,0.22)',
                width: i === idx ? 22 : 7,
              }]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom section — drag or tap to sign in */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.bottomSection, { transform: [{ translateY: dragAnim }] }]}
        >
          <View style={styles.dragPillWrap}>
            <View style={styles.dragPill} />
          </View>

          <LinearGradient
            colors={['#6C63FF', '#8B5CF6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.88}
            >
              <Text style={styles.ctaBtnTxt}>Get Started</Text>
              <Ionicons name="arrow-up" size={16} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.signInLinkWrap}>
            <Text style={styles.signInLinkTxt}>
              Already have an account?{'  '}
              <Text style={[styles.signInLinkBold, { color: accent }]}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 12 },

  orb: { position: 'absolute', borderRadius: 999 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontSize: 17, fontWeight: '900' },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  heroBlock: { gap: 10 },
  heroText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  featureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  featureDot: { width: 6, height: 6, borderRadius: 3 },
  featureLabel: { fontSize: 12, fontWeight: '700' },

  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  tapHint: { paddingVertical: 10, alignItems: 'center' },
  tapTxt: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center' },
  dot: { height: 7, borderRadius: 4 },

  bottomSection: { gap: 12 },
  dragPillWrap: { alignItems: 'center', paddingTop: 2, paddingBottom: 4 },
  dragPill: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  ctaGradient: {
    borderRadius: 14,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 7,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  ctaBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  signInLinkWrap: { alignItems: 'center', paddingBottom: 4 },
  signInLinkTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  signInLinkBold: { fontWeight: '800' },
});

// ── Card inner styles ─────────────────────────────────────────────────────────

const c = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  sep: { height: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 3 },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 3 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 14, fontWeight: '800' },
  memberName: { fontSize: 13, fontWeight: '700' },
  memberRole: { fontSize: 11, marginTop: 1 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
  timeAgo: { fontSize: 11 },
  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF444420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444' },
  liveTxt: { fontSize: 10, fontWeight: '800', color: '#EF4444' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  chipTxt: { fontSize: 11, fontWeight: '700' },
  pantryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pantryLabel: { fontSize: 11, fontWeight: '700' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetLabel: { fontSize: 12, fontWeight: '600', width: 68 },
  barBg: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  budgetPct: { fontSize: 11, fontWeight: '800', width: 30, textAlign: 'right' },
});
