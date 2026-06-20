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

// ─── Rich mock profile data keyed by username ─────────────────────────────
// Also keyed by old mock IDs ('1','2','3') so dev/offline mode still works

const MEMBER_DATA = {
  // ── Prashant Singh (Admin, 32) ──────────────────────────────────────────
  prashantsingh: {
    statusIcon: 'briefcase', statusColor: '#6C63FF',
    statusText: 'At Work', statusPlace: 'Tech Park, Bengaluru',
    statusTime: 'Departed at 9:00 AM',
    schedule: [
      { time: '8:30 AM', label: 'Left Home',      done: true,  icon: 'home' },
      { time: '9:15 AM', label: 'Reached Office', done: true,  icon: 'business' },
      { time: '11:00 AM',label: 'Sprint Standup',  done: true,  icon: 'people' },
      { time: '1:00 PM', label: 'Lunch Break',    done: false, icon: 'fast-food' },
      { time: '3:30 PM', label: 'Client Call',    done: false, icon: 'call' },
      { time: '6:30 PM', label: 'Heading Home',   done: false, icon: 'car' },
    ],
    transport: {
      label: 'Personal Car', detail: 'Route: Home → Tech Park',
      time: 'ETA home: 7:00 PM', icon: 'car', color: '#6C63FF',
    },
    activities: [
      { icon: 'calendar',         color: '#6C63FF', title: 'Sprint Review',       sub: 'Completed 8 tasks',       time: 'Today' },
      { icon: 'shield-checkmark', color: '#4CAF82', title: 'Home Security',       sub: 'All sensors active',      time: 'Just now' },
      { icon: 'notifications',    color: '#FFB347', title: 'School Pickup Alert', sub: 'Aarav checked out 3:30', time: '2h ago' },
    ],
    stats: [
      { label: 'Tasks',    value: '6/8', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Meetings', value: '3',   icon: 'people',            color: '#6C63FF' },
      { label: 'At Home',  value: 'No',  icon: 'home',              color: '#FFB347' },
      { label: 'Health',   value: '94%', icon: 'heart',             color: '#FF6B9D' },
    ],
  },

  // ── Somya Singh (30) ────────────────────────────────────────────────────
  somyasingh: {
    statusIcon: 'home', statusColor: '#FF6B9D',
    statusText: 'At Home', statusPlace: 'Home · Bengaluru',
    statusTime: 'Since 8:00 AM',
    schedule: [
      { time: '7:00 AM', label: 'Morning Yoga',   done: true,  icon: 'body' },
      { time: '8:00 AM', label: 'Kids Drop-Off',  done: true,  icon: 'car' },
      { time: '9:30 AM', label: 'Work from Home', done: true,  icon: 'laptop' },
      { time: '12:30 PM',label: 'Lunch',          done: false, icon: 'fast-food' },
      { time: '3:30 PM', label: 'Kids Pickup',    done: false, icon: 'people' },
      { time: '6:00 PM', label: 'Dinner Prep',    done: false, icon: 'restaurant' },
    ],
    transport: {
      label: 'Work from Home', detail: 'No commute today',
      time: 'Kids pickup at 3:30 PM', icon: 'home', color: '#FF6B9D',
    },
    activities: [
      { icon: 'checkmark-circle', color: '#4CAF82', title: 'Grocery Ordered',  sub: 'Delivery by 6 PM',        time: '1h ago' },
      { icon: 'heart',            color: '#FF6B9D', title: 'Wellbeing Check',  sub: 'Feeling great today',     time: '2h ago' },
      { icon: 'calendar',         color: '#6C63FF', title: 'PTA Meeting',      sub: 'Tomorrow at 10:00 AM',    time: 'Yesterday' },
    ],
    stats: [
      { label: 'Tasks',   value: '4/5', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Mood',    value: '😊',  icon: 'happy',             color: '#FF6B9D' },
      { label: 'At Home', value: 'Yes', icon: 'home',              color: '#6C63FF' },
      { label: 'Health',  value: '98%', icon: 'heart',             color: '#FFB347' },
    ],
  },

  // ── Aarav Singh (9, school) ─────────────────────────────────────────────
  'aarav.singh': {
    statusIcon: 'school', statusColor: '#6C63FF',
    statusText: 'At School', statusPlace: 'St. Joseph School',
    statusTime: 'Checked in at 8:45 AM',
    schedule: [
      { time: '8:45 AM', label: 'Checked In',    done: true,  icon: 'log-in' },
      { time: '9:00 AM', label: 'Math Class',    done: true,  icon: 'calculator' },
      { time: '10:30 AM',label: 'English Class', done: true,  icon: 'book' },
      { time: '11:00 AM',label: 'Lunch Break',   done: false, icon: 'fast-food' },
      { time: '1:00 PM', label: 'Science Class', done: false, icon: 'flask' },
      { time: '3:30 PM', label: 'Checked Out',   done: false, icon: 'log-out' },
    ],
    transport: {
      label: 'School Bus', detail: 'Bus No. KA 05 AS 1234',
      time: 'Drop time ~4:15 PM', icon: 'bus', color: '#6C63FF',
    },
    activities: [
      { icon: 'document-text', color: '#6C63FF', title: 'Homework Uploaded',  sub: 'Math Worksheet',     time: 'Yesterday' },
      { icon: 'trophy',        color: '#FFB347', title: 'Star of the Week',   sub: 'Class 4 - Section A', time: '2 days ago' },
      { icon: 'school',        color: '#4CAF82', title: 'Science Test',       sub: 'Score: 18/20',        time: '3 days ago' },
    ],
    stats: [
      { label: 'Attendance',    value: '96%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Tasks Done',    value: '12',  icon: 'list',              color: '#6C63FF' },
      { label: 'Achievements',  value: '5',   icon: 'trophy',            color: '#FFB347' },
      { label: 'Grade',         value: 'A+',  icon: 'school',            color: '#FF6B9D' },
    ],
  },

  // ── Myra Singh (7, dance) ───────────────────────────────────────────────
  'myra.singh': {
    statusIcon: 'musical-notes', statusColor: '#FF6B9D',
    statusText: 'At Activity', statusPlace: 'City Dance Studio',
    statusTime: 'Last seen at 10:15 AM',
    schedule: [
      { time: '9:30 AM', label: 'Dropped Off',      done: true,  icon: 'car' },
      { time: '10:00 AM',label: 'Dance Class',       done: true,  icon: 'musical-notes' },
      { time: '11:30 AM',label: 'Break',             done: false, icon: 'cafe' },
      { time: '12:00 PM',label: 'Practice Session',  done: false, icon: 'body' },
      { time: '1:00 PM', label: 'Pick Up',           done: false, icon: 'people' },
    ],
    transport: {
      label: 'School Van', detail: 'Van No. MH 04 BX 5678',
      time: 'Pick up at 1:00 PM', icon: 'car', color: '#FF6B9D',
    },
    activities: [
      { icon: 'ribbon',  color: '#FF6B9D', title: 'Dance Certificate', sub: 'Level 2 Complete',       time: '3 days ago' },
      { icon: 'camera',  color: '#9C27B0', title: 'Photo Added',       sub: 'Annual Day Rehearsal',   time: '5 days ago' },
      { icon: 'star',    color: '#FFB347', title: 'Best Dancer Award', sub: 'Monthly recognition',    time: '1 week ago' },
    ],
    stats: [
      { label: 'Classes',    value: '18', icon: 'musical-notes', color: '#FF6B9D' },
      { label: 'Tasks Done', value: '8',  icon: 'list',           color: '#6C63FF' },
      { label: 'Awards',     value: '2',  icon: 'ribbon',         color: '#FFB347' },
      { label: 'Grade',      value: 'A',  icon: 'school',         color: '#4CAF82' },
    ],
  },

  // ── Arjun Singh (12, school) ────────────────────────────────────────────
  'arjun.singh': {
    statusIcon: 'school', statusColor: '#3B82F6',
    statusText: 'At School', statusPlace: 'Delhi Public School',
    statusTime: 'Checked in at 7:50 AM',
    schedule: [
      { time: '7:50 AM', label: 'Checked In',      done: true,  icon: 'log-in' },
      { time: '8:00 AM', label: 'Computer Science', done: true,  icon: 'desktop' },
      { time: '9:30 AM', label: 'Physics Class',   done: true,  icon: 'flask' },
      { time: '11:00 AM',label: 'Lunch Break',     done: false, icon: 'fast-food' },
      { time: '12:00 PM',label: 'Cricket Practice',done: false, icon: 'baseball' },
      { time: '4:00 PM', label: 'Checked Out',     done: false, icon: 'log-out' },
    ],
    transport: {
      label: 'School Bus', detail: 'Bus No. DL 01 PQ 9876',
      time: 'Drop time ~4:45 PM', icon: 'bus', color: '#3B82F6',
    },
    activities: [
      { icon: 'trophy',        color: '#FFB347', title: 'Cricket Tournament',  sub: 'Team won semi-final',   time: 'Yesterday' },
      { icon: 'document-text', color: '#3B82F6', title: 'Project Submitted',   sub: 'Science Fair project',  time: '2 days ago' },
      { icon: 'star',          color: '#4CAF82', title: 'Top in Class',        sub: 'Physics exam: 38/40',   time: '4 days ago' },
    ],
    stats: [
      { label: 'Attendance',  value: '99%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Tasks Done',  value: '15',  icon: 'list',              color: '#3B82F6' },
      { label: 'Sports',      value: '4',   icon: 'baseball',          color: '#FFB347' },
      { label: 'Grade',       value: 'A+',  icon: 'school',            color: '#FF6B9D' },
    ],
  },

  // ── Riya Sharma (8, school) ─────────────────────────────────────────────
  'riya.sharma': {
    statusIcon: 'school', statusColor: '#9C27B0',
    statusText: 'At School', statusPlace: 'Kendriya Vidyalaya',
    statusTime: 'Checked in at 8:30 AM',
    schedule: [
      { time: '8:30 AM', label: 'Checked In',   done: true,  icon: 'log-in' },
      { time: '8:45 AM', label: 'Hindi Class',  done: true,  icon: 'language' },
      { time: '10:00 AM',label: 'Art & Craft',  done: true,  icon: 'color-palette' },
      { time: '11:00 AM',label: 'Lunch Break',  done: false, icon: 'fast-food' },
      { time: '1:00 PM', label: 'Maths Class',  done: false, icon: 'calculator' },
      { time: '3:00 PM', label: 'Checked Out',  done: false, icon: 'log-out' },
    ],
    transport: {
      label: 'School Van', detail: 'Van No. RJ 14 CD 3322',
      time: 'Drop time ~3:45 PM', icon: 'car', color: '#9C27B0',
    },
    activities: [
      { icon: 'color-palette', color: '#9C27B0', title: 'Art Competition',   sub: '1st place – Drawing',    time: '2 days ago' },
      { icon: 'ribbon',        color: '#FFB347', title: 'Perfect Attendance', sub: 'Full month streak',      time: '1 week ago' },
      { icon: 'document-text', color: '#4CAF82', title: 'Story Written',     sub: '"My Best Day" — 200 words', time: '3 days ago' },
    ],
    stats: [
      { label: 'Attendance', value: '100%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Arts',       value: '3',    icon: 'color-palette',     color: '#9C27B0' },
      { label: 'Awards',     value: '2',    icon: 'ribbon',            color: '#FFB347' },
      { label: 'Grade',      value: 'A',    icon: 'school',            color: '#FF6B9D' },
    ],
  },

  // ── Kabir Nair (10, school) ─────────────────────────────────────────────
  'kabir.nair': {
    statusIcon: 'school', statusColor: '#26C6DA',
    statusText: 'At School', statusPlace: 'Ryan International School',
    statusTime: 'Checked in at 8:00 AM',
    schedule: [
      { time: '8:00 AM', label: 'Checked In',      done: true,  icon: 'log-in' },
      { time: '8:15 AM', label: 'Social Studies',  done: true,  icon: 'earth' },
      { time: '9:45 AM', label: 'English Class',   done: true,  icon: 'book' },
      { time: '11:00 AM',label: 'Lunch Break',     done: false, icon: 'fast-food' },
      { time: '12:00 PM',label: 'Football Practice',done: false,icon: 'football' },
      { time: '3:30 PM', label: 'Checked Out',     done: false, icon: 'log-out' },
    ],
    transport: {
      label: 'School Bus', detail: 'Bus No. KL 07 MN 7744',
      time: 'Drop time ~4:10 PM', icon: 'bus', color: '#26C6DA',
    },
    activities: [
      { icon: 'football',      color: '#26C6DA', title: 'Goal Scorer',        sub: 'Inter-school match',      time: 'Yesterday' },
      { icon: 'book',          color: '#4CAF82', title: 'Book Report Done',   sub: '"The Jungle Book"',       time: '2 days ago' },
      { icon: 'checkmark-circle', color: '#6C63FF', title: 'All Tasks Clear', sub: 'No pending homework',     time: 'Today' },
    ],
    stats: [
      { label: 'Attendance', value: '97%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Tasks Done', value: '10',  icon: 'list',              color: '#26C6DA' },
      { label: 'Sports',     value: '2',   icon: 'football',          color: '#FFB347' },
      { label: 'Grade',      value: 'B+',  icon: 'school',            color: '#FF6B9D' },
    ],
  },

  // ── Legacy mock IDs (offline / dev fallback) ────────────────────────────
  '1': {
    statusIcon: 'school', statusColor: '#6C63FF',
    statusText: 'At School', statusPlace: 'St. Joseph School',
    statusTime: 'Checked in at 8:45 AM',
    schedule: [
      { time: '8:45 AM', label: 'Checked In',    done: true,  icon: 'log-in' },
      { time: '9:00 AM', label: 'Math Class',    done: true,  icon: 'calculator' },
      { time: '11:00 AM',label: 'Lunch Break',   done: false, icon: 'fast-food' },
      { time: '1:00 PM', label: 'Science Class', done: false, icon: 'flask' },
      { time: '3:30 PM', label: 'Checked Out',   done: false, icon: 'log-out' },
    ],
    transport: { label: 'School Bus', detail: 'Bus No. KA 05 AS 1234', time: 'Drop ~4:15 PM', icon: 'bus', color: '#6C63FF' },
    activities: [
      { icon: 'document-text', color: '#6C63FF', title: 'Homework Uploaded', sub: 'Math Worksheet',      time: 'Yesterday' },
      { icon: 'trophy',        color: '#FFB347', title: 'Star of the Week',  sub: 'Class 4 - Section A', time: '2 days ago' },
    ],
    stats: [
      { label: 'Attendance',   value: '96%', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Tasks Done',   value: '12',  icon: 'list',              color: '#6C63FF' },
      { label: 'Achievements', value: '5',   icon: 'trophy',            color: '#FFB347' },
      { label: 'Grade',        value: 'A+',  icon: 'school',            color: '#FF6B9D' },
    ],
  },
  '2': {
    statusIcon: 'musical-notes', statusColor: '#FF6B9D',
    statusText: 'At Activity', statusPlace: 'City Dance Studio',
    statusTime: 'Last seen at 10:15 AM',
    schedule: [
      { time: '9:30 AM', label: 'Dropped Off',     done: true,  icon: 'car' },
      { time: '10:00 AM',label: 'Dance Class',      done: true,  icon: 'musical-notes' },
      { time: '11:30 AM',label: 'Break',            done: false, icon: 'cafe' },
      { time: '12:00 PM',label: 'Practice Session', done: false, icon: 'body' },
      { time: '1:00 PM', label: 'Pick Up',          done: false, icon: 'people' },
    ],
    transport: { label: 'School Van', detail: 'Van No. MH 04 BX 5678', time: 'Pick up at 1:00 PM', icon: 'car', color: '#FF6B9D' },
    activities: [
      { icon: 'ribbon', color: '#FF6B9D', title: 'Dance Certificate', sub: 'Level 2 Complete',     time: '3 days ago' },
      { icon: 'camera', color: '#9C27B0', title: 'Photo Added',       sub: 'Annual Day Rehearsal', time: '5 days ago' },
    ],
    stats: [
      { label: 'Classes',    value: '18', icon: 'musical-notes', color: '#FF6B9D' },
      { label: 'Tasks Done', value: '8',  icon: 'list',           color: '#6C63FF' },
      { label: 'Awards',     value: '2',  icon: 'ribbon',         color: '#FFB347' },
      { label: 'Grade',      value: 'A',  icon: 'school',         color: '#4CAF82' },
    ],
  },
  '3': {
    statusIcon: 'briefcase', statusColor: '#4CAF82',
    statusText: 'At Work', statusPlace: 'Tech Park, Bangalore',
    statusTime: 'Departed at 9:00 AM',
    schedule: [
      { time: '9:00 AM', label: 'Left Home',      done: true,  icon: 'home' },
      { time: '9:45 AM', label: 'Reached Office', done: true,  icon: 'business' },
      { time: '1:00 PM', label: 'Lunch Break',    done: false, icon: 'fast-food' },
      { time: '3:00 PM', label: 'Team Standup',   done: false, icon: 'people' },
      { time: '6:00 PM', label: 'Heading Home',   done: false, icon: 'car' },
    ],
    transport: { label: 'Personal Vehicle', detail: 'Route: Home → Tech Park', time: 'ETA home: 6:30 PM', icon: 'car', color: '#4CAF82' },
    activities: [
      { icon: 'notifications',    color: '#6C63FF', title: 'Meeting Reminder', sub: 'Team standup at 3 PM',  time: 'Today' },
      { icon: 'shield-checkmark', color: '#4CAF82', title: 'Home Security',    sub: 'All sensors active',   time: 'Just now' },
    ],
    stats: [
      { label: 'Tasks',    value: '5/8', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Meetings', value: '3',   icon: 'people',            color: '#6C63FF' },
      { label: 'At Home',  value: 'No',  icon: 'home',              color: '#FFB347' },
      { label: 'Health',   value: '92%', icon: 'heart',             color: '#FF6B9D' },
    ],
  },
};

const DEFAULT_STATUS = {
  statusIcon: 'person', statusColor: '#6C63FF',
  statusText: 'Active', statusPlace: 'Unknown location',
  statusTime: 'No recent check-in',
  schedule: [],
  transport: { label: 'N/A', detail: '—', time: '—', icon: 'car', color: '#6C63FF' },
  activities: [],
  stats: [
    { label: 'Tasks',  value: '—', icon: 'checkmark-circle', color: '#4CAF82' },
    { label: 'Events', value: '—', icon: 'calendar',         color: '#6C63FF' },
    { label: 'Health', value: '—', icon: 'heart',            color: '#FF6B9D' },
    { label: 'Role',   value: '—', icon: 'person',           color: '#FFB347' },
  ],
};

export default function MemberProfile() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const mountAnim = useRef(new Animated.Value(0)).current;

  const member = members.find(m => m.id === id) || members[0];

  // Look up by ID first (legacy mock), then by username (real accounts)
  const data = MEMBER_DATA[id] || MEMBER_DATA[member?.username] || {
    ...DEFAULT_STATUS,
    statusColor: member?.color || '#6C63FF',
    stats: [
      { label: 'Role',   value: member?.role === 'admin' ? 'Admin' : 'Member', icon: 'person',           color: member?.color || '#6C63FF' },
      { label: 'Tasks',  value: '—', icon: 'checkmark-circle', color: '#4CAF82' },
      { label: 'Events', value: '—', icon: 'calendar',         color: '#6C63FF' },
      { label: 'Health', value: '—', icon: 'heart',            color: '#FF6B9D' },
    ],
  };
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1, duration: 400,
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

        {/* ── Member Header ── */}
        <GlassCard style={[styles.statusCard, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' }}>
            <View style={[styles.statusIconWrap, { backgroundColor: (member?.color || data.statusColor) + '22', width: 56, height: 56, borderRadius: 28 }]}>
              {member?.avatar
                ? <Image source={{ uri: member.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                : <Text style={{ color: member?.color || data.statusColor, fontSize: 20, fontWeight: '800' }}>
                    {(member?.name || 'M').slice(0, 2).toUpperCase()}
                  </Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member?.name || 'Member'}</Text>
              {member?.username
                ? <Text style={[styles.statusTime, { color: colors.textSecondary }]}>@{member.username}</Text>
                : null}
              {member?.uniqueId
                ? <Text style={[styles.statusTime, { color: colors.textSecondary }]}>ID: {member.uniqueId}</Text>
                : null}
              <Text style={[styles.statusText, { color: member?.color || data.statusColor, marginTop: 2 }]}>
                {member?.role === 'admin' ? 'Family Admin' : 'Member'}
              </Text>
            </View>
          </View>

          {/* Current status row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.statusIconWrap, { backgroundColor: data.statusColor + '22', width: 34, height: 34, borderRadius: 8 }]}>
              <Ionicons name={data.statusIcon} size={16} color={data.statusColor} />
            </View>
            <View>
              <Text style={[styles.statusText, { color: data.statusColor }]}>{data.statusText}</Text>
              <Text style={[styles.statusTime, { color: colors.textSecondary }]}>{data.statusPlace}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={[styles.statusTime, { color: colors.textSecondary }]}>{data.statusTime}</Text>
          </View>
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
        {data.schedule.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TODAY'S SCHEDULE</Text>
            <GlassCard style={styles.scheduleCard}>
              {data.schedule.map((item, i) => (
                <View key={i} style={styles.scheduleRow}>
                  <View style={styles.timelineCol}>
                    <View style={[styles.timelineDot, {
                      backgroundColor: item.done ? data.statusColor : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                    }]} />
                    {i < data.schedule.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: divColor }]} />
                    )}
                  </View>
                  <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{item.time}</Text>
                  <Text style={[
                    styles.scheduleLabel,
                    { color: item.done ? colors.textPrimary : colors.textSecondary, fontWeight: item.done ? '600' : '400' },
                  ]} numberOfLines={1}>{item.label}</Text>
                  {item.done && <Ionicons name="checkmark-circle" size={16} color={data.statusColor} />}
                </View>
              ))}
            </GlassCard>
          </>
        )}

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
        {data.activities.length > 0 && (
          <>
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
          </>
        )}

        {/* ── Action Buttons ── */}
        <View style={styles.actionsRow}>
          {[
            { icon: 'location',         label: 'Track',   color: '#6C63FF' },
            { icon: 'call',             label: 'Call',    color: '#4CAF82' },
            { icon: 'chatbubble',       label: 'Message', color: '#FF6B9D' },
            { icon: 'shield-checkmark', label: 'Safety',  color: '#FFB347' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.8}>
              <GlassCard style={styles.actionCard}>
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

  statusCard: { padding: 14 },
  statusIconWrap: { alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 17, fontWeight: '800' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTime: { fontSize: 11, marginTop: 1 },

  statsCard: { flexDirection: 'row', padding: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  statSep: { width: 0.5, marginVertical: 4 },

  scheduleCard: { padding: 14, gap: 0 },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 36 },
  timelineCol: { width: 16, alignItems: 'center', paddingTop: 4 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 1.5, flex: 1, marginTop: 3, minHeight: 20 },
  scheduleTime: { fontSize: 11, width: 60, paddingTop: 2 },
  scheduleLabel: { flex: 1, fontSize: 13, paddingTop: 1 },

  transportCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  transportIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transportLabel: { fontSize: 14, fontWeight: '700' },
  transportDetail: { fontSize: 12, marginTop: 2 },
  transportTime: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  transportBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  transportBadgeTxt: { fontSize: 11, fontWeight: '700' },

  actRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  actIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actTitle: { fontSize: 13, fontWeight: '600' },
  actSub: { fontSize: 11, marginTop: 2 },
  actTime: { fontSize: 11 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
  actionCard: { padding: 12, alignItems: 'center', gap: 8 },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600' },
});
