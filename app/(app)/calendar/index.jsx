import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LETTERS = ['S','M','T','W','T','F','S'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dayOffset(y, m)   { return new Date(y, m, 1).getDay(); }
function dayOfWeek(y, m, d){ return new Date(y, m, d).getDay(); }

const TODAY_YEAR  = 2026;
const TODAY_MONTH = 4; // May
const TODAY_DATE  = 12;

const EVENTS = [
  { id:'1',  title:'School Annual Day',         sub:'St. Joseph School',     time:'10:00 AM', end:'',         color:'#6C63FF', icon:'school',        date:12, month:4, year:2026 },
  { id:'2',  title:"Myra's Dance Class",         sub:'City Dance Studio',     time:'4:30 PM',  end:'5:30 PM',  color:'#FF6B9D', icon:'musical-notes', date:12, month:4, year:2026 },
  { id:'3',  title:'Grocery Delivery',           sub:'BigBasket Order #4821', time:'6:00 AM',  end:'',         color:'#FFB347', icon:'cart',          date:13, month:4, year:2026 },
  { id:'4',  title:'Pediatrician Appointment',   sub:'Dr. Meera Nair',        time:'10:00 AM', end:'11:00 AM', color:'#4CAF82', icon:'medkit',        date:13, month:4, year:2026 },
  { id:'5',  title:'Home Cleaning',              sub:'CleanHome Services',    time:'3:00 PM',  end:'5:00 PM',  color:'#9C27B0', icon:'sparkles',      date:14, month:4, year:2026 },
  { id:'6',  title:'Milk Subscription',          sub:'Daily Dairy',           time:'7:00 AM',  end:'',         color:'#26C6DA', icon:'water',         date:15, month:4, year:2026 },
  { id:'7',  title:"Aarav's Football Practice",  sub:'City Sports Ground',    time:'4:00 PM',  end:'6:00 PM',  color:'#6C63FF', icon:'football',      date:15, month:4, year:2026 },
  { id:'8',  title:'Family Dinner',              sub:'Home',                  time:'7:30 PM',  end:'',         color:'#FF6B9D', icon:'restaurant',    date:17, month:4, year:2026 },
  { id:'9',  title:"Aarav's Math Tuition",       sub:'Rajesh Sir, Online',    time:'5:00 PM',  end:'6:00 PM',  color:'#6C63FF', icon:'book',          date:18, month:4, year:2026 },
  { id:'10', title:'Laundry Pickup',             sub:'WashKing',              time:'9:00 AM',  end:'',         color:'#FFB347', icon:'shirt',         date:20, month:4, year:2026 },
];

// Build 7-day week strip centred on a given date
function buildWeek(y, m, d) {
  const dow = dayOfWeek(y, m, d); // 0=Sun
  const days = [];
  for (let i = 0; i < 7; i++) {
    const offset = i - dow;
    const dt     = new Date(y, m, d + offset);
    days.push({ date: dt.getDate(), month: dt.getMonth(), year: dt.getFullYear(), letter: DAY_LETTERS[i], name: DAY_NAMES[i] });
  }
  return days;
}

function eventsFor(y, m, d) {
  return EVENTS.filter(e => e.year === y && e.month === m && e.date === d);
}

function hasEvents(y, m, d) {
  return EVENTS.some(e => e.year === y && e.month === m && e.date === d);
}

// ── Event card inside timeline ────────────────────────────────────────────────
function EventCard({ ev, colors, isDark, last }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[8,0] }) }] }}>
      <TouchableOpacity activeOpacity={0.8}>
        <GlassCard style={styles.evCard}>
          {/* Left accent */}
          <View style={[styles.evAccent, { backgroundColor: ev.color }]} />
          {/* Icon */}
          <View style={[styles.evIconWrap, { backgroundColor: ev.color + '1E' }]}>
            <Ionicons name={ev.icon} size={15} color={ev.color} />
          </View>
          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.evTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ev.title}</Text>
            <Text style={[styles.evSub,   { color: colors.textSecondary }]} numberOfLines={1}>{ev.sub}</Text>
          </View>
          {/* Time */}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.evTime, { color: ev.color }]}>{ev.time}</Text>
            {ev.end ? <Text style={[styles.evEnd, { color: colors.textSecondary }]}>{ev.end}</Text> : null}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const scrollRef = useRef(null);

  const [year,  setYear]  = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [sel,   setSel]   = useState(TODAY_DATE);

  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  // Full month grid
  const totalDays  = daysInMonth(year, month);
  const offset     = dayOffset(year, month);
  const cells      = Array.from({ length: offset + totalDays }, (_, i) => i < offset ? null : i - offset + 1);

  // Week strip
  const week = buildWeek(year, month, sel);

  const selEvents = eventsFor(year, month, sel);

  // Upcoming events (next 7 days from today)
  const upcoming = EVENTS.filter(e => {
    const d = new Date(e.year, e.month, e.date);
    const t = new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DATE);
    const diff = (d - t) / 86400000;
    return diff >= 0 && diff <= 7;
  });

  // Group upcoming by date
  const upcomingGroups = [];
  upcoming.forEach(ev => {
    const key = `${ev.year}-${ev.month}-${ev.date}`;
    let g = upcomingGroups.find(x => x.key === key);
    if (!g) {
      const dow = dayOfWeek(ev.year, ev.month, ev.date);
      g = { key, date: ev.date, month: ev.month, year: ev.year, dayName: DAY_NAMES[dow], events: [] };
      upcomingGroups.push(g);
    }
    g.events.push(ev);
  });

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSel(1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSel(1);
  }

  const isToday = (d) => d === TODAY_DATE && month === TODAY_MONTH && year === TODAY_YEAR;
  const isSel   = (d) => d === sel;

  return (
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Month navigation ── */}
      <GlassCard style={styles.calCard}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F8' }]}>
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTxt, { color: colors.textPrimary }]}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F8' }]}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day-letter headers */}
        <View style={styles.dayHeaders}>
          {DAY_LETTERS.map((l, i) => (
            <Text key={i} style={[styles.dayHdrTxt, { color: colors.textSecondary }]}>{l}</Text>
          ))}
        </View>

        {/* Date grid */}
        <View style={styles.dateGrid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={styles.dateCell} />;
            const selected = isSel(day);
            const today    = isToday(day);
            const hasDots  = hasEvents(year, month, day);
            return (
              <TouchableOpacity
                key={day}
                style={styles.dateCell}
                onPress={() => setSel(day)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.dateBubble,
                  selected && { backgroundColor: colors.primary },
                  today && !selected && { borderWidth: 2, borderColor: colors.primary },
                ]}>
                  <Text style={[
                    styles.dateTxt,
                    { color: selected ? '#fff' : today ? colors.primary : colors.textPrimary },
                    selected && { fontWeight: '800' },
                  ]}>
                    {day}
                  </Text>
                </View>
                {hasDots && !selected && (
                  <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* ── Week strip ── */}
      <GlassCard style={styles.weekCard}>
        {week.map((w, i) => {
          const selected = w.date === sel && w.month === month && w.year === year;
          const today    = w.date === TODAY_DATE && w.month === TODAY_MONTH && w.year === TODAY_YEAR;
          const dots     = hasEvents(w.year, w.month, w.date);
          return (
            <TouchableOpacity
              key={i}
              style={styles.weekDay}
              onPress={() => { setYear(w.year); setMonth(w.month); setSel(w.date); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekLetter, { color: selected ? colors.primary : colors.textSecondary }]}>
                {w.letter}
              </Text>
              <View style={[
                styles.weekBubble,
                selected && { backgroundColor: colors.primary },
                today && !selected && { borderWidth: 2, borderColor: colors.primary },
              ]}>
                <Text style={[
                  styles.weekDateTxt,
                  { color: selected ? '#fff' : today ? colors.primary : colors.textPrimary },
                ]}>
                  {w.date}
                </Text>
              </View>
              {dots && !selected && (
                <View style={[styles.weekDot, { backgroundColor: colors.primary }]} />
              )}
              {!dots && <View style={styles.weekDot} />}
            </TouchableOpacity>
          );
        })}
      </GlassCard>

      {/* ── Selected day events ── */}
      <View style={styles.sectionRow}>
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>
          {isToday(sel) ? "TODAY" : `${DAY_NAMES[dayOfWeek(year, month, sel)].toUpperCase()}, ${MONTHS[month].slice(0,3).toUpperCase()} ${sel}`}
        </Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addBtnTxt}>Add</Text>
        </TouchableOpacity>
      </View>

      {selEvents.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No events on this day</Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Tap Add to create one</Text>
        </GlassCard>
      ) : (
        selEvents.map((ev, i) => (
          <EventCard key={ev.id} ev={ev} colors={colors} isDark={isDark} last={i === selEvents.length - 1} />
        ))
      )}

      {/* ── Upcoming ── */}
      {upcomingGroups.length > 0 && (
        <>
          <Text style={[styles.secLabel, { color: colors.textSecondary, marginTop: 4 }]}>UPCOMING</Text>
          {upcomingGroups.map(group => (
            <View key={group.key} style={styles.upcomingGroup}>
              {/* Date badge */}
              <View style={styles.dateBadgeCol}>
                <View style={[styles.dateBadge, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.dateBadgeNum, { color: colors.primary }]}>{group.date}</Text>
                  <Text style={[styles.dateBadgeDay, { color: colors.primary }]}>{group.dayName.slice(0, 3)}</Text>
                </View>
                {group.events.length > 1 && (
                  <View style={[styles.dateBadgeLine, { backgroundColor: colors.primary + '30' }]} />
                )}
              </View>
              {/* Events */}
              <View style={{ flex: 1, gap: 6 }}>
                {group.events.map(ev => (
                  <TouchableOpacity key={ev.id} activeOpacity={0.8} onPress={() => { setYear(ev.year); setMonth(ev.month); setSel(ev.date); }}>
                    <GlassCard style={styles.upcomingCard}>
                      <View style={[styles.upcomingIcon, { backgroundColor: ev.color + '1E' }]}>
                        <Ionicons name={ev.icon} size={14} color={ev.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.upcomingTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ev.title}</Text>
                        <Text style={[styles.upcomingSub, { color: colors.textSecondary }]} numberOfLines={1}>{ev.sub}</Text>
                      </View>
                      <Text style={[styles.upcomingTime, { color: ev.color }]}>{ev.time}</Text>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 14, paddingBottom: 24, gap: 12 },

  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Calendar grid card
  calCard: { padding: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  monthTxt: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  dayHdrTxt: { width: 32, textAlign: 'center', fontSize: 11, fontWeight: '600' },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', alignItems: 'center', marginBottom: 2 },
  dateBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateTxt: { fontSize: 13, fontWeight: '600' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  // Week strip
  weekCard: { flexDirection: 'row', padding: 10 },
  weekDay: { flex: 1, alignItems: 'center', gap: 4 },
  weekLetter: { fontSize: 10, fontWeight: '700' },
  weekBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weekDateTxt: { fontSize: 12, fontWeight: '700' },
  weekDot: { width: 4, height: 4, borderRadius: 2 },

  // Event cards
  evCard: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, gap: 10, overflow: 'hidden' },
  evAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  evIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  evTitle: { fontSize: 13, fontWeight: '600' },
  evSub: { fontSize: 11, marginTop: 1 },
  evTime: { fontSize: 12, fontWeight: '700' },
  evEnd: { fontSize: 10, marginTop: 1 },

  // Empty state
  emptyCard: { padding: 28, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  emptyHint: { fontSize: 11 },

  // Add button
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  addBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Upcoming groups
  upcomingGroup: { flexDirection: 'row', gap: 10 },
  dateBadgeCol: { alignItems: 'center', gap: 0 },
  dateBadge: { width: 46, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 1 },
  dateBadgeNum: { fontSize: 16, fontWeight: '900' },
  dateBadgeDay: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateBadgeLine: { width: 2, flex: 1, borderRadius: 1, minHeight: 8 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  upcomingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  upcomingTitle: { fontSize: 12, fontWeight: '600' },
  upcomingSub: { fontSize: 10, marginTop: 1 },
  upcomingTime: { fontSize: 11, fontWeight: '700' },
});
