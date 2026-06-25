import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';

const { width: W } = Dimensions.get('window');

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹299',
    period: '/month',
    badge: null,
    saving: null,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '₹1,999',
    period: '/year',
    badge: 'BEST VALUE',
    saving: 'Save ₹1,589',
  },
];

const FEATURES = [
  {
    icon: 'people',
    color: '#6C63FF',
    grad: ['#6C63FF', '#9C27B0'],
    title: 'Up to 8 Family Members',
    sub: 'Free plan is limited to 4 members. Premium doubles your family capacity.',
  },
  {
    icon: 'location',
    color: '#FF6B9D',
    grad: ['#FF6B9D', '#FF4081'],
    title: 'Real-Time GPS Tracking',
    sub: 'Live location updates every 30 seconds for every family member.',
  },
  {
    icon: 'shield-checkmark',
    color: '#4CAF82',
    grad: ['#4CAF82', '#26C6DA'],
    title: 'Advanced Geo-Zones',
    sub: 'Unlimited safe zones with instant alerts when someone enters or leaves.',
  },
  {
    icon: 'calendar',
    color: '#FFB347',
    grad: ['#FFB347', '#FF6B6B'],
    title: 'Shared Family Calendar',
    sub: 'Sync events across the whole family with reminders and RSVP.',
  },
  {
    icon: 'bar-chart',
    color: '#3B82F6',
    grad: ['#3B82F6', '#6C63FF'],
    title: 'Expense Insights & Reports',
    sub: 'Monthly spend breakdowns, budget alerts, and AI-powered saving tips.',
  },
  {
    icon: 'shirt',
    color: '#9C27B0',
    grad: ['#9C27B0', '#FF6B9D'],
    title: 'Smart Wardrobe AI',
    sub: 'Outfit suggestions for every family member based on weather and occasion.',
  },
  {
    icon: 'restaurant',
    color: '#26C6DA',
    grad: ['#26C6DA', '#4CAF82'],
    title: 'Kitchen Meal Planner',
    sub: 'AI-generated weekly meal plans and automatic shopping list creation.',
  },
  {
    icon: 'notifications',
    color: '#FF6B6B',
    grad: ['#FF6B6B', '#FFB347'],
    title: 'Priority Alerts & SOS',
    sub: 'Instant push alerts with priority routing and emergency contacts.',
  },
  {
    icon: 'camera',
    color: '#6C63FF',
    grad: ['#6C63FF', '#3B82F6'],
    title: 'CCTV & Home Cameras',
    sub: 'Connect up to 4 cameras and view live feeds from anywhere.',
  },
  {
    icon: 'cloud-upload',
    color: '#4CAF82',
    grad: ['#4CAF82', '#6C63FF'],
    title: 'Cloud Backup & History',
    sub: 'Unlimited activity history, location logs, and data export.',
  },
];

const COMPARISON = [
  { label: 'Family members',        free: '4',        premium: '8' },
  { label: 'GPS tracking',          free: 'Basic',    premium: 'Real-time' },
  { label: 'Geo-zones',             free: '2',        premium: 'Unlimited' },
  { label: 'Expense history',       free: '30 days',  premium: 'Unlimited' },
  { label: 'Camera feeds',          free: '1',        premium: '4' },
  { label: 'AI suggestions',        free: false,      premium: true },
  { label: 'Meal planner',          free: false,      premium: true },
  { label: 'Cloud backup',          free: false,      premium: true },
  { label: 'Priority SOS alerts',   free: false,      premium: true },
  { label: 'Family activity report',free: false,      premium: true },
];

export default function PremiumScreen() {
  const { colors, isDark } = useTheme();
  const { family } = useFamilyStore();
  const isPremium = family?.plan === 'premium';

  const [selected, setSelected] = useState('yearly');
  const mountAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleUpgrade = () => {
    Alert.alert(
      'Coming Soon',
      'In-app purchases will be available in the next update. Stay tuned!',
      [{ text: 'OK' }],
    );
  };

  const bg = isDark ? '#070714' : '#F8F7FF';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={['#1A0050', '#2D0082', '#6C63FF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={S.hero}
        >
          {/* Decorative orbs */}
          <View style={[S.orb, { top: -40, right: -40, width: 200, height: 200, backgroundColor: 'rgba(255,107,157,0.15)' }]} />
          <View style={[S.orb, { bottom: 0, left: -20, width: 160, height: 160, backgroundColor: 'rgba(108,99,255,0.2)' }]} />

          <Animated.View style={{
            opacity: mountAnim,
            transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            alignItems: 'center', gap: 12,
          }}>
            {/* Crown icon */}
            <Animated.View style={[S.crownWrap, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={['#FFD700', '#FFB347']} style={S.crownGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: 32 }}>👑</Text>
              </LinearGradient>
            </Animated.View>

            <Text style={S.heroEyebrow}>SMARTSTACK</Text>
            <Text style={S.heroTitle}>Go Premium</Text>
            <Text style={S.heroSub}>
              Unlock the full potential of your family management.{'\n'}Everything you need, for everyone you love.
            </Text>

            {isPremium && (
              <View style={S.activeBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF82" />
                <Text style={{ color: '#4CAF82', fontSize: 13, fontWeight: '700' }}>Premium Active</Text>
              </View>
            )}
          </Animated.View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16, gap: 24, marginTop: 24 }}>
          {/* ── Plan Selector ── */}
          {!isPremium && (
            <Animated.View style={{ opacity: mountAnim, gap: 10 }}>
              <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Choose Your Plan</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {PLANS.map(plan => {
                  const active = selected === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={{ flex: 1 }}
                      onPress={() => setSelected(plan.id)}
                      activeOpacity={0.82}
                    >
                      <LinearGradient
                        colors={active ? ['#6C63FF', '#9C27B0'] : isDark ? ['#1A1A2E', '#1A1A2E'] : ['#F3F0FF', '#F3F0FF']}
                        style={[S.planCard, { borderColor: active ? '#6C63FF' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.15)' }]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      >
                        {plan.badge && (
                          <View style={S.planBadge}>
                            <Text style={S.planBadgeTxt}>{plan.badge}</Text>
                          </View>
                        )}
                        <Text style={[S.planLabel, { color: active ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>{plan.label}</Text>
                        <Text style={[S.planPrice, { color: active ? '#fff' : colors.textPrimary }]}>{plan.price}</Text>
                        <Text style={[S.planPeriod, { color: active ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{plan.period}</Text>
                        {plan.saving && (
                          <View style={[S.savingChip, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#4CAF8220' }]}>
                            <Text style={{ color: active ? '#fff' : '#4CAF82', fontSize: 10, fontWeight: '700' }}>{plan.saving}</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CTA */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.88}>
                  <LinearGradient colors={['#6C63FF', '#9C27B0', '#FF6B9D']} style={S.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={S.ctaTxt}>
                      Upgrade to Premium · {selected === 'yearly' ? '₹1,999/yr' : '₹299/mo'}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center' }}>
                Cancel anytime · No hidden charges · Secure payment
              </Text>
            </Animated.View>
          )}

          {/* ── Features grid ── */}
          <View style={{ gap: 10 }}>
            <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Everything in Premium</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {FEATURES.map((f, i) => (
                <Animated.View
                  key={f.title}
                  style={{
                    width: (W - 42) / 2,
                    opacity: mountAnim,
                    transform: [{
                      translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + i * 4, 0] }),
                    }],
                  }}
                >
                  <LinearGradient
                    colors={isDark ? ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.02)'] : ['#fff', '#FAF9FF']}
                    style={[S.featureCard, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : f.color + '20' }]}
                  >
                    <LinearGradient colors={f.grad} style={[S.featureIconWrap, { shadowColor: f.color }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name={f.icon} size={18} color="#fff" />
                    </LinearGradient>
                    <Text style={[S.featureTitle, { color: colors.textPrimary }]} numberOfLines={2}>{f.title}</Text>
                    <Text style={[S.featureSub, { color: colors.textSecondary }]} numberOfLines={3}>{f.sub}</Text>
                  </LinearGradient>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* ── Comparison Table ── */}
          <View style={{ gap: 10 }}>
            <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>Free vs Premium</Text>
            <View style={[S.table, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)' }]}>
              {/* Header */}
              <View style={[S.tableRow, S.tableHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.1)' }]}>
                <Text style={[S.tableHeaderTxt, { flex: 2, color: colors.textSecondary }]}>Feature</Text>
                <Text style={[S.tableHeaderTxt, { flex: 1, textAlign: 'center', color: colors.textSecondary }]}>Free</Text>
                <LinearGradient colors={['#6C63FF', '#9C27B0']} style={{ flex: 1, borderRadius: 6, paddingVertical: 4, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>Premium</Text>
                </LinearGradient>
              </View>
              {COMPARISON.map((row, i) => (
                <View
                  key={row.label}
                  style={[S.tableRow, {
                    borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(108,99,255,0.02)'),
                  }]}
                >
                  <Text style={[S.tableLabel, { flex: 2, color: colors.textPrimary }]}>{row.label}</Text>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof row.free === 'boolean'
                      ? <Ionicons name={row.free ? 'checkmark-circle' : 'close-circle'} size={16} color={row.free ? '#4CAF82' : '#FF6B6B'} />
                      : <Text style={[S.tableVal, { color: colors.textSecondary }]}>{row.free}</Text>}
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    {typeof row.premium === 'boolean'
                      ? <Ionicons name={row.premium ? 'checkmark-circle' : 'close-circle'} size={16} color={row.premium ? '#6C63FF' : '#FF6B6B'} />
                      : <Text style={[S.tableVal, { color: '#6C63FF', fontWeight: '700' }]}>{row.premium}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Testimonials ── */}
          <View style={{ gap: 10 }}>
            <Text style={[S.sectionTitle, { color: colors.textPrimary }]}>What families say</Text>
            {[
              { name: 'Ananya R.', stars: 5, text: 'The GPS tracking and geo-zones give me so much peace of mind. Worth every rupee!' },
              { name: 'Vikram S.', stars: 5, text: 'The AI expense advisor saved us ₹8,000 last month. Incredible.' },
              { name: 'Meera P.', stars: 5, text: 'Our whole family of 7 uses it daily. The wardrobe AI is surprisingly good!' },
            ].map(t => (
              <View key={t.name} style={[S.testimonialCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)' }]}>
                <View style={{ flexDirection: 'row', gap: 2, marginBottom: 6 }}>
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#FFD700" />
                  ))}
                </View>
                <Text style={[S.testimonialText, { color: colors.textPrimary }]}>"{t.text}"</Text>
                <Text style={[S.testimonialName, { color: colors.textSecondary }]}>— {t.name}</Text>
              </View>
            ))}
          </View>

          {/* ── Bottom CTA ── */}
          {!isPremium && (
            <View style={{ gap: 12, paddingBottom: 8 }}>
              <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.88}>
                <LinearGradient colors={['#6C63FF', '#9C27B0', '#FF6B9D']} style={S.ctaBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={S.ctaTxt}>Get Premium Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  hero: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden', gap: 0 },
  orb: { position: 'absolute', borderRadius: 999 },
  crownWrap: { marginBottom: 4 },
  crownGrad: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFD700', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5, marginTop: 8 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 21 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(76,175,130,0.15)', borderWidth: 1, borderColor: '#4CAF8240', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  planCard: { borderRadius: 16, padding: 16, gap: 4, borderWidth: 1.5, overflow: 'hidden', minHeight: 120 },
  planBadge: { alignSelf: 'flex-start', backgroundColor: '#FFD70030', borderWidth: 1, borderColor: '#FFD70060', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 4 },
  planBadgeTxt: { color: '#FFD700', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  planLabel: { fontSize: 11, fontWeight: '600' },
  planPrice: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  planPeriod: { fontSize: 12, fontWeight: '500' },
  savingChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },

  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, borderRadius: 16, shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  featureCard: { borderRadius: 14, padding: 12, gap: 6, borderWidth: 1 },
  featureIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  featureTitle: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  featureSub: { fontSize: 10, lineHeight: 14 },

  table: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  tableHeader: { paddingVertical: 10, borderBottomWidth: 1 },
  tableHeaderTxt: { fontSize: 11, fontWeight: '700' },
  tableLabel: { fontSize: 12, fontWeight: '500' },
  tableVal: { fontSize: 12, fontWeight: '600' },

  testimonialCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 2 },
  testimonialText: { fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  testimonialName: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
