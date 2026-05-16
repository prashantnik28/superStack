import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../../src/stores/useFamilyStore';
import GlassCard from '../../../../src/components/ui/GlassCard';

const MEMBER_DATA = {
  '1': {
    statusIcon: 'school',
    statusColor: '#6C63FF',
    statusText: 'At School',
    statusPlace: 'St. Joseph School',
    statusTime: 'Checked in at 8:45 AM',
    schedule: [
      { time: '8:45 AM', label: 'Checked In', done: true, icon: 'log-in' },
      { time: '9:00 AM', label: 'Math Class', done: true, icon: 'calculator' },
      { time: '11:00 AM', label: 'Lunch Break', done: false, icon: 'fast-food' },
      { time: '1:00 PM', label: 'Science Class', done: false, icon: 'flask' },
      { time: '3:30 PM', label: 'Checked Out', done: false, icon: 'log-out' },
    ],
    transport: {
      label: 'School Bus',
      detail: 'Bus No. KA 05 AS 1234',
      time: 'Drop time around 4:15 PM',
      icon: 'bus',
      color: '#6C63FF',
    },
    activities: [
      { icon: 'document-text', color: '#6C63FF', title: 'Homework Uploaded', sub: 'Math Worksheet', time: 'Yesterday' },
      { icon: 'trophy', color: '#FFB347', title: 'New Achievement', sub: 'Star of the Week', time: '2 days ago' },
    ],
    stats: [
      { label: 'Attendance', value: '96%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Tasks Done', value: '12', icon: 'list', color: '#6C63FF' },
      { label: 'Achievements', value: '5', icon: 'trophy', color: '#FFB347' },
      { label: 'Grade', value: 'A+', icon: 'school', color: '#FF6B9D' },
    ],
  },
  '2': {
    statusIcon: 'musical-notes',
    statusColor: '#FF6B9D',
    statusText: 'At Activity',
    statusPlace: 'City Dance Studio',
    statusTime: 'Last seen at 10:15 AM',
    schedule: [
      { time: '9:30 AM', label: 'Dropped Off', done: true, icon: 'car' },
      { time: '10:00 AM', label: 'Dance Class', done: true, icon: 'musical-notes' },
      { time: '11:30 AM', label: 'Break', done: false, icon: 'cafe' },
      { time: '12:00 PM', label: 'Practice Session', done: false, icon: 'body' },
      { time: '1:00 PM', label: 'Pick Up', done: false, icon: 'people' },
    ],
    transport: {
      label: 'School Van',
      detail: 'Van No. MH 04 BX 5678',
      time: 'Pick up at 1:00 PM',
      icon: 'car',
      color: '#FF6B9D',
    },
    activities: [
      { icon: 'ribbon', color: '#FF6B9D', title: 'Dance Certificate', sub: 'Level 2 Complete', time: '3 days ago' },
      { icon: 'camera', color: '#9C27B0', title: 'Photo Added', sub: 'Annual Day Rehearsal', time: '5 days ago' },
    ],
    stats: [
      { label: 'Classes', value: '18', icon: 'musical-notes', color: '#FF6B9D' },
      { label: 'Tasks Done', value: '8', icon: 'list', color: '#6C63FF' },
      { label: 'Awards', value: '2', icon: 'ribbon', color: '#FFB347' },
      { label: 'Grade', value: 'A', icon: 'school', color: '#4CAF82' },
    ],
  },
  '3': {
    statusIcon: 'briefcase',
    statusColor: '#4CAF82',
    statusText: 'At Work',
    statusPlace: 'Tech Park, Bangalore',
    statusTime: 'Departed at 9:00 AM',
    schedule: [
      { time: '9:00 AM', label: 'Left Home', done: true, icon: 'home' },
      { time: '9:45 AM', label: 'Reached Office', done: true, icon: 'business' },
      { time: '1:00 PM', label: 'Lunch Break', done: false, icon: 'fast-food' },
      { time: '3:00 PM', label: 'Team Standup', done: false, icon: 'people' },
      { time: '6:00 PM', label: 'Heading Home', done: false, icon: 'car' },
    ],
    transport: {
      label: 'Personal Vehicle',
      detail: 'Route: Home → Tech Park',
      time: 'ETA home: 6:30 PM',
      icon: 'car',
      color: '#4CAF82',
    },
    activities: [
      { icon: 'notifications', color: '#6C63FF', title: 'Meeting Reminder', sub: 'Team standup at 3 PM', time: 'Today' },
      { icon: 'shield-checkmark', color: '#4CAF82', title: 'Home Security', sub: 'All sensors active', time: 'Just now' },
    ],
    stats: [
      { label: 'Tasks', value: '5/8', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Meetings', value: '3', icon: 'people', color: '#6C63FF' },
      { label: 'At Home', value: 'No', icon: 'home', color: '#FFB347' },
      { label: 'Health', value: '92%', icon: 'heart', color: '#FF6B9D' },
    ],
  },
};

export default function MemberProfile() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const mountAnim = useRef(new Animated.Value(0)).current;

  const member = members.find(m => m.id === id) || members[0];
  const data = MEMBER_DATA[id] || MEMBER_DATA['1'];
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
        transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        gap: 14,
      }}>

        {/* ── Status Card ── */}
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusIconWrap, { backgroundColor: data.statusColor + '22' }]}>
              <Ionicons name={data.statusIcon} size={22} color={data.statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusText, { color: data.statusColor }]}>{data.statusText}</Text>
              <Text style={[styles.statusPlace, { color: colors.textPrimary }]}>{data.statusPlace}</Text>
              <Text style={[styles.statusTime, { color: colors.textSecondary }]}>{data.statusTime}</Text>
            </View>
          </View>
          {member.image && (
            <Image source={member.image} style={[styles.statusAvatar, { borderColor: data.statusColor + '44' }]} />
          )}
        </GlassCard>

        {/* ── Quick Stats ── */}
        <GlassCard style={styles.statsCard}>
          {data.stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={[styles.statSep, { backgroundColor: divColor }]} />}
              <View style={styles.statItem}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={14} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: colors.textPrimary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </GlassCard>

        {/* ── Today's Schedule ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TODAY'S SCHEDULE</Text>
        <GlassCard style={styles.scheduleCard}>
          {data.schedule.map((item, i) => (
            <View key={i} style={styles.scheduleRow}>
              {/* Timeline line */}
              <View style={styles.timelineCol}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: item.done ? data.statusColor : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB') },
                ]} />
                {i < data.schedule.length - 1 && (
                  <View style={[styles.timelineLine, { backgroundColor: divColor }]} />
                )}
              </View>
              {/* Time */}
              <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{item.time}</Text>
              {/* Label */}
              <Text style={[
                styles.scheduleLabel,
                { color: item.done ? colors.textPrimary : colors.textSecondary, fontWeight: item.done ? '600' : '400' },
              ]} numberOfLines={1}>{item.label}</Text>
              {/* Done check */}
              {item.done && (
                <Ionicons name="checkmark-circle" size={16} color={data.statusColor} />
              )}
            </View>
          ))}
        </GlassCard>

        {/* ── Transport Card ── */}
        <GlassCard style={styles.transportCard}>
          <View style={[styles.transportIcon, { backgroundColor: data.transport.color + '22' }]}>
            <Ionicons name={data.transport.icon} size={20} color={data.transport.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.transportLabel, { color: colors.textPrimary }]}>{data.transport.label}</Text>
            <Text style={[styles.transportDetail, { color: colors.textSecondary }]}>{data.transport.detail}</Text>
            <Text style={[styles.transportTime, { color: data.transport.color }]}>{data.transport.time}</Text>
          </View>
          <View style={[styles.transportBadge, { backgroundColor: data.transport.color + '18' }]}>
            <Text style={[styles.transportBadgeTxt, { color: data.transport.color }]}>Live</Text>
          </View>
        </GlassCard>

        {/* ── Recent Activity ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
        {data.activities.map((act, i) => (
          <GlassCard key={i} style={styles.actRow}>
            <View style={[styles.actIcon, { backgroundColor: act.color + '22' }]}>
              <Ionicons name={act.icon} size={17} color={act.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actTitle, { color: colors.textPrimary }]}>{act.title}</Text>
              <Text style={[styles.actSub, { color: colors.textSecondary }]}>{act.sub}</Text>
            </View>
            <Text style={[styles.actTime, { color: colors.textSecondary }]}>{act.time}</Text>
          </GlassCard>
        ))}

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          {[
            { icon: 'location', label: 'Track', color: '#6C63FF' },
            { icon: 'call', label: 'Call', color: '#4CAF82' },
            { icon: 'chatbubble', label: 'Message', color: '#FF6B9D' },
            { icon: 'shield-checkmark', label: 'Safety', color: '#FFB347' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.8}>
              <GlassCard style={[styles.actionCard, { }]}>
                <View style={[styles.actionIconWrap, { backgroundColor: a.color + '22' }]}>
                  <Ionicons name={a.icon} size={20} color={a.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{a.label}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 8 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 24 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },

  // Status
  statusCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusPlace: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  statusTime: { fontSize: 11, marginTop: 2 },
  statusAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2 },

  // Stats
  statsCard: { flexDirection: 'row', padding: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  statSep: { width: 0.5, marginVertical: 4 },

  // Schedule
  scheduleCard: { padding: 14, gap: 0 },
  scheduleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, minHeight: 36,
  },
  timelineCol: { width: 16, alignItems: 'center', paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 1.5, flex: 1, marginTop: 3, minHeight: 20 },
  scheduleTime: { fontSize: 11, width: 58, paddingTop: 2 },
  scheduleLabel: { flex: 1, fontSize: 13, paddingTop: 1 },

  // Transport
  transportCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  transportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transportLabel: { fontSize: 14, fontWeight: '700' },
  transportDetail: { fontSize: 12, marginTop: 2 },
  transportTime: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  transportBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  transportBadgeTxt: { fontSize: 11, fontWeight: '700' },

  // Activity
  actRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  actIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 13, fontWeight: '600' },
  actSub: { fontSize: 11, marginTop: 2 },
  actTime: { fontSize: 11 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  actionCard: { padding: 12, alignItems: 'center', gap: 8 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600' },
});
