import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import StatusBadge from '../../../src/components/ui/StatusBadge';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TODAY = 12;
const MONTH = 'May 2026';

const CALENDAR_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const WEEK_START_OFFSET = 4; // May 2026 starts on Friday (index 5), so offset is 5

const EVENTS = [
  { id: '1', title: "Aarav's Football Practice", time: '4:00 PM', duration: '2h', color: '#6C63FF', member: 'Aarav', date: 12 },
  { id: '2', title: "Myra's Dance Recital", time: '6:30 PM', duration: '1.5h', color: '#FF6B9D', member: 'Myra', date: 12 },
  { id: '3', title: 'Home Cleaning', time: '10:00 AM', duration: '3h', color: '#4CAF82', member: 'Home', date: 13 },
  { id: '4', title: 'Grocery Delivery', time: '11:00 AM', duration: '', color: '#FFB347', member: 'Home', date: 14 },
  { id: '5', title: "Aarav's Math Tuition", time: '5:00 PM', duration: '1h', color: '#6C63FF', member: 'Aarav', date: 15 },
];

export default function CalendarScreen() {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const todayEvents = EVENTS.filter(e => e.date === selectedDate);

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.titleRow}>
        <Text style={[styles.h2, { color: colors.textPrimary }]}>{MONTH}</Text>
        <TouchableOpacity style={[styles.addEvtBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addEvtTxt}>Add Event</Text>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.calCard}>
        <View style={styles.daysHeader}>
          {DAYS.map(d => (
            <Text key={d} style={[styles.dayLabel, { color: colors.textSecondary }]}>{d}</Text>
          ))}
        </View>
        <View style={styles.datesGrid}>
          {Array.from({ length: WEEK_START_OFFSET }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dateCell} />
          ))}
          {CALENDAR_DAYS.map(day => {
            const hasEvents = EVENTS.some(e => e.date === day);
            const isSelected = day === selectedDate;
            const isToday = day === TODAY;
            return (
              <TouchableOpacity key={day} onPress={() => setSelectedDate(day)} style={styles.dateCell}>
                <View style={[
                  styles.dateBubble,
                  isSelected && { backgroundColor: colors.primary },
                  isToday && !isSelected && { borderWidth: 2, borderColor: colors.primary },
                ]}>
                  <Text style={[
                    styles.dateTxt,
                    { color: isSelected ? '#fff' : colors.textPrimary },
                  ]}>{day}</Text>
                </View>
                {hasEvents && !isSelected && <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {selectedDate === TODAY ? "Today's Schedule" : `May ${selectedDate} Schedule`}
        </Text>
        <Text style={[styles.evtCount, { color: colors.textSecondary }]}>{todayEvents.length} events</Text>
      </View>

      {todayEvents.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No events on this day</Text>
        </GlassCard>
      ) : (
        todayEvents.map(ev => (
          <GlassCard key={ev.id} style={styles.eventCard}>
            <View style={[styles.eventBar, { backgroundColor: ev.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{ev.title}</Text>
              <View style={styles.eventMeta}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{ev.time}{ev.duration ? ` · ${ev.duration}` : ''}</Text>
              </View>
            </View>
            <View style={[styles.memberTag, { backgroundColor: ev.color + '22' }]}>
              <Text style={[styles.memberTagTxt, { color: ev.color }]}>{ev.member}</Text>
            </View>
          </GlassCard>
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontSize: 22, fontWeight: '700' },
  addEvtBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addEvtTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  calCard: { padding: 16 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  dayLabel: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'center' },
  datesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', alignItems: 'center', marginBottom: 4 },
  dateBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dateTxt: { fontSize: 13, fontWeight: '600' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  evtCount: { fontSize: 12 },
  emptyCard: { padding: 32, alignItems: 'center', gap: 8 },
  emptyTxt: { fontSize: 13 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, overflow: 'hidden' },
  eventBar: { width: 4, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  eventTitle: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 8 },
  eventTime: { fontSize: 11 },
  memberTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  memberTagTxt: { fontSize: 11, fontWeight: '700' },
});
