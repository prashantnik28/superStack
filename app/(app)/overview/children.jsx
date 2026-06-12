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

const CHILD_DATA = {
  '1': {
    grade: 'Grade 4',
    school: 'St. Joseph School',
    tasks: { done: 4, total: 6 },
    health: 92,
    attendance: '96%',
    achievements: 5,
    schedule: [
      { time: '8:45 AM', label: 'School Check-in', done: true, color: '#6C63FF' },
      { time: '11:00 AM', label: 'Lunch Break', done: false, color: '#FFB347' },
      { time: '3:30 PM', label: 'School Out', done: false, color: '#4CAF82' },
    ],
  },
  '2': {
    grade: 'Grade 2',
    school: 'St. Joseph School',
    tasks: { done: 3, total: 5 },
    health: 88,
    attendance: '94%',
    achievements: 2,
    schedule: [
      { time: '9:30 AM', label: 'Dance Class', done: true, color: '#FF6B9D' },
      { time: '11:30 AM', label: 'Break', done: false, color: '#FFB347' },
      { time: '1:00 PM', label: 'Pick Up', done: false, color: '#4CAF82' },
    ],
  },
};

export default function ChildrenScreen() {
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const children = members.filter(m => m.age != null && m.age < 18);
  const mountAnim = useRef(new Animated.Value(0)).current;
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 420,
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
        transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        gap: 14,
      }}>

        {children.map(child => {
          const data = CHILD_DATA[child.id] || CHILD_DATA['1'];
          return (
            <TouchableOpacity
              key={child.id}
              onPress={() => router.push(`/(app)/overview/member/${child.id}`)}
              activeOpacity={0.92}
            >
              <GlassCard style={styles.childCard}>

                {/* Top: avatar + info + status */}
                <View style={styles.childTop}>
                  <View style={[styles.childAvatar, { backgroundColor: child.image ? 'transparent' : child.color }]}>
                    {child.image
                      ? <Image source={child.image} style={styles.childAvatarImg} />
                      : <Text style={styles.childInitials}>{child.name.slice(0, 2).toUpperCase()}</Text>
                    }
                    <View style={[styles.onlineDot, { borderColor: isDark ? '#000000' : '#fff' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.childName, { color: colors.textPrimary }]}>{child.name}</Text>
                    <Text style={[styles.childMeta, { color: colors.textSecondary }]}>{data.grade} · {child.age} years old</Text>
                    <Text style={[styles.childSchool, { color: colors.textSecondary }]}>{data.school}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: child.color + '22' }]}>
                    <View style={[styles.statusDot, { backgroundColor: child.color }]} />
                    <Text style={[styles.statusTxt, { color: child.color }]}>{child.status}</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={[styles.statsRow, { borderTopColor: divColor }]}>
                  {[
                    { label: 'Attendance', value: data.attendance, icon: 'checkmark-circle', color: '#4CAF82' },
                    { label: 'Tasks', value: `${data.tasks.done}/${data.tasks.total}`, icon: 'list', color: '#6C63FF' },
                    { label: 'Health', value: `${data.health}%`, icon: 'heart', color: '#FF6B9D' },
                    { label: 'Awards', value: `${data.achievements}`, icon: 'trophy', color: '#FFB347' },
                  ].map((s, i) => (
                    <React.Fragment key={s.label}>
                      {i > 0 && <View style={[styles.statSep, { backgroundColor: divColor }]} />}
                      <View style={styles.statItem}>
                        <View style={[styles.statIconWrap, { backgroundColor: s.color + '22' }]}>
                          <Ionicons name={s.icon} size={13} color={s.color} />
                        </View>
                        <Text style={[styles.statVal, { color: colors.textPrimary }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>

                {/* Mini schedule */}
                <View style={[styles.scheduleSection, { borderTopColor: divColor }]}>
                  <Text style={[styles.scheduleTitle, { color: colors.textSecondary }]}>TODAY</Text>
                  {data.schedule.map((item, idx) => (
                    <View key={idx} style={styles.scheduleItem}>
                      <View style={[styles.scheduleDot, {
                        backgroundColor: item.done
                          ? item.color
                          : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB'),
                      }]} />
                      <Text style={[styles.scheduleTime, { color: colors.textSecondary }]}>{item.time}</Text>
                      <Text style={[
                        styles.scheduleLabel,
                        { color: item.done ? colors.textPrimary : colors.textSecondary, fontWeight: item.done ? '600' : '400' },
                      ]}>{item.label}</Text>
                      {item.done && <Ionicons name="checkmark-circle" size={14} color={item.color} />}
                    </View>
                  ))}
                </View>

                {/* View Profile row */}
                <View style={[styles.profileBtnRow, { borderTopColor: divColor }]}>
                  <Text style={[styles.profileBtnTxt, { color: child.color }]}>View Full Profile</Text>
                  <Ionicons name="chevron-forward" size={13} color={child.color} />
                </View>

              </GlassCard>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 8 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 24 },

  childCard: { overflow: 'hidden', padding: 0 },

  childTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  childAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  childAvatarImg: { width: 60, height: 60, borderRadius: 30 },
  childInitials: { color: '#fff', fontWeight: '800', fontSize: 18 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: '#4CAF82', borderWidth: 2,
  },
  childName: { fontSize: 15, fontWeight: '800' },
  childMeta: { fontSize: 12, marginTop: 2 },
  childSchool: { fontSize: 11, marginTop: 1 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', borderTopWidth: 0.5,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  statSep: { width: 0.5, marginVertical: 4 },

  scheduleSection: { borderTopWidth: 0.5, padding: 14, gap: 8 },
  scheduleTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleDot: { width: 8, height: 8, borderRadius: 4 },
  scheduleTime: { fontSize: 11, width: 58 },
  scheduleLabel: { flex: 1, fontSize: 12 },

  profileBtnRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderTopWidth: 0.5, gap: 4,
  },
  profileBtnTxt: { fontSize: 13, fontWeight: '700' },
});
