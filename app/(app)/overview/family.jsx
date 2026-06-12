import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACTIVITIES = [
  { icon: 'school', color: '#6C63FF', title: 'Aarav checked in at school', time: '8:40 AM' },
  { icon: 'musical-notes', color: '#FF6B9D', title: "Myra's dance class started", time: '10:15 AM' },
  { icon: 'briefcase', color: '#4CAF82', title: 'Rajan arrived at office', time: '9:45 AM' },
  { icon: 'shield-checkmark', color: '#26C6DA', title: 'Home security active', time: 'Now' },
];

export default function FamilyScreen() {
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const mountAnim = useRef(new Animated.Value(0)).current;
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{
        opacity: mountAnim,
        transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        gap: 12,
      }}>

        {/* ── Family Summary ── */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.familyLabel, { color: colors.textSecondary }]}>FAMILY</Text>
              <Text style={[styles.familyName, { color: colors.textPrimary }]}>Singh Family</Text>
            </View>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary + '18' }]} activeOpacity={0.8}>
              <Ionicons name="person-add" size={13} color={colors.primary} />
              <Text style={[styles.addBtnTxt, { color: colors.primary }]}>Add Member</Text>
            </TouchableOpacity>
          </View>

          {/* Stats strip */}
          <View style={[styles.statStrip, { borderTopColor: divColor }]}>
            {[
              { value: `${members.length}`, label: 'Members', color: '#6C63FF' },
              { value: '1', label: 'At Home', color: '#4CAF82' },
              { value: `${members.length - 1}`, label: 'Away', color: '#FFB347' },
              { value: '5/8', label: 'Tasks', color: '#FF6B9D' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.stripDiv, { backgroundColor: divColor }]} />}
                <View style={styles.stripItem}>
                  <Text style={[styles.stripVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.stripLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </GlassCard>

        {/* ── Members ── */}
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>MEMBERS</Text>
        <GlassCard style={styles.listCard}>
          {members.map((m, i) => (
            <View key={m.id}>
              {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
              <TouchableOpacity
                style={styles.memberRow}
                onPress={() => router.push(`/(app)/overview/member/${m.id}`)}
                activeOpacity={0.72}
              >
                <View style={[styles.avatar, { backgroundColor: m.image ? 'transparent' : m.color }]}>
                  {m.image
                    ? <Image source={m.image} style={styles.avatarImg} />
                    : <Text style={styles.avatarTxt}>{m.name.slice(0, 2).toUpperCase()}</Text>
                  }
                  <View style={[styles.onlineDot, { borderColor: isDark ? '#000000' : '#fff' }]} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{m.name}</Text>
                  {m.age != null && (
                    <Text style={[styles.memberAge, { color: colors.textSecondary }]}>{m.age} years old</Text>
                  )}
                </View>

                <View style={[styles.statusChip, { backgroundColor: m.color + '18' }]}>
                  <View style={[styles.statusDot, { backgroundColor: m.color }]} />
                  <Text style={[styles.statusTxt, { color: m.color }]}>{m.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={13} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        {/* ── Today's Activity ── */}
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>TODAY'S ACTIVITY</Text>
        <GlassCard style={styles.listCard}>
          {ACTIVITIES.map((act, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
              <View style={styles.actRow}>
                <View style={[styles.actIcon, { backgroundColor: act.color + '18' }]}>
                  <Ionicons name={act.icon} size={14} color={act.color} />
                </View>
                <Text style={[styles.actTitle, { color: colors.textPrimary }]} numberOfLines={1}>{act.title}</Text>
                <Text style={[styles.actTime, { color: colors.textSecondary }]}>{act.time}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* ── Manage ── */}
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>MANAGE</Text>
        <View style={styles.actionsRow}>
          {[
            { icon: 'notifications', color: '#6C63FF', label: 'Alerts', sub: '3 unread' },
            { icon: 'location', color: '#FF6B9D', label: 'Location', sub: 'Sharing on' },
            { icon: 'shield-checkmark', color: '#4CAF82', label: 'Safety', sub: 'All clear' },
            { icon: 'calendar', color: '#FFB347', label: 'Schedule', sub: '2 events' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={{ flex: 1 }} activeOpacity={0.8}>
              <GlassCard style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                  <Ionicons name={a.icon} size={15} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{a.label}</Text>
                <Text style={[styles.actionSub, { color: colors.textSecondary }]}>{a.sub}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Settings ── */}
        <GlassCard style={styles.listCard}>
          {[
            { icon: 'notifications', color: '#6C63FF', label: 'Family Notifications', value: 'On' },
            { icon: 'location', color: '#FF6B9D', label: 'Location Sharing', value: 'Active' },
            { icon: 'shield-checkmark', color: '#4CAF82', label: 'Safety Settings', value: null },
          ].map((item, i) => (
            <View key={item.label}>
              {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={[styles.settingIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={14} color={item.color} />
                </View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                {item.value && (
                  <Text style={[styles.settingVal, { color: item.color }]}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 12 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 14, paddingBottom: 24 },

  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },

  // Summary card
  summaryCard: { padding: 0, overflow: 'hidden' },
  summaryTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 12,
  },
  familyLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  familyName: { fontSize: 15, fontWeight: '800', marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  addBtnTxt: { fontSize: 12, fontWeight: '600' },

  statStrip: { flexDirection: 'row', borderTopWidth: 0.5 },
  stripItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  stripDiv: { width: 0.5 },
  stripVal: { fontSize: 15, fontWeight: '800' },
  stripLabel: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // Generic grouped list card
  listCard: { padding: 0, overflow: 'hidden' },
  rowDiv: { height: 0.5, marginHorizontal: 12 },

  // Member rows
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 11 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4CAF82', borderWidth: 2,
  },
  memberName: { fontSize: 13, fontWeight: '600' },
  memberAge: { fontSize: 11, marginTop: 1 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusTxt: { fontSize: 11, fontWeight: '600' },

  // Activity rows
  actRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  actIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  actTitle: { flex: 1, fontSize: 12, fontWeight: '500' },
  actTime: { fontSize: 10, fontWeight: '500' },

  // Manage action grid
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionCard: { padding: 10, alignItems: 'flex-start', gap: 3 },
  actionIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  actionSub: { fontSize: 10 },

  // Settings rows
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 11, gap: 10,
  },
  settingIcon: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  settingVal: { fontSize: 12, fontWeight: '600', marginRight: 2 },
});
