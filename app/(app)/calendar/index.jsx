import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Easing, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import { useCalendarStore } from '../../../src/stores/useCalendarStore';
import { useNotificationsStore } from '../../../src/stores/useNotificationsStore';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_LETTERS = ['S','M','T','W','T','F','S'];

const _now        = new Date();
const TODAY_YEAR  = _now.getFullYear();
const TODAY_MONTH = _now.getMonth();
const TODAY_DATE  = _now.getDate();

const CYCLE_TEXTS = [
  'Create Reminder',
  'Add New Event',
  'Set a Task',
  'Plan Something',
  'Add a Note',
  'Schedule Event',
];


const FILTER_OPTIONS = [
  { id:'school',   label:'School',   icon:'school',    color:'#6C63FF' },
  { id:'health',   label:'Health',   icon:'medkit',    color:'#4CAF82' },
  { id:'family',   label:'Family',   icon:'people',    color:'#FF6B9D' },
  { id:'shopping', label:'Shopping', icon:'cart',      color:'#FFB347' },
  { id:'home',     label:'Home',     icon:'home',      color:'#9C27B0' },
  { id:'fitness',  label:'Fitness',  icon:'barbell',   color:'#F59E0B' },
  { id:'reminder', label:'Reminder', icon:'alarm',     color:'#EF4444' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dayOffset(y, m)   { return new Date(y, m, 1).getDay(); }
function dayOfWeek(y, m, d){ return new Date(y, m, d).getDay(); }

// ── EventCard ─────────────────────────────────────────────────────────────────
function EventCard({ ev, colors, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: ev.completed ? 0.45 : anim, transform: [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[8,0] }) }] }}>
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <GlassCard style={styles.evCard}>
          <View style={[styles.evAccent, { backgroundColor: ev.color }]} />
          <View style={[styles.evIconWrap, { backgroundColor: ev.color + '1E' }]}>
            <Ionicons name={ev.completed ? 'checkmark-circle' : ev.icon} size={15} color={ev.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.evTitle, { color: colors.textPrimary, textDecorationLine: ev.completed ? 'line-through' : 'none' }]} numberOfLines={1}>{ev.title}</Text>
            {ev.sub ? <Text style={[styles.evSub, { color: colors.textSecondary }]} numberOfLines={1}>{ev.sub}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.evTime, { color: ev.color }]}>{ev.time || '—'}</Text>
            {ev.end ? <Text style={[styles.evEnd, { color: colors.textSecondary }]}>{ev.end}</Text> : null}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── TabSwitcher ───────────────────────────────────────────────────────────────
function TabSwitcher({ active, onChange, completedCount, isDark, colors }) {
  const tabs = [
    { id: 'active',    label: 'Active',    icon: 'flash-outline' },
    { id: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
  ];
  const bgOuter = isDark ? '#16162A' : '#EBEBF5';
  const bgOn    = isDark ? '#24243E' : '#FFFFFF';
  const clrOff  = isDark ? 'rgba(240,238,255,0.35)' : '#A0A0B0';

  return (
    <View style={[ts.wrap, { backgroundColor: bgOuter }]}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[ts.tab, on && [ts.tabOn, { backgroundColor: bgOn }]]}
            onPress={() => onChange(t.id)}
            activeOpacity={0.8}
          >
            <Ionicons name={t.icon} size={13} color={on ? colors.primary : clrOff} />
            <Text style={[ts.txt, { color: on ? colors.primary : clrOff }]}>{t.label}</Text>
            {t.id === 'completed' && completedCount > 0 && (
              <View style={[ts.badge, { backgroundColor: on ? colors.primary : colors.primary + '30' }]}>
                <Text style={[ts.badgeTxt, { color: on ? '#fff' : colors.primary }]}>{completedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const ts = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, padding: 4, gap: 3 },
  tab:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabOn: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 4 },
  txt:   { fontSize: 13, fontWeight: '700' },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99, minWidth: 18, alignItems: 'center' },
  badgeTxt: { fontSize: 10, fontWeight: '800' },
});

// ── SectionPill ───────────────────────────────────────────────────────────────
function SectionPill({ icon, label, count, color, isDark }) {
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  return (
    <View style={[sp.wrap, { backgroundColor: bg }]}>
      <View style={[sp.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
      <Text style={[sp.label, { color }]}>{label}</Text>
      {count != null && count > 0 && (
        <View style={[sp.count, { backgroundColor: color + '20' }]}>
          <Text style={[sp.countTxt, { color }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}
const sp = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  iconWrap: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  count:    { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 },
  countTxt: { fontSize: 10, fontWeight: '800' },
});

// ── CompletedEventCard ────────────────────────────────────────────────────────
function CompletedEventCard({ ev, colors, isDark, onPress }) {
  const bg  = isDark ? '#1C1C2E' : '#FFFFFF';
  const sub = isDark ? 'rgba(240,238,255,0.45)' : '#9CA3AF';
  return (
    <TouchableOpacity
      style={[cec.wrap, { backgroundColor: bg, shadowColor: '#000', shadowOpacity: isDark ? 0.18 : 0.07, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[cec.check, { backgroundColor: '#4CAF8222' }]}>
        <Ionicons name="checkmark-circle" size={18} color="#4CAF82" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[cec.title, { color: colors.textPrimary }]} numberOfLines={1}>{ev.title}</Text>
        {ev.sub ? <Text style={[cec.sub, { color: sub }]} numberOfLines={1}>{ev.sub}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <View style={[cec.datePill, { backgroundColor: ev.color + '20' }]}>
          <Text style={[cec.dateStr, { color: ev.color }]}>
            {MONTHS[ev.month]?.slice(0, 3) ?? ''} {ev.date}
          </Text>
        </View>
        {ev.time ? <Text style={[cec.time, { color: sub }]}>{ev.time}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}
const cec = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 14, marginBottom: 8 },
  check:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 13, fontWeight: '600', textDecorationLine: 'line-through' },
  sub:     { fontSize: 11, marginTop: 1 },
  datePill:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  dateStr: { fontSize: 10, fontWeight: '700' },
  time:    { fontSize: 10 },
});

// ── NotifActivityCard ─────────────────────────────────────────────────────────
function NotifActivityCard({ notif, isDark, colors }) {
  const txt = isDark ? '#F0EEFF' : '#16163A';
  const sub = isDark ? 'rgba(240,238,255,0.45)' : '#9CA3AF';
  const divClr = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (
    <View style={[nac.row, { borderBottomColor: divClr }]}>
      <View style={[nac.iconWrap, { backgroundColor: (notif.color || '#6C63FF') + '18' }]}>
        <Ionicons name={notif.icon || 'notifications-outline'} size={15} color={notif.color || '#6C63FF'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[nac.title, { color: txt }]} numberOfLines={1}>{notif.title}</Text>
        <Text style={[nac.sub, { color: sub }]} numberOfLines={1}>{notif.sub || notif.body}</Text>
      </View>
      <Text style={[nac.time, { color: sub }]}>{notif.relativeTime || ''}</Text>
    </View>
  );
}
const nac = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 0.5 },
  iconWrap:{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 12, fontWeight: '600' },
  sub:     { fontSize: 11, marginTop: 1 },
  time:    { fontSize: 10 },
});

// ── FilterSheet ───────────────────────────────────────────────────────────────

function FilterSheet({ visible, activeFilters, onToggle, onClear, onClose, colors, isDark }) {
  const sheetBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const txt     = isDark ? '#F0EEFF' : '#16163A';
  const sub     = isDark ? 'rgba(240,238,255,0.45)' : '#6B7280';
  const chipBdr = isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHdr}>
            <Text style={[styles.sheetTitle, { color: txt }]}>Filter Events</Text>
            {activeFilters.length > 0 && (
              <TouchableOpacity onPress={onClear}><Text style={styles.clearTxt}>Clear All</Text></TouchableOpacity>
            )}
          </View>
          <Text style={[styles.sheetSubLabel, { color: sub }]}>CATEGORY — select multiple</Text>
          <View style={styles.chipsWrap}>
            {FILTER_OPTIONS.map(f => {
              const on = activeFilters.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterChip, { borderColor: on ? f.color : chipBdr, backgroundColor: on ? f.color + '18' : 'transparent' }]}
                  onPress={() => onToggle(f.id)} activeOpacity={0.75}
                >
                  <Ionicons name={f.icon} size={13} color={on ? f.color : sub} />
                  <Text style={[styles.filterChipTxt, { color: on ? f.color : sub, fontWeight: on ? '700' : '500' }]}>{f.label}</Text>
                  {on && <Ionicons name="checkmark-circle" size={13} color={f.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneTxt}>{activeFilters.length > 0 ? `Apply (${activeFilters.length} active)` : 'Done'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── EventActionSheet ──────────────────────────────────────────────────────────
function EventActionSheet({ event, onClose, onEdit, onComplete, onDelete, isDark }) {
  if (!event) return null;
  const sheetBg = isDark ? '#1C1630' : '#FFFFFF';
  const txt     = isDark ? '#F0EEFF' : '#16163A';
  const sub     = isDark ? 'rgba(240,238,255,0.5)' : '#6B7280';
  const divClr  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <Modal visible={!!event} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg, gap: 0 }]}>
          <View style={styles.sheetHandle} />

          {/* Event preview */}
          <View style={[styles.evPreview, { borderBottomColor: divClr }]}>
            <View style={[styles.evPreviewIcon, { backgroundColor: event.color + '22' }]}>
              <Ionicons name={event.icon} size={20} color={event.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 15, fontWeight: '700', color: txt }]} numberOfLines={1}>{event.title}</Text>
              <Text style={[{ fontSize: 12, color: sub, marginTop: 2 }]}>{event.time}{event.end ? ` – ${event.end}` : ''}</Text>
              {event.sub ? <Text style={[{ fontSize: 11, color: sub, marginTop: 1 }]} numberOfLines={1}>{event.sub}</Text> : null}
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={[styles.actionRow, { borderBottomColor: divClr }]} onPress={onEdit} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F618' }]}>
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.actionTxt, { color: txt }]}>Edit Event</Text>
            <Ionicons name="chevron-forward" size={15} color={sub} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomColor: divClr }]} onPress={onComplete} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF8218' }]}>
              <Ionicons name={event.completed ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={18} color="#4CAF82" />
            </View>
            <Text style={[styles.actionTxt, { color: txt }]}>{event.completed ? 'Mark Incomplete' : 'Mark Complete'}</Text>
            <Ionicons name="chevron-forward" size={15} color={sub} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomColor: divClr }]} onPress={onDelete} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: '#EF444418' }]}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.actionTxt, { color: '#EF4444' }]}>Delete Event</Text>
            <Ionicons name="chevron-forward" size={15} color={sub} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={onClose} activeOpacity={0.7}>
            <Text style={[styles.actionTxt, { color: sub, textAlign: 'center', flex: 1 }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const scrollRef = useRef(null);
  const { events, loading, fetchEvents, updateEvent, deleteEvent, setEditingEvent } = useCalendarStore();
  const { notifications, fetchNotifications } = useNotificationsStore();

  const [year,          setYear]          = useState(TODAY_YEAR);
  const [month,         setMonth]         = useState(TODAY_MONTH);
  const [sel,           setSel]           = useState(TODAY_DATE);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilter,    setShowFilter]    = useState(false);
  const [actionEvent,   setActionEvent]   = useState(null);
  const [activeTab,     setActiveTab]     = useState('active');

  const handleEdit = () => {
    setActionEvent(null);
    setEditingEvent(actionEvent);
    router.push('/(app)/calendar/add-event');
  };

  const handleComplete = async () => {
    setActionEvent(null);
    try { await updateEvent(actionEvent.id, { completed: !actionEvent.completed }); } catch {}
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Remove "${actionEvent?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            const id = actionEvent.id;
            setActionEvent(null);
            try { await deleteEvent(id); } catch {}
          }
        },
      ],
    );
  };

  // Cycling button
  const [cycleIdx, setCycleIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setCycleIdx(i => (i + 1) % CYCLE_TEXTS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      });
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Fetch events when month/year changes
  useEffect(() => {
    fetchEvents(month, year);
  }, [month, year]);

  useFocusEffect(useCallback(() => {
    fetchEvents(month, year);
    fetchNotifications();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [month, year]));

  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const hdrBg    = isDark ? '#111118' : '#F8F8FF';

  // Filter logic
  const filtered    = activeFilters.length === 0 ? events : events.filter(e => activeFilters.includes(e.category));
  const datedEvents = filtered.filter(e => e.date != null);
  const floatEvents = filtered.filter(e => e.date == null && !e.completed);

  const hasEvents = (y, m, d) => datedEvents.some(e => e.year === y && e.month === m && e.date === d);
  const eventsFor = (y, m, d) => datedEvents.filter(e => e.year === y && e.month === m && e.date === d);

  // Calendar grid → grouped into week rows
  const totalDays = daysInMonth(year, month);
  const offset    = dayOffset(year, month);
  const cells     = Array.from({ length: offset + totalDays }, (_, i) => i < offset ? null : i - offset + 1);
  const padded    = [...cells];
  while (padded.length % 7 !== 0) padded.push(null);
  const weekRows  = [];
  for (let i = 0; i < padded.length; i += 7) weekRows.push(padded.slice(i, i + 7));

  const isCurrentWeekRow = (row) =>
    month === TODAY_MONTH && year === TODAY_YEAR && row.some(d => d === TODAY_DATE);

  // Active selected day events (exclude completed)
  const selEvents       = eventsFor(year, month, sel).filter(e => !e.completed);
  const selCompletedEvs = eventsFor(year, month, sel).filter(e => e.completed);

  // Upcoming — next 7 days (active only, exclude selected day)
  const todayMs = new Date(TODAY_YEAR, TODAY_MONTH, TODAY_DATE).getTime();
  const upcomingRaw = datedEvents.filter(e => {
    if (e.completed) return false;
    const evMs = new Date(e.year, e.month, e.date).getTime();
    const diff = (evMs - todayMs) / 86400000;
    return diff >= 0 && diff <= 7;
  });
  const upcomingGroups = [];
  upcomingRaw.forEach(ev => {
    const key = `${ev.year}-${ev.month}-${ev.date}`;
    let g = upcomingGroups.find(x => x.key === key);
    if (!g) {
      g = { key, date: ev.date, month: ev.month, year: ev.year, dayName: DAY_NAMES[dayOfWeek(ev.year, ev.month, ev.date)], events: [] };
      upcomingGroups.push(g);
    }
    g.events.push(ev);
  });

  // Completed events — all completed across fetched month, newest first
  const completedEvents = events
    .filter(e => e.completed)
    .sort((a, b) => new Date(b.year, b.month, b.date) - new Date(a.year, a.month, a.date));

  // Read notifications for completed tab (last 7 days)
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentNotifs = notifications
    .filter(n => n.read && new Date(n.createdAt || 0).getTime() >= sevenDaysAgoMs)
    .slice(0, 20);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); setSel(1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); setSel(1); };

  const isToday = d => d === TODAY_DATE && month === TODAY_MONTH && year === TODAY_YEAR;
  const toggleFilter = id => setActiveFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  return (
    <View style={{ flex: 1 }}>

      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: hdrBg, borderBottomColor: divColor }]}>
        <TouchableOpacity style={styles.hdrBtn} onPress={() => router.push('/(app)/overview')}>
          <Ionicons name="home-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.hdrTitle, { color: colors.textPrimary }]}>Calendar</Text>
        <TouchableOpacity style={styles.hdrBtn} onPress={() => setShowFilter(true)}>
          <Ionicons name="options-outline" size={20} color={activeFilters.length > 0 ? colors.primary : colors.textSecondary} />
          {activeFilters.length > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeTxt}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
            {activeFilters.map(id => {
              const f = FILTER_OPTIONS.find(x => x.id === id);
              return (
                <TouchableOpacity key={id} style={[styles.activeChip, { backgroundColor: f.color + '18', borderColor: f.color }]} onPress={() => toggleFilter(id)}>
                  <Ionicons name={f.icon} size={11} color={f.color} />
                  <Text style={[styles.activeChipTxt, { color: f.color }]}>{f.label}</Text>
                  <Ionicons name="close" size={10} color={f.color} />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.activeChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#E5E7EB' }]}
              onPress={() => setActiveFilters([])}
            >
              <Text style={[styles.activeChipTxt, { color: colors.textSecondary }]}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── Month grid ── */}
        <GlassCard style={styles.calCard}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F8' }]}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthTxt, { color: colors.textPrimary }]}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F8' }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {DAY_LETTERS.map((l, i) => <Text key={i} style={[styles.dayHdrTxt, { color: colors.textSecondary }]}>{l}</Text>)}
          </View>

          {/* Week rows with current week highlight */}
          {weekRows.map((row, ri) => {
            const highlight = isCurrentWeekRow(row);
            return (
              <View
                key={ri}
                style={[
                  styles.weekRow,
                  highlight && { backgroundColor: colors.primary + '0E', borderRadius: 12 },
                ]}
              >
                {row.map((day, ci) => {
                  if (!day) return <View key={`e-${ci}`} style={styles.dateCell} />;
                  const selected = day === sel;
                  const today    = isToday(day);
                  const hasDot   = hasEvents(year, month, day);
                  return (
                    <TouchableOpacity key={day} style={styles.dateCell} onPress={() => setSel(day)} activeOpacity={0.7}>
                      <View style={[
                        styles.dateBubble,
                        selected && { backgroundColor: colors.primary },
                        today && !selected && { borderWidth: 2, borderColor: colors.primary },
                      ]}>
                        <Text style={[
                          styles.dateTxt,
                          { color: selected ? '#fff' : today ? colors.primary : colors.textPrimary },
                          selected && { fontWeight: '800' },
                        ]}>{day}</Text>
                      </View>
                      {hasDot && !selected && <View style={[styles.eventDot, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </GlassCard>

        {/* ── Cycling add button ── */}
        <TouchableOpacity
          style={[styles.cycleBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(app)/calendar/add-event')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Animated.Text style={[styles.cycleBtnTxt, { opacity: fadeAnim }]}>
            {CYCLE_TEXTS[cycleIdx]}
          </Animated.Text>
        </TouchableOpacity>

        {/* ── Tab Switcher ── */}
        <TabSwitcher
          active={activeTab}
          onChange={setActiveTab}
          completedCount={completedEvents.length + recentNotifs.length}
          isDark={isDark}
          colors={colors}
        />

        {/* ══ ACTIVE TAB ══ */}
        {activeTab === 'active' && (
          <>
            {/* Selected day header */}
            <View style={styles.dayHdrRow}>
              <Text style={[styles.tabSecLabel, { color: colors.textSecondary }]}>
                {isToday(sel) ? 'Today' : `${DAY_NAMES[dayOfWeek(year, month, sel)]}, ${MONTHS[month].slice(0,3)} ${sel}`}
              </Text>
              <TouchableOpacity
                style={styles.addPlain}
                onPress={() => router.push('/(app)/calendar/add-event')}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addPlainTxt, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : selEvents.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '14' }]}>
                  <Ionicons name="calendar-outline" size={26} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No active events on this day</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/calendar/add-event')}>
                  <Text style={[styles.emptyHint, { color: colors.primary }]}>+ Add event or reminder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selEvents.map(ev => <EventCard key={ev.id} ev={ev} colors={colors} onPress={() => setActionEvent(ev)} />)
            )}

            {/* ── Upcoming next 7 days ── */}
            {upcomingGroups.length > 0 && (
              <>
                <Text style={[styles.tabSecLabel, { color: colors.textSecondary }]}>Upcoming · Next 7 Days</Text>
                <View style={styles.timelineWrap}>
                  {upcomingGroups.map((group, gi) => (
                    <View key={group.key} style={styles.timelineGroup}>
                      {/* Vertical line connector */}
                      <View style={styles.timelineCol}>
                        <View style={[styles.timelineDot, { backgroundColor: colors.primary, borderColor: isDark ? '#111118' : '#F2F2F7' }]} />
                        {gi < upcomingGroups.length - 1 && (
                          <View style={[styles.timelineLine, { backgroundColor: colors.primary + '28' }]} />
                        )}
                      </View>
                      {/* Date badge + cards */}
                      <View style={{ flex: 1, gap: 6 }}>
                        <View style={styles.timelineDateRow}>
                          <Text style={[styles.timelineDayNum, { color: colors.primary }]}>{group.date}</Text>
                          <Text style={[styles.timelineDayName, { color: colors.textSecondary }]}>{group.dayName} · {MONTHS[group.month].slice(0,3)}</Text>
                        </View>
                        {group.events.map(ev => (
                          <TouchableOpacity
                            key={ev.id}
                            style={[styles.tlCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }]}
                            activeOpacity={0.8}
                            onPress={() => setActionEvent(ev)}
                          >
                            <View style={[styles.tlAccent, { backgroundColor: ev.color }]} />
                            <View style={[styles.tlIcon, { backgroundColor: ev.color + '20' }]}>
                              <Ionicons name={ev.icon} size={13} color={ev.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.tlTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ev.title}</Text>
                              {ev.sub ? <Text style={[styles.tlSub, { color: colors.textSecondary }]} numberOfLines={1}>{ev.sub}</Text> : null}
                            </View>
                            {ev.time ? (
                              <View style={[styles.tlTimePill, { backgroundColor: ev.color + '18' }]}>
                                <Text style={[styles.tlTime, { color: ev.color }]}>{ev.time}</Text>
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Floating Reminders ── */}
            {floatEvents.length > 0 && (
              <>
                <Text style={[styles.tabSecLabel, { color: colors.textSecondary }]}>Reminders</Text>
                {floatEvents.map(ev => <EventCard key={ev.id} ev={ev} colors={colors} onPress={() => setActionEvent(ev)} />)}
              </>
            )}
          </>
        )}

        {/* ══ COMPLETED TAB ══ */}
        {activeTab === 'completed' && (
          <>
            {/* Completed Events */}
            <Text style={[styles.tabSecLabel, { color: colors.textSecondary }]}>Completed</Text>

            {completedEvents.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: '#4CAF8214' }]}>
                  <Ionicons name="checkmark-circle-outline" size={26} color="#4CAF82" />
                </View>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>No completed events yet</Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Mark events as done to see them here</Text>
              </View>
            ) : (
              completedEvents.map(ev => (
                <CompletedEventCard
                  key={ev.id}
                  ev={ev}
                  colors={colors}
                  isDark={isDark}
                  onPress={() => setActionEvent(ev)}
                />
              ))
            )}

            {/* Recent Notifications */}
            {recentNotifs.length > 0 && (
              <>
                <View style={{ height: 6 }} />
                <Text style={[styles.tabSecLabel, { color: colors.textSecondary }]}>Recent Activity · 7 Days</Text>
                {recentNotifs.map(n => (
                  <NotifActivityCard key={n.id} notif={n} isDark={isDark} />
                ))}
              </>
            )}

            {completedEvents.length === 0 && recentNotifs.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>Activity from the last 7 days will appear here</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <FilterSheet
        visible={showFilter}
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        onClear={() => setActiveFilters([])}
        onClose={() => setShowFilter(false)}
        colors={colors}
        isDark={isDark}
      />

      <EventActionSheet
        event={actionEvent}
        isDark={isDark}
        onClose={() => setActionEvent(null)}
        onEdit={handleEdit}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 2, borderBottomWidth: 0.5 },
  hdrBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hdrTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  filterBadge: { position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  filterBadgeTxt: { color: '#fff', fontSize: 8, fontWeight: '800' },

  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 24, gap: 12 },

  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  activeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  activeChipTxt: { fontSize: 11, fontWeight: '600' },

  // Calendar
  calCard: { padding: 14 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  monthTxt: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  dayHeaders: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  dayHdrTxt: { width: 32, textAlign: 'center', fontSize: 11, fontWeight: '600' },

  // Week rows
  weekRow: { flexDirection: 'row', marginVertical: 1 },
  dateCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dateBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateTxt: { fontSize: 13, fontWeight: '600' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  // Cycling button
  cycleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  cycleBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Event card
  evCard: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingLeft: 16, gap: 10, overflow: 'hidden' },
  evAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  evIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  evTitle: { fontSize: 13, fontWeight: '600' },
  evSub: { fontSize: 11, marginTop: 1 },
  evTime: { fontSize: 12, fontWeight: '700' },
  evEnd: { fontSize: 10, marginTop: 1 },

  // (empty state now uses emptyBox/emptyIconWrap below)

  // Upcoming
  upcomingGroup: { flexDirection: 'row', gap: 10 },
  dateBadgeCol: { alignItems: 'center' },
  dateBadge: { width: 46, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 1 },
  dateBadgeNum: { fontSize: 16, fontWeight: '900' },
  dateBadgeDay: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateBadgeLine: { width: 2, flex: 1, borderRadius: 1, minHeight: 8 },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  upcomingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  upcomingTitle: { fontSize: 12, fontWeight: '600' },
  upcomingSub: { fontSize: 10, marginTop: 1 },
  upcomingTime: { fontSize: 11, fontWeight: '700' },

  // Reminders
  reminderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  reminderBadgeTxt: { fontSize: 11, fontWeight: '700' },

  // Filter sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 6 },
  sheetHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '800' },
  clearTxt: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  sheetSubLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5 },
  filterChipTxt: { fontSize: 13 },
  doneBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  doneTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Event action sheet
  evPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, marginBottom: 4 },
  evPreviewIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 0.5 },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Day header row
  dayHdrRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  tabSecLabel:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.2, marginTop: 4 },
  addPlain:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  addPlainTxt:   { fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyBox:     { borderRadius: 16, padding: 28, alignItems: 'center', gap: 8 },
  emptyIconWrap:{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt:     { fontSize: 13, fontWeight: '600' },
  emptyHint:    { fontSize: 12, fontWeight: '500' },

  // Timeline (upcoming)
  timelineWrap:   { gap: 0, paddingLeft: 2 },
  timelineGroup:  { flexDirection: 'row', gap: 12, paddingBottom: 12 },
  timelineCol:    { width: 20, alignItems: 'center', paddingTop: 6 },
  timelineDot:    { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  timelineLine:   { width: 2, flex: 1, borderRadius: 1, marginTop: 4, minHeight: 20 },
  timelineDateRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 4 },
  timelineDayNum: { fontSize: 18, fontWeight: '900' },
  timelineDayName:{ fontSize: 11, fontWeight: '600' },
  tlCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  tlAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  tlIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  tlTitle:  { fontSize: 13, fontWeight: '600' },
  tlSub:    { fontSize: 10, marginTop: 1 },
  tlTimePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  tlTime:   { fontSize: 11, fontWeight: '700' },
});
