import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Image, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import GlassCard from '../../../src/components/ui/GlassCard';
import StatusBadge from '../../../src/components/ui/StatusBadge';

const PAD = 16;



const GLANCE = [
  { id: '1', label: 'School Drop', icon: 'bus', status: 'done', color: '#6C63FF' },
  { id: '2', label: 'Homework', icon: 'book', status: 'done', color: '#4CAF82' },
  { id: '3', label: 'Healthy Meal', icon: 'nutrition', status: 'done', color: '#FF6B9D' },
  { id: '4', label: 'Bed Time', icon: 'moon', status: 'pending', color: '#9C27B0' },
  { id: '5', label: 'Family Time', icon: 'heart', status: 'in-progress', color: '#FF4081' },
  { id: '6', label: 'Exercise', icon: 'barbell', status: 'pending', color: '#FFB347' },
  { id: '7', label: 'Meds', icon: 'medkit', status: 'pending', color: '#26C6DA' },
];


const UPDATES = [
  { id: '1', name: 'Aarav', color: '#6C63FF', activity: 'At School', place: 'St. Joseph School', time: '8:40 AM', image: require('../../../assets/userchild2.png') },
  { id: '2', name: 'Myra', color: '#FF6B9D', activity: 'At Activity', place: 'Dance Class', time: '10:15 AM', image: require('../../../assets/userchild1.png') },
];

const QUICK_SERVICES = [
  { name: 'Well-being', icon: 'heart', color: '#FF6B9D', sub: '2 members tracked', route: '/(app)/wellbeing' },
  { name: 'Wardrobe', icon: 'shirt', color: '#6C63FF', sub: '6 items synced', route: '/(app)/wardrobe' },
  { name: 'Kitchen', icon: 'restaurant', color: '#FFB347', sub: '3 items expiring', route: '/(app)/kitchen' },
];

function spr(anim, toValue) {
  return Animated.spring(anim, { toValue, tension: 280, friction: 10, useNativeDriver: true });
}

function MemberBubble({ member, colors, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[styles.memberWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPressIn={() => spr(scale, 0.88).start()}
        onPressOut={() => spr(scale, 1).start()}
        onPress={onPress}
        activeOpacity={1}
      >
        <View style={[styles.memberAvatar, { backgroundColor: member.image ? 'transparent' : member.color }]}>
          {member.image
            ? <Image source={member.image} style={styles.memberImg} />
            : <Text style={styles.memberInitials}>{member.name.slice(0, 2).toUpperCase()}</Text>
          }
          <View style={styles.memberStatusDot} />
        </View>
      </TouchableOpacity>
      <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
      {member.age != null && <Text style={[styles.memberAge, { color: colors.textSecondary }]}>{member.age}y</Text>}
    </Animated.View>
  );
}


export default function Overview() {
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const { width: screenW } = useWindowDimensions();
  const glanceItemW = Math.floor((screenW - 2 * PAD - 20) / 5);
  const mountAnim = useRef(new Animated.Value(0)).current;

  const cctvPlayer = useVideoPlayer(require('../../../assets/cctvfootages/cctv3.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{
        opacity: mountAnim,
        transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        gap: 16,
      }}>

        {/* ── Family Card ── */}
        <GlassCard style={styles.familyCard}>

          {/* Row: members + Home Sweet Home */}
          <View style={styles.familyTopRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersScroll}
              style={{ flex: 1 }}
            >
              {members.map(m => <MemberBubble key={m.id} member={m} colors={colors} onPress={() => router.push(`/(app)/overview/member/${m.id}`)} />)}
            </ScrollView>

            <TouchableOpacity
              style={[styles.homeTile, { backgroundColor: isDark ? 'rgba(108,99,255,0.22)' : '#EEF0FF' }]}
              onPress={() => router.push('/(app)/overview/family')}
              activeOpacity={0.75}
            >
              <View style={[styles.homeTileIconWrap, { backgroundColor: colors.primary + '28' }]}>
                <Ionicons name="home" size={18} color={colors.primary} />
              </View>
              <View style={styles.homeTileText}>
                <Text style={[styles.homeTileTitle, { color: colors.textPrimary }]}>Home</Text>
                <View style={styles.homeTileSubRow}>
                  <Text style={[styles.homeTileSubtitle, { color: colors.primary }]}>Sweet Home</Text>
                  <Ionicons name="chevron-forward" size={11} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={[styles.statsStrip, { borderTopColor: divColor }]}>
            {[
              { dot: '#4CAF82', label: '1 At Home' },
              { dot: '#FFB347', label: `${members.length - 1} Away` },
              { dot: '#6C63FF', label: '5/8 Tasks' },
              { dot: '#FF6B9D', label: '3 Alerts' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.stripSep, { backgroundColor: divColor }]} />}
                <View style={styles.stripItem}>
                  <View style={[styles.stripDot, { backgroundColor: s.dot }]} />
                  <Text style={[styles.stripLabel, { color: colors.textPrimary }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

        </GlassCard>

        {/* ── Today at a Glance ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TODAY AT A GLANCE</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.glanceCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.glanceRow}>
              {GLANCE.map(item => (
                <TouchableOpacity key={item.id} style={[styles.glanceItem, { width: glanceItemW }]} activeOpacity={0.7}>
                  <View style={[styles.glanceIconBox, { backgroundColor: item.color + '1A' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                    {item.status === 'done' && (
                      <View style={styles.glanceCheck}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.glanceLabel, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </GlassCard>
        </View>

        {/* ── Subscribed Services — Bento Card ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SUBSCRIBED SERVICES</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.bentoWrap}>

            {/* ── Top block: CCTV (4×2) | [Kitchen(1×1) + Tracking(1×1)] over [Expenses(2×1)] ── */}
            <View style={styles.bentoTopBlock}>

              {/* CCTV — left, spans 2 rows, video background */}
              <TouchableOpacity
                style={[styles.bentoCell, styles.bentoCCTV, { padding: 0, overflow: 'hidden', backgroundColor: '#000' }]}
                onPress={() => router.push('/(app)/cctv')}
                activeOpacity={0.9}
              >
                <VideoView
                  player={cctvPlayer}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  nativeControls={false}
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.28)' }]} />
                <View style={[styles.bentoLive, { position: 'absolute', top: 8, left: 8 }]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTxt}>LIVE</Text>
                </View>
                <View style={styles.cctvBottomOverlay}>
                  <View style={styles.cctvIconBadge}>
                    <Ionicons name="videocam" size={12} color="#fff" />
                  </View>
                  <View>
                    <Text style={[styles.bentoCellTitle, { color: '#fff' }]}>CCTV</Text>
                    <Text style={[styles.bentoCellSub, { color: 'rgba(255,255,255,0.75)' }]}>3 cameras · Live</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Right column */}
              <View style={styles.bentoRightCol}>
                {/* Row 1: Kitchen (1×1) + Tracking (1×1) */}
                <View style={styles.bentoRightRow}>
                  <TouchableOpacity
                    style={[styles.bentoCell, { flex: 1, backgroundColor: isDark ? 'rgba(255,179,71,0.12)' : '#FFF8EE', padding: 7 }]}
                    onPress={() => router.push('/(app)/kitchen')}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.bentoCellIcon, { backgroundColor: '#FFB34720' }]}>
                      <Ionicons name="restaurant" size={12} color="#FFB347" />
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.bentoCellTitle, { color: colors.textPrimary }]}>Kitchen</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.bentoCellMetric, { color: '#FFB347' }]}>3 expiring</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bentoCell, { flex: 1, backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF', alignItems: 'center', justifyContent: 'center', padding: 7 }]}
                    onPress={() => router.push('/(app)/tracking')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate-circle" size={20} color="#3B82F6" />
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.bentoCellTiny, { color: colors.textPrimary }]}>Tracking</Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2: Expenses (full width) */}
                <TouchableOpacity
                  style={[styles.bentoCell, styles.bentoExpenses, { backgroundColor: isDark ? 'rgba(16,185,129,0.10)' : '#EEFFF8' }]}
                  onPress={() => router.push('/(app)/expenses')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.bentoCellIcon, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="wallet" size={13} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bentoCellTitle, { color: colors.textPrimary }]}>Expenses</Text>
                    <Text style={[styles.bentoCellMetric, { color: '#10B981' }]}>₹45,230</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={12} color="#10B981" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Row 2: 6 × icon tiles ── */}
            <View style={styles.bentoIconRow}>
              {[
                { name: 'Well-being', icon: 'heart',           color: '#FF6B9D', route: '/(app)/wellbeing' },
                { name: 'Wardrobe',   icon: 'shirt',           color: '#6C63FF', route: '/(app)/wardrobe' },
                { name: 'Fitness',    icon: 'barbell',         color: '#F59E0B', route: null },
                { name: 'Cleaning',   icon: 'sparkles',        color: '#06B6D4', route: null },
                { name: 'Grocery',    icon: 'cart',            color: '#FFB347', route: null },
                { name: 'Milk',       icon: 'water',           color: '#4CAF82', route: null },
              ].map(s => (
                <TouchableOpacity
                  key={s.name}
                  style={styles.iconTile}
                  onPress={() => s.route && router.push(s.route)}
                  activeOpacity={s.route ? 0.75 : 1}
                >
                  <View style={[styles.iconTileBox, { backgroundColor: s.color + '18' }]}>
                    <Ionicons name={s.icon} size={15} color={s.color} />
                  </View>
                  <Text style={[styles.iconTileName, { color: s.route ? colors.textPrimary : colors.textSecondary }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </GlassCard>
        </View>

        {/* ── Safety Banner ── */}
        <GlassCard style={styles.safetyCard}>
          <View style={[styles.safetyIcon, { backgroundColor: '#4CAF8228' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF82" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>Your Home is Safe</Text>
            <Text style={[styles.safetySub, { color: colors.textSecondary }]}>All systems working fine.</Text>
          </View>
          <TouchableOpacity style={styles.safetyBtn} onPress={() => router.push('/(app)/wellbeing')}>
            <Text style={styles.safetyBtnTxt}>View</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* ── Children Updates ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CHILDREN UPDATES</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/overview/children')}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.updatesCard}>
            {UPDATES.map((u, i) => (
              <View key={u.id}>
                <View style={styles.updateRow}>
                  <View style={[styles.updateAvatar, { backgroundColor: u.color }]}>
                    {u.image
                      ? <Image source={u.image} style={styles.updateAvatarImg} />
                      : <Text style={styles.updateInitials}>{u.name.slice(0, 2).toUpperCase()}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.updateNameRow}>
                      <Text style={[styles.updateName, { color: colors.textPrimary }]}>{u.name}</Text>
                      <View style={[styles.activityChip, { backgroundColor: u.color + '28' }]}>
                        <Text style={[styles.activityChipTxt, { color: u.color }]}>{u.activity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.updatePlace, { color: colors.textSecondary }]}>{u.place}</Text>
                    <Text style={[styles.updateTime, { color: colors.textSecondary }]}>{u.time}</Text>
                  </View>
                  <View style={[styles.locationBtn, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="location" size={13} color={colors.primary} />
                  </View>
                </View>
                {i < UPDATES.length - 1 && <View style={[styles.divider, { backgroundColor: divColor }]} />}
              </View>
            ))}
          </GlassCard>
        </View>

        {/* ── Services ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SERVICES</Text>
          <View style={{ gap: 8 }}>
            {QUICK_SERVICES.map(s => (
              <TouchableOpacity key={s.name} onPress={() => router.push(s.route)} activeOpacity={0.85}>
                <GlassCard style={styles.serviceRow}>
                  <View style={[styles.svcIcon, { backgroundColor: s.color + '28' }]}>
                    <Ionicons name={s.icon} size={17} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.svcName, { color: colors.textPrimary }]}>{s.name}</Text>
                    <Text style={[styles.svcSub, { color: colors.textSecondary }]}>{s.sub}</Text>
                  </View>
                  <StatusBadge label="Active" status="active" />
                  <Ionicons name="chevron-forward" size={13} color={colors.textSecondary} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 8 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: PAD, paddingBottom: 24 },

  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAll: { fontSize: 12, fontWeight: '600' },

  // Family card
  familyCard: { overflow: 'hidden' },
  familyTopRow: { flexDirection: 'row', alignItems: 'stretch', padding: 14, gap: 10 },
  membersScroll: { gap: 14, paddingVertical: 2 },
  memberWrap: { alignItems: 'center', gap: 4, width: 50 },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  memberImg: { width: 44, height: 44, borderRadius: 22 },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },
  memberStatusDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF82',
    borderWidth: 2, borderColor: '#fff',
  },
  memberName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  memberAge: { fontSize: 10, textAlign: 'center', opacity: 0.7 },

  homeTile: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12, gap: 10,
  },
  homeTileIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  homeTileText: { gap: 1 },
  homeTileTitle: { fontSize: 13, fontWeight: '700' },
  homeTileSubRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  homeTileSubtitle: { fontSize: 10, fontWeight: '600' },

  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 0.5, paddingHorizontal: 14, paddingVertical: 10,
    gap: 0,
  },
  stripItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  stripDot: { width: 7, height: 7, borderRadius: 3.5 },
  stripLabel: { fontSize: 11, fontWeight: '600' },
  stripSep: { width: 0.5, height: 20, marginHorizontal: 2 },

  // Today at a Glance
  glanceCard: { padding: 10 },
  glanceRow: { flexDirection: 'row' },
  glanceItem: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2, gap: 5 },
  glanceIconBox: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  glanceCheck: {
    position: 'absolute', bottom: -3, right: -3,
    width: 15, height: 15, borderRadius: 7.5,
    backgroundColor: '#4CAF82', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  glanceLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },

  // Bento Card
  bentoWrap: { padding: 10, gap: 8 },
  bentoTopBlock: { flexDirection: 'row', gap: 8 },
  bentoCCTV: { flex: 4, height: 128, borderRadius: 10 },
  bentoRightCol: { flex: 2, gap: 8 },
  cctvBottomOverlay: { position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cctvIconBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(108,99,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  bentoRightRow: { flexDirection: 'row', gap: 8, height: 60 },
  bentoCell: { borderRadius: 10, padding: 9, gap: 5 },
  bentoExpenses: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 60 },
  bentoCellTitle: { fontSize: 10, fontWeight: '700' },
  bentoCellSub: { fontSize: 9, fontWeight: '500' },
  bentoCellMetric: { fontSize: 10, fontWeight: '800' },
  bentoCellTiny: { fontSize: 8.5, fontWeight: '700', textAlign: 'center' },
  bentoCellIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  bentoLive: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF82' },
  liveTxt: { fontSize: 7.5, fontWeight: '800', color: '#4CAF82', letterSpacing: 0.8 },
  soonPill: { position: 'absolute', top: 7, right: 7, backgroundColor: 'rgba(255,179,71,0.2)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  soonPillTxt: { fontSize: 7.5, fontWeight: '800', color: '#FFB347' },
  bentoDivider: { height: 0.5 },
  bentoIconRow: { flexDirection: 'row', gap: 5 },
  iconTile: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4 },
  iconTileBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconTileName: { fontSize: 8.5, fontWeight: '600', textAlign: 'center' },

  // Safety
  safetyCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  safetyIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  safetyTitle: { fontSize: 13, fontWeight: '700' },
  safetySub: { fontSize: 12, marginTop: 1 },
  safetyBtn: { backgroundColor: '#4CAF82', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  safetyBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Updates
  updatesCard: { padding: 12, gap: 10 },
  updateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  updateAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  updateAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  updateInitials: { color: '#fff', fontWeight: '700', fontSize: 11 },
  updateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  updateName: { fontSize: 13, fontWeight: '600' },
  activityChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  activityChipTxt: { fontSize: 11, fontWeight: '600' },
  updatePlace: { fontSize: 12 },
  updateTime: { fontSize: 11, marginTop: 1, opacity: 0.7 },
  locationBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 0.5, marginVertical: 8 },

  // Services
  serviceRow: { flexDirection: 'row', alignItems: 'center', padding: 11, gap: 10 },
  svcIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  svcName: { fontSize: 13, fontWeight: '600' },
  svcSub: { fontSize: 12, marginTop: 1 },
});
