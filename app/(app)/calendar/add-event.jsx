import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Animated,
  KeyboardAvoidingView, Platform, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useCalendarStore } from '../../../src/stores/useCalendarStore';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';
import { useAuthStore } from '../../../src/stores/useAuthStore';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LETTERS  = ['S','M','T','W','T','F','S'];

const _now        = new Date();
const TODAY_YEAR  = _now.getFullYear();
const TODAY_MONTH = _now.getMonth();
const TODAY_DATE  = _now.getDate();

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function dayOffset(y, m)   { return new Date(y, m, 1).getDay(); }

const CATEGORIES = [
  { id: 'reminder', label: 'Reminder', icon: 'alarm',       color: '#EF4444' },
  { id: 'school',   label: 'School',   icon: 'school',      color: '#6C63FF' },
  { id: 'health',   label: 'Health',   icon: 'medkit',      color: '#4CAF82' },
  { id: 'family',   label: 'Family',   icon: 'people',      color: '#FF6B9D' },
  { id: 'shopping', label: 'Shopping', icon: 'cart',        color: '#FFB347' },
  { id: 'home',     label: 'Home',     icon: 'home',        color: '#9C27B0' },
  { id: 'fitness',  label: 'Fitness',  icon: 'barbell',     color: '#F59E0B' },
  { id: 'work',     label: 'Work',     icon: 'briefcase',   color: '#3B82F6' },
];

const ALL_ICONS = [
  { name: 'alarm',         label: 'Alarm'   },
  { name: 'calendar',      label: 'General' },
  { name: 'school',        label: 'School'  },
  { name: 'medkit',        label: 'Health'  },
  { name: 'cart',          label: 'Shop'    },
  { name: 'restaurant',    label: 'Food'    },
  { name: 'people',        label: 'Family'  },
  { name: 'barbell',       label: 'Fitness' },
  { name: 'home',          label: 'Home'    },
  { name: 'briefcase',     label: 'Work'    },
  { name: 'musical-notes', label: 'Music'   },
  { name: 'car',           label: 'Drive'   },
  { name: 'book',          label: 'Study'   },
  { name: 'star',          label: 'Star'    },
  { name: 'gift',          label: 'Gift'    },
  { name: 'airplane',      label: 'Travel'  },
  { name: 'heart',         label: 'Love'    },
  { name: 'football',      label: 'Sport'   },
  { name: 'camera',        label: 'Photo'   },
  { name: 'leaf',          label: 'Nature'  },
];

const REMINDER_CHIPS = [
  { label: 'None',    minutes: 0     },
  { label: '5 min',   minutes: 5     },
  { label: '15 min',  minutes: 15    },
  { label: '30 min',  minutes: 30    },
  { label: '1 hour',  minutes: 60    },
  { label: '2 hours', minutes: 120   },
  { label: '1 day',   minutes: 1440  },
  { label: '1 week',  minutes: 10080 },
];

const HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ITEM_H  = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTimeStr(s) {
  if (!s) return { h: '10', m: '00', ampm: 'AM' };
  const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return { h: '10', m: '00', ampm: 'AM' };
  return { h: m[1], m: m[2].padStart(2, '0'), ampm: m[3].toUpperCase() };
}

// ── Drum Wheel ────────────────────────────────────────────────────────────────
function DrumWheel({ data, value, onChange, width = 80, primary }) {
  const ref   = useRef(null);
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    const idx = data.indexOf(String(value));
    if (idx >= 0) {
      const t = setTimeout(() => ref.current?.scrollTo({ y: idx * ITEM_H, animated: false }), 100);
      return () => clearTimeout(t);
    }
  }, []);

  const snap = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const c   = Math.max(0, Math.min(idx, data.length - 1));
    setLocal(data[c]);
    onChange(data[c]);
  }, [data, onChange]);

  const tap = useCallback((item, i) => {
    setLocal(item);
    onChange(item);
    ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
  }, [onChange]);

  return (
    <View style={{ width, height: ITEM_H * 3, overflow: 'hidden' }}>
      <View pointerEvents="none" style={[dw.ring, { borderColor: primary + '55', backgroundColor: primary + '0C' }]} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate={0.94}
        bounces={false}
        onMomentumScrollEnd={snap}
        onScrollEndDrag={snap}
        scrollEventThrottle={16}
      >
        <View style={{ height: ITEM_H }} />
        {data.map((item, i) => {
          const on = item === local;
          return (
            <TouchableOpacity key={i} activeOpacity={0.7}
              onPress={() => tap(item, i)}
              style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: on ? 28 : 17, fontWeight: on ? '900' : '300', color: on ? primary : '#9CA3AF', opacity: on ? 1 : 0.5 }}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: ITEM_H }} />
      </ScrollView>
    </View>
  );
}
const dw = StyleSheet.create({
  ring: { position: 'absolute', top: ITEM_H, left: 4, right: 4, height: ITEM_H, borderRadius: 14, borderWidth: 1.5, zIndex: 2 },
});

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ year, month, selDate, onSelect, onPrev, onNext, primary, isDark }) {
  const totalDays = daysInMonth(year, month);
  const offset    = dayOffset(year, month);
  const cells     = Array.from({ length: offset + totalDays }, (_, i) => i < offset ? null : i - offset + 1);
  const padded    = [...cells];
  while (padded.length % 7 !== 0) padded.push(null);
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  const isToday = d => d === TODAY_DATE && month === TODAY_MONTH && year === TODAY_YEAR;
  const isSel   = d => d === selDate?.date && month === selDate?.month && year === selDate?.year;
  const txt     = isDark ? '#F0EEFF' : '#16163A';
  const sub     = isDark ? 'rgba(240,238,255,0.45)' : '#9CA3AF';
  return (
    <View style={{ padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <TouchableOpacity onPress={onPrev} style={[calS.navBtn, { backgroundColor: primary + '18' }]}>
          <Ionicons name="chevron-back" size={15} color={primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, fontWeight: '700', color: txt }}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNext} style={[calS.navBtn, { backgroundColor: primary + '18' }]}>
          <Ionicons name="chevron-forward" size={15} color={primary} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {DAY_LETTERS.map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: sub }}>{l}</Text>)}
      </View>
      {weeks.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 2 }}>
          {row.map((d, ci) => {
            if (!d) return <View key={`e${ci}`} style={{ flex: 1, height: 34 }} />;
            const sel   = isSel(d);
            const today = isToday(d);
            return (
              <TouchableOpacity key={d} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }} onPress={() => onSelect({ year, month, date: d })} activeOpacity={0.7}>
                <View style={[{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
                  sel   && { backgroundColor: primary },
                  today && !sel && { borderWidth: 2, borderColor: primary },
                ]}>
                  <Text style={{ fontSize: 13, fontWeight: sel ? '800' : '500', color: sel ? '#fff' : today ? primary : txt }}>{d}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const calS = StyleSheet.create({
  navBtn: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

// ── Icon Picker Modal ─────────────────────────────────────────────────────────
function IconPickerModal({ visible, selected, onSelect, onClose, primary, isDark }) {
  const bg  = isDark ? '#1A1A2E' : '#FFFFFF';
  const sub = isDark ? 'rgba(240,238,255,0.45)' : '#6B7280';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
        <View style={[ip.sheet, { backgroundColor: bg }]}>
          <View style={ip.handle} />
          <Text style={[ip.title, { color: isDark ? '#F0EEFF' : '#16163A' }]}>Choose Icon</Text>
          <View style={ip.grid}>
            {ALL_ICONS.map(ic => {
              const on = selected === ic.name;
              return (
                <TouchableOpacity
                  key={ic.name}
                  style={[ip.iconBtn, {
                    backgroundColor: on ? primary : (isDark ? primary + '14' : primary + '0E'),
                    borderColor: on ? primary : 'transparent',
                  }]}
                  onPress={() => { onSelect(ic.name); onClose(); }}
                  activeOpacity={0.75}
                >
                  <Ionicons name={ic.name} size={22} color={on ? '#fff' : primary} />
                  <Text style={[ip.iconLbl, { color: on ? '#fff' : sub }]}>{ic.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
const ip = StyleSheet.create({
  sheet:   { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 36 },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 14 },
  title:   { fontSize: 17, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  iconBtn: { width: 72, alignItems: 'center', gap: 5, padding: 10, borderRadius: 14, borderWidth: 2 },
  iconLbl: { fontSize: 10, fontWeight: '600' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AddEventScreen() {
  const { colors, isDark } = useTheme();
  const { createEvent, updateEvent, editingEvent, clearEditingEvent } = useCalendarStore();
  const { members } = useFamilyStore();
  const { user } = useAuthStore();
  const isEdit = !!editingEvent;
  const { prefillTitle = '', prefillCategory = 'reminder' } = useLocalSearchParams();

  const pt = editingEvent ? parseTimeStr(editingEvent.time) : null;

  // ── State ─────────────────────────────────────────────────────────────────
  const [title,    setTitle]    = useState(isEdit ? editingEvent.title       : (prefillTitle || ''));
  const [notes,    setNotes]    = useState(isEdit ? editingEvent.description : '');
  const [location, setLocation] = useState(isEdit ? editingEvent.location   : '');
  const [category, setCategory] = useState(isEdit ? editingEvent.category   : (prefillCategory || 'reminder'));
  const [selIcon,  setSelIcon]  = useState(isEdit ? editingEvent.icon       : (CATEGORIES.find(c => c.id === (prefillCategory || 'reminder'))?.icon || 'alarm'));
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [calYear,  setCalYear]  = useState(isEdit ? editingEvent.year  : TODAY_YEAR);
  const [calMonth, setCalMonth] = useState(isEdit ? editingEvent.month : TODAY_MONTH);
  const [selDate,  setSelDate]  = useState(
    isEdit
      ? { year: editingEvent.year, month: editingEvent.month, date: editingEvent.date }
      : { year: TODAY_YEAR, month: TODAY_MONTH, date: TODAY_DATE }
  );
  const [showCal, setShowCal] = useState(false);

  const [hasTime, setHasTime] = useState(true);
  const [timeH,   setTimeH]   = useState(isEdit && pt ? pt.h    : '10');
  const [timeM,   setTimeM]   = useState(isEdit && pt ? pt.m    : '00');
  const [ampm,    setAmpm]    = useState(isEdit && pt ? pt.ampm : 'AM');

  const [reminderMinutes, setReminderMinutes] = useState(isEdit ? (editingEvent.reminderMinutes ?? 0) : 0);
  const [phoneNumber, setPhoneNumber] = useState(isEdit ? (editingEvent.phoneNumber || '') : '');
  const [attendees, setAttendees] = useState(
    isEdit ? (editingEvent.attendees?.map(a => String(a)) || []) : []
  );
  const [saving, setSaving] = useState(false);
  const canSave = title.trim().length > 0;

  // Auto-pick icon when category changes
  useEffect(() => {
    if (!isEdit) {
      const cat = CATEGORIES.find(c => c.id === category);
      if (cat) setSelIcon(cat.icon);
    }
  }, [category]);

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }).start();
  }, []);

  useEffect(() => () => clearEditingEvent(), []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const primary  = colors.primary;   // always indigo #6C63FF
  const pageBg   = isDark ? '#0A0A14' : '#F2F1FA';
  const cardBg   = isDark ? '#13131E' : '#FFFFFF';
  const input    = isDark ? '#F0EEFF' : '#16163A';
  const subClr   = isDark ? 'rgba(240,238,255,0.4)' : '#9CA3AF';
  const divClr   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(108,99,255,0.1)';

  const catData  = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };
  const formatDate = () => `${MONTHS_SHORT[selDate.month]} ${selDate.date}, ${selDate.year}`;
  const formatTime = () => hasTime ? `${timeH}:${timeM} ${ampm}` : '—';

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      let h = parseInt(timeH, 10) || 0;
      if (hasTime) {
        if (ampm === 'PM' && h !== 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
      }
      const startDate = new Date(selDate.year, selDate.month, selDate.date, hasTime ? h : 0, hasTime ? parseInt(timeM, 10) : 0);
      const dto = {
        title:           title.trim(),
        description:     notes.trim()       || undefined,
        location:        location.trim()    || undefined,
        phoneNumber:     phoneNumber.trim() || undefined,
        startTime:       startDate.toISOString(),
        category,
        icon:            selIcon,
        color:           catData.color,
        reminderMinutes,
        attendees:       attendees.length > 0 ? attendees : undefined,
      };
      if (isEdit) await updateEvent(editingEvent.id, dto);
      else        await createEvent(dto);
      router.back();
    } catch { router.back(); }
    finally { setSaving(false); }
  };

  const slideStyle = {
    opacity:   enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }],
  };

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>

      {/* ── Always-indigo gradient header ── */}
      <LinearGradient
        colors={isDark
          ? [primary + 'CC', primary + '55', pageBg]
          : [primary + 'EE', primary + '66', pageBg]
        }
        style={S.gradHdr}
        start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={S.hdrRow}>
          <TouchableOpacity style={S.hdrBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={S.hdrTitle}>{isEdit ? 'Edit Event' : 'New Event'}</Text>
          <TouchableOpacity
            style={[S.saveCircle, { backgroundColor: canSave ? '#fff' : 'rgba(255,255,255,0.25)' }]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving
              ? <ActivityIndicator color={primary} size="small" style={{ transform: [{ scale: 0.75 }] }} />
              : <Ionicons name="checkmark" size={19} color={canSave ? primary : 'rgba(255,255,255,0.5)'} />
            }
          </TouchableOpacity>
        </SafeAreaView>

        {/* Live preview card */}
        <Animated.View style={[S.previewCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)' }, slideStyle]}>
          <View style={[S.previewAccent, { backgroundColor: primary }]} />
          <TouchableOpacity
            style={[S.previewIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : primary + '18' }]}
            onPress={() => setShowIconPicker(true)}
            activeOpacity={0.75}
          >
            <Ionicons name={selIcon} size={22} color={isDark ? '#fff' : primary} />
            <View style={[S.editDot, { backgroundColor: primary }]}>
              <Ionicons name="pencil" size={7} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[S.previewTitle, { color: isDark ? '#fff' : '#16163A' }]} numberOfLines={1}>
              {title.trim() || 'Event title…'}
            </Text>
            <Text style={[S.previewSub, { color: isDark ? 'rgba(255,255,255,0.6)' : '#6B7280' }]}>
              {formatDate()}{hasTime ? `  ·  ${formatTime()}` : ''}
            </Text>
          </View>
          {/* Small category color dot — only indicator of category color */}
          <View style={[S.catDot, { backgroundColor: catData.color }]} />
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <Animated.View style={[{ gap: 12, paddingHorizontal: 14, paddingTop: 14 }, slideStyle]}>

            {/* ── Title & Notes ── */}
            <View style={[S.card, { backgroundColor: cardBg }]}>
              <TextInput
                style={[S.titleInput, { color: input, borderBottomColor: divClr }]}
                placeholder="Event title"
                placeholderTextColor={subClr}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                autoFocus={!isEdit}
              />
              <TextInput
                style={[S.notesInput, { color: input }]}
                placeholder="Notes or description…"
                placeholderTextColor={subClr}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* ── Category ── */}
            <View>
              <Text style={[S.secLabel, { color: primary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.map(c => {
                  const on = category === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[S.catChip, {
                        backgroundColor: on ? primary          : cardBg,
                        borderColor:     on ? primary          : divClr,
                        shadowColor:     on ? primary          : 'transparent',
                        shadowOpacity: on ? 0.3 : 0, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: on ? 5 : 0,
                      }]}
                      onPress={() => setCategory(c.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[S.catIcon, { backgroundColor: on ? 'rgba(255,255,255,0.22)' : c.color + '1E' }]}>
                        <Ionicons name={c.icon} size={14} color={on ? '#fff' : c.color} />
                      </View>
                      <Text style={[S.catTxt, { color: on ? '#fff' : (isDark ? '#C0C0D8' : '#374151'), fontWeight: on ? '700' : '500' }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Date ── */}
            <View style={[S.card, { backgroundColor: cardBg }]}>
              <TouchableOpacity style={S.rowLine} onPress={() => setShowCal(v => !v)} activeOpacity={0.75}>
                <View style={[S.rowIcon, { backgroundColor: primary + '18' }]}>
                  <Ionicons name="calendar-outline" size={16} color={primary} />
                </View>
                <Text style={[S.rowLabel, { color: input }]}>Date</Text>
                <Text style={[S.rowVal, { color: primary }]}>{formatDate()}</Text>
                <Ionicons name={showCal ? 'chevron-up' : 'chevron-down'} size={14} color={subClr} />
              </TouchableOpacity>
              {showCal && (
                <View style={{ borderTopWidth: 0.5, borderTopColor: divClr }}>
                  <MiniCalendar
                    year={calYear} month={calMonth} selDate={selDate}
                    onSelect={d => { setSelDate(d); setShowCal(false); }}
                    onPrev={prevMonth} onNext={nextMonth}
                    primary={primary} isDark={isDark}
                  />
                </View>
              )}
            </View>

            {/* ── Time ── */}
            <View style={[S.card, { backgroundColor: cardBg }]}>
              <View style={S.rowLine}>
                <View style={[S.rowIcon, { backgroundColor: primary + '18' }]}>
                  <Ionicons name="time-outline" size={16} color={primary} />
                </View>
                <Text style={[S.rowLabel, { color: input }]}>Time</Text>
                <TouchableOpacity
                  style={[S.toggleTrack, { backgroundColor: hasTime ? primary : (isDark ? 'rgba(255,255,255,0.12)' : '#E2E1EF') }]}
                  onPress={() => setHasTime(v => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[S.toggleThumb, { alignSelf: hasTime ? 'flex-end' : 'flex-start' }]} />
                </TouchableOpacity>
              </View>

              {hasTime && (
                <View style={[S.drumSection, { borderTopColor: divClr }]}>
                  {/* Big current-time display */}
                  <View style={S.timeDisplay}>
                    <Text style={[S.timeBig, { color: primary }]}>{timeH}:{timeM}</Text>
                    <Text style={[S.timeAmpm, { color: subClr }]}>{ampm}</Text>
                  </View>
                  <View style={[S.divider, { backgroundColor: divClr }]} />
                  {/* Drum wheels */}
                  <View style={S.wheelRow}>
                    <DrumWheel data={HOURS}   value={timeH} onChange={setTimeH} width={72} primary={primary} />
                    <Text style={[S.colon, { color: primary }]}>:</Text>
                    <DrumWheel data={MINUTES} value={timeM} onChange={setTimeM} width={72} primary={primary} />
                    <View style={S.ampmCol}>
                      {['AM','PM'].map(v => (
                        <TouchableOpacity
                          key={v}
                          style={[S.ampmBtn, { backgroundColor: ampm === v ? primary : (isDark ? primary + '18' : primary + '12') }]}
                          onPress={() => setAmpm(v)}
                          activeOpacity={0.8}
                        >
                          <Text style={[S.ampmTxt, { color: ampm === v ? '#fff' : primary }]}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ── Remind Me ── */}
            <View>
              <Text style={[S.secLabel, { color: primary }]}>REMIND ME</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {REMINDER_CHIPS.map(chip => {
                  const on = reminderMinutes === chip.minutes;
                  return (
                    <TouchableOpacity
                      key={chip.minutes}
                      style={[S.remChip, {
                        backgroundColor: on ? primary : cardBg,
                        borderColor:     on ? primary : divClr,
                        shadowColor: on ? primary : 'transparent',
                        shadowOpacity: on ? 0.3 : 0, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6, elevation: on ? 4 : 0,
                      }]}
                      onPress={() => setReminderMinutes(chip.minutes)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="notifications-outline" size={12} color={on ? '#fff' : subClr} />
                      <Text style={[S.remTxt, { color: on ? '#fff' : (isDark ? '#C0C0D8' : '#374151'), fontWeight: on ? '700' : '400' }]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Location ── */}
            <View style={[S.card, { backgroundColor: cardBg }]}>
              <View style={S.rowLine}>
                <View style={[S.rowIcon, { backgroundColor: primary + '18' }]}>
                  <Ionicons name="location-outline" size={16} color={primary} />
                </View>
                <TextInput
                  style={[S.inlineInput, { color: input }]}
                  placeholder="Add location"
                  placeholderTextColor={subClr}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* ── Phone Number ── */}
            <View style={[S.card, { backgroundColor: cardBg }]}>
              <View style={S.rowLine}>
                <View style={[S.rowIcon, { backgroundColor: '#3B82F618' }]}>
                  <Ionicons name="call-outline" size={16} color="#3B82F6" />
                </View>
                <TextInput
                  style={[S.inlineInput, { color: input }]}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={subClr}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* ── Attendees ── */}
            {members.length > 0 && (
              <View>
                <Text style={[S.secLabel, { color: primary }]}>ATTENDEES</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {members.map(m => {
                    const isSelf = m.id === user?._id || m.id === user?.id;
                    const on = attendees.includes(String(m.id));
                    const toggleAttendee = () => {
                      setAttendees(prev =>
                        on ? prev.filter(id => id !== String(m.id)) : [...prev, String(m.id)]
                      );
                    };
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[S.attendeeChip, {
                          backgroundColor: on ? m.color || primary : cardBg,
                          borderColor:     on ? m.color || primary : divClr,
                        }]}
                        onPress={toggleAttendee}
                        activeOpacity={0.75}
                      >
                        <View style={[S.attendeeAvatar, { backgroundColor: on ? 'rgba(255,255,255,0.25)' : (m.color || primary) + '22' }]}>
                          <Text style={[S.attendeeInitial, { color: on ? '#fff' : (m.color || primary) }]}>
                            {(m.name || '?')[0].toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[S.attendeeName, { color: on ? '#fff' : (isDark ? '#C0C0D8' : '#374151'), fontWeight: on ? '700' : '500' }]}>
                          {isSelf ? 'Me' : m.name.split(' ')[0]}
                        </Text>
                        {on && <Ionicons name="checkmark" size={12} color="#fff" style={{ marginLeft: 2 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

          </Animated.View>
        </ScrollView>

        {/* ── Sticky Save ── */}
        <SafeAreaView edges={['bottom']} style={[S.bottomBar, { backgroundColor: pageBg, borderTopColor: divClr }]}>
          <TouchableOpacity
            style={[S.saveBtn, {
              backgroundColor: canSave && !saving ? primary : (isDark ? '#1C1C2E' : '#E0DFEF'),
              shadowColor: primary,
              shadowOpacity: canSave ? 0.4 : 0,
              shadowOffset: { width: 0, height: 6 }, shadowRadius: 16, elevation: canSave ? 10 : 0,
            }]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={isEdit ? 'checkmark-done' : 'add-circle-outline'} size={20} color={canSave ? '#fff' : subClr} />
                <Text style={[S.saveTxt, { color: canSave && !saving ? '#fff' : subClr }]}>
                  {isEdit
                    ? 'Update Event'
                    : canSave
                      ? `Save  ·  ${catData.label}`
                      : 'Add a title to continue'
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <IconPickerModal
        visible={showIconPicker}
        selected={selIcon}
        onSelect={setSelIcon}
        onClose={() => setShowIconPicker(false)}
        primary={primary}
        isDark={isDark}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Gradient header
  gradHdr:    { paddingBottom: 22, paddingHorizontal: 16 },
  hdrRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 18 },
  hdrBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  hdrTitle:   { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  saveCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Preview card
  previewCard:     { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, gap: 12, overflow: 'hidden' },
  previewAccent:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 2 },
  previewIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative', marginLeft: 6 },
  editDot:         { position: 'absolute', bottom: -3, right: -3, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },
  previewTitle:    { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  previewSub:      { fontSize: 12, marginTop: 2 },
  catDot:          { width: 10, height: 10, borderRadius: 5 },

  // Section label
  secLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8 },

  // Card
  card: { borderRadius: 16, overflow: 'hidden', shadowColor: '#6C63FF', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 2 },

  // Inputs
  titleInput:  { fontSize: 18, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 0.5 },
  notesInput:  { fontSize: 13, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, minHeight: 48 },
  inlineInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Row
  rowLine:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  rowVal:   { fontSize: 13, fontWeight: '700', marginRight: 4 },

  // Toggle switch
  toggleTrack: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },

  // Category chips
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 13, borderWidth: 1.5 },
  catIcon: { width: 24, height: 24, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catTxt:  { fontSize: 13 },

  // Drum
  drumSection: { borderTopWidth: 0.5, paddingTop: 10, paddingBottom: 12 },
  timeDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, paddingBottom: 8 },
  timeBig:     { fontSize: 46, fontWeight: '900', letterSpacing: -3 },
  timeAmpm:    { fontSize: 18, fontWeight: '600' },
  divider:     { height: 0.5, marginHorizontal: 24, marginBottom: 8 },
  wheelRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0 },
  colon:       { fontSize: 30, fontWeight: '900', marginHorizontal: 4, marginBottom: 4 },
  ampmCol:     { gap: 8, marginLeft: 14 },
  ampmBtn:     { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 11 },
  ampmTxt:     { fontSize: 14, fontWeight: '800' },

  // Reminder chips
  remChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  remTxt:  { fontSize: 12 },

  // Attendee chips
  attendeeChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  attendeeAvatar:  { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  attendeeInitial: { fontSize: 10, fontWeight: '800' },
  attendeeName:    { fontSize: 12 },

  // Save
  bottomBar: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, borderTopWidth: 0.5 },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingVertical: 16, borderRadius: 16 },
  saveTxt:   { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
