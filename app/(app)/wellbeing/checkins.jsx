import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';


const CHECKINS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', events: [
    { time: '7:55 AM', label: 'Left home', icon: 'home', done: true },
    { time: '8:40 AM', label: 'Arrived at school', icon: 'school', done: true },
    { time: '3:15 PM', label: 'School dismissed', icon: 'checkmark-circle', done: false },
    { time: '4:00 PM', label: 'Expected home', icon: 'home-outline', done: false },
  ]},
  { id: '2', name: 'Myra', color: '#FF6B9D', events: [
    { time: '9:50 AM', label: 'Left home', icon: 'home', done: true },
    { time: '10:15 AM', label: 'Arrived at Dance Studio', icon: 'musical-notes', done: true },
    { time: '12:00 PM', label: 'Class ends', icon: 'checkmark-circle', done: false },
    { time: '12:30 PM', label: 'Expected home', icon: 'home-outline', done: false },
  ]},
];

export default function CheckinsScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.flex]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h2, { color: colors.textPrimary }]}>Today's Check-ins</Text>
        {CHECKINS.map(member => (
          <GlassCard key={member.id} style={styles.card}>
            <View style={styles.memberHeader}>
              <View style={[styles.avatar, { backgroundColor: member.color }]}>
                <Text style={styles.avatarTxt}>{member.name.slice(0,2).toUpperCase()}</Text>
              </View>
              <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
              <View style={[styles.badge, { backgroundColor: member.color + '22' }]}>
                <Text style={[styles.badgeTxt, { color: member.color }]}>
                  {member.events.filter(e => e.done).length}/{member.events.length} done
                </Text>
              </View>
            </View>
            <View style={styles.timeline}>
              {member.events.map((ev, i) => (
                <View key={i} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: ev.done ? member.color : colors.border }]}>
                      <Ionicons name={ev.icon} size={10} color={ev.done ? '#fff' : colors.textSecondary} />
                    </View>
                    {i < member.events.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: ev.done ? member.color + '60' : colors.border }]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTxt, { color: ev.done ? colors.textPrimary : colors.textSecondary }]}>{ev.label}</Text>
                    <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>{ev.time}</Text>
                  </View>
                  {ev.done && <Ionicons name="checkmark-circle" size={16} color={member.color} />}
                </View>
              ))}
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  h2: { fontSize: 22, fontWeight: '700' },
  card: { padding: 16, gap: 14 },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  memberName: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 48 },
  timelineLeft: { alignItems: 'center', width: 22 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, minHeight: 20, marginTop: 2 },
  timelineContent: { flex: 1, paddingTop: 2 },
  timelineTxt: { fontSize: 13, fontWeight: '600' },
  timelineTime: { fontSize: 11, marginTop: 2 },
});
