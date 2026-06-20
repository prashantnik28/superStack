import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import PulseButton from '../../../src/components/ui/PulseButton';

// ── Data ──────────────────────────────────────────────────────────────────────
const REMINDER_CARDS = [
  { id: '1', text: "Don't forget math homework",   emoji: '📚', time: '2:30 PM',  bg: '#B4A2C2', category: 'school',   repeat: 'Every Weekday'  },
  { id: '2', text: 'Buy snacks before 6 PM',       emoji: '🍪', time: '5:45 PM',  bg: '#98AABD', category: 'shopping', repeat: 'Never'          },
  { id: '3', text: 'Call mom every weekend',        emoji: '💕', time: '8:00 PM',  bg: '#C2AA68', category: 'family',   repeat: 'Every Weekend'  },
  { id: '4', text: 'Water the plants',             emoji: '🌱', time: 'Morning',   bg: '#78ABAA', category: 'home',     repeat: 'Every Day'      },
  { id: '5', text: 'Family movie night',           emoji: '🎬', time: 'Fri 8 PM', bg: '#C4A098', category: 'family',   repeat: 'Every Week'     },
  { id: '6', text: 'Evening walk or gym',          emoji: '🏃', time: '6:30 PM',  bg: '#98B890', category: 'fitness',  repeat: 'Every Day'      },
];

const TRACKING_MEMBERS = [
  { id: '1', name: 'Aarav', color: '#6C63FF', place: 'St. Joseph School', time: '8:40 AM', battery: 78,  status: 'At School'  },
  { id: '2', name: 'Myra',  color: '#FF6B9D', place: 'Dance Studio',      time: '10:15 AM',battery: 92,  status: 'Dance Class' },
  { id: '3', name: 'Rajan', color: '#4CAF82', place: 'Tech Park, Pune',   time: '9:00 AM', battery: 55,  status: 'At Work'    },
];

const EMERGENCY_CONTACTS = [
  { id: '1', name: 'Mom',      icon: 'call',    color: '#4CAF82' },
  { id: '2', name: 'Dad',      icon: 'call',    color: '#6C63FF' },
  { id: '3', name: 'Hospital', icon: 'medical', color: '#EF4444' },
  { id: '4', name: 'Police',   icon: 'shield',  color: '#3B82F6' },
];

// ── Reminder Card ─────────────────────────────────────────────────────────────
function RemCard({ card, onPress }) {
  const darkTxt = '#1A1A2E';
  return (
    <TouchableOpacity style={[styles.remCard, { backgroundColor: card.bg }]} onPress={() => onPress(card)} activeOpacity={0.82}>
      <Text style={styles.remEmoji}>{card.emoji}</Text>
      <Text style={[styles.remTxt, { color: darkTxt }]} numberOfLines={3}>{card.text}</Text>
      <View style={styles.remBottom}>
        <Text style={[styles.remTime, { color: darkTxt + 'AA' }]}>{card.time}</Text>
        <View style={styles.remArrowBtn}>
          <Ionicons name="arrow-up-forward" size={12} color={darkTxt} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Action Sheet ──────────────────────────────────────────────────────────────
function ActionSheet({ card, onClose, onAction, colors, isDark }) {
  if (!card) return null;
  const sheetBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const sub = isDark ? 'rgba(240,238,255,0.45)' : '#9CA3AF';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: sheetBg }]}>
          <View style={styles.sheetHandle} />

          {/* Card preview */}
          <View style={[styles.sheetPreview, { backgroundColor: card.bg }]}>
            <Text style={styles.sheetPreviewEmoji}>{card.emoji}</Text>
            <Text style={[styles.sheetPreviewTxt, { color: '#1A1A2E' }]} numberOfLines={2}>{card.text}</Text>
            <Text style={[styles.sheetPreviewTime, { color: '#1A1A2EAA' }]}>{card.time}</Text>
          </View>

          <Text style={[styles.sheetHint, { color: sub }]}>What would you like to do?</Text>

          {/* Primary action */}
          <TouchableOpacity
            style={[styles.sheetAction, { backgroundColor: colors.primary }]}
            onPress={() => onAction('reminder', card)}
            activeOpacity={0.85}
          >
            <Ionicons name="alarm" size={16} color="#fff" />
            <Text style={styles.sheetActionTxt}>Create Reminder</Text>
          </TouchableOpacity>

          {/* Secondary actions */}
          <TouchableOpacity
            style={[styles.sheetActionSec, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}
            onPress={() => onAction('recurring', card)}
            activeOpacity={0.8}
          >
            <Ionicons name="repeat" size={15} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetActionSecTxt, { color: colors.primary }]}>Set as Recurring</Text>
              <Text style={[styles.sheetActionSecSub, { color: sub }]}>{card.repeat}</Text>
            </View>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetActionSec, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}
            onPress={() => onAction('today', card)}
            activeOpacity={0.8}
          >
            <Ionicons name="today" size={15} color={colors.primary} />
            <Text style={[styles.sheetActionSecTxt, { color: colors.primary }]}>Add to Today</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={[styles.sheetCancelTxt, { color: sub }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WellbeingScreen() {
  const { colors, isDark } = useTheme();
  const [activeCard, setActiveCard] = useState(null);

  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const cardBg   = isDark ? '#1C1C2E' : '#FFFFFF';

  const handleAction = (type, card) => {
    setActiveCard(null);
    const params = { prefillTitle: `${card.text} ${card.emoji}`, prefillCategory: card.category };
    if (type === 'recurring') params.prefillRepeat = card.repeat;
    if (type === 'today') params.prefillToday = 'true';
    setTimeout(() => router.push({ pathname: '/(app)/calendar/add-event', params }), 220);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Family Status ── */}
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>FAMILY STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {TRACKING_MEMBERS.map(m => (
            <TouchableOpacity key={m.id} style={[styles.famCard, { backgroundColor: cardBg }]} activeOpacity={0.8}>
              <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
                <View style={[styles.famAvt, { backgroundColor: m.color }]}>
                  <Ionicons name="person" size={17} color="#fff" />
                </View>
                <View style={[styles.famOnline, { backgroundColor: '#4CAF82', borderColor: cardBg }]} />
              </View>
              <Text style={[styles.famName, { color: colors.textPrimary }]}>{m.name}</Text>
              <View style={[styles.famStatusBadge, { backgroundColor: m.color }]}>
                <Text style={[styles.famStatusTxt, { color: '#fff' }]} numberOfLines={1}>{m.status}</Text>
              </View>
              <View style={[styles.battBadge, { backgroundColor: m.battery > 50 ? '#4CAF8215' : '#FFB34715', alignSelf: 'stretch', justifyContent: 'center' }]}>
                <Ionicons name="battery-half" size={10} color={m.battery > 50 ? '#4CAF82' : '#FFB347'} />
                <Text style={[styles.battTxt, { color: m.battery > 50 ? '#4CAF82' : '#FFB347' }]}>{m.battery}%</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Emergency ── */}
        <Text style={[styles.secLabel, { color: colors.textSecondary }]}>EMERGENCY</Text>

        {/* Quick contacts */}
        <GlassCard style={{ padding: 12 }}>
          <Text style={[styles.emergTitle, { color: colors.textPrimary }]}>Quick Contacts</Text>
          <View style={styles.emergRow}>
            {EMERGENCY_CONTACTS.map(c => (
              <TouchableOpacity key={c.id} style={[styles.emergBtn, { backgroundColor: c.color }]} activeOpacity={0.75}>
                <View style={[styles.emergIconWrap, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                  <Ionicons name={c.icon} size={16} color="#fff" />
                </View>
                <Text style={[styles.emergName, { color: '#fff' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* SOS pulse button */}
        <View style={styles.sosWrap}>
          <PulseButton onPress={() => router.push('/(app)/wellbeing/sos')} size={90} />
        </View>

        {/* ── Smart Reminders ── */}
        <View style={styles.smartHdr}>
          <View>
            <Text style={[styles.smartTitle, { color: colors.textPrimary }]}>{"Don't forget\na thing"}</Text>
            <Text style={[styles.smartSub, { color: colors.textSecondary }]}>Tap a card to schedule it</Text>
          </View>
          <Text style={styles.smartEmoji}>📌</Text>
        </View>

        <View style={styles.grid}>
          {REMINDER_CARDS.map(card => (
            <RemCard key={card.id} card={card} onPress={setActiveCard} />
          ))}
        </View>

        {/* ── Live Tracking ── */}
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <View style={styles.trackHdr}>
            <View style={[styles.trackIconWrap, { backgroundColor: '#6C63FF' }]}>
              <Ionicons name="navigate-circle" size={16} color="#fff" />
            </View>
            <Text style={[styles.trackTitle, { color: colors.textPrimary }]}>Live Location</Text>
            <View style={[styles.livePill, { backgroundColor: '#4CAF8218' }]}>
              <View style={[styles.liveDot, { backgroundColor: '#4CAF82' }]} />
              <Text style={[styles.liveTxt, { color: '#4CAF82' }]}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/wellbeing/tracking')} style={styles.trackOpenBtn}>
              <Text style={[styles.trackOpenTxt, { color: colors.primary }]}>View Map</Text>
              <Ionicons name="arrow-forward" size={11} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Map placeholder */}
          <TouchableOpacity
            style={[styles.mapArea, { backgroundColor: colors.primary + '0A' }]}
            onPress={() => router.push('/(app)/wellbeing/tracking')}
            activeOpacity={0.8}
          >
            <View style={[styles.mapIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="map" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.mapHint, { color: colors.textSecondary }]}>Tap to view live tracking</Text>
          </TouchableOpacity>

          {/* Member rows */}
          {TRACKING_MEMBERS.map((m, i) => (
            <View key={m.id} style={[styles.trackRow, { borderTopWidth: 0.5, borderTopColor: divColor }]}>
              <View style={[styles.trackAvt, { backgroundColor: m.color }]}>
                <Ionicons name="person" size={13} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackName, { color: colors.textPrimary }]}>{m.name}</Text>
                <Text style={[styles.trackPlace, { color: colors.textSecondary }]} numberOfLines={1}>{m.place}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={[styles.trackTime, { color: colors.textSecondary }]}>{m.time}</Text>
                <View style={[styles.battBadge, { backgroundColor: m.battery > 50 ? '#4CAF8215' : '#FFB34715' }]}>
                  <Ionicons name="battery-half" size={10} color={m.battery > 50 ? '#4CAF82' : '#FFB347'} />
                  <Text style={[styles.battTxt, { color: m.battery > 50 ? '#4CAF82' : '#FFB347' }]}>{m.battery}%</Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 16 }} />
      </ScrollView>

      <ActionSheet
        card={activeCard}
        onClose={() => setActiveCard(null)}
        onAction={handleAction}
        colors={colors}
        isDark={isDark}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: { padding: 14, gap: 12 },

  // Smart reminders
  smartHdr: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: 4 },
  smartTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28 },
  smartSub: { fontSize: 11, marginTop: 4 },
  smartEmoji: { fontSize: 28, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  // Reminder card
  remCard: { width: '47.5%', borderRadius: 14, padding: 13, gap: 6, minHeight: 130 },
  remEmoji: { fontSize: 22 },
  remTxt: { fontSize: 13, fontWeight: '600', lineHeight: 18, flex: 1 },
  remBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  remTime: { fontSize: 11, fontWeight: '500' },
  remArrowBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.13)', alignItems: 'center', justifyContent: 'center' },

  // Tracking card
  trackHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingBottom: 10 },
  trackIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  trackTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  trackOpenBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trackOpenTxt: { fontSize: 11, fontWeight: '600' },

  mapArea: { marginHorizontal: 12, borderRadius: 10, height: 80, alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 },
  mapIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mapHint: { fontSize: 11 },

  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  trackAvt: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  trackName: { fontSize: 12, fontWeight: '600' },
  trackPlace: { fontSize: 10, marginTop: 1 },
  trackTime: { fontSize: 10 },
  battBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  battTxt: { fontSize: 10, fontWeight: '600' },

  // Family status
  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  famCard: { width: 110, borderRadius: 14, padding: 12, alignItems: 'center', gap: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  famAvt: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  famOnline: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  famName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  famStatusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, width: '100%', alignItems: 'center' },
  famStatusTxt: { fontSize: 9, fontWeight: '700', textAlign: 'center' },

  // Emergency
  emergTitle: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  emergRow: { flexDirection: 'row', gap: 8 },
  emergBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 5 },
  emergIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emergName: { fontSize: 10, fontWeight: '700' },

  sosWrap: { alignItems: 'center', paddingVertical: 10 },

  // Action sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 34, gap: 10 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginBottom: 8 },

  sheetPreview: { borderRadius: 14, padding: 14, gap: 4 },
  sheetPreviewEmoji: { fontSize: 24 },
  sheetPreviewTxt: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  sheetPreviewTime: { fontSize: 12, marginTop: 2 },

  sheetHint: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },

  sheetAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  sheetActionTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sheetActionSec: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 },
  sheetActionSecTxt: { fontSize: 14, fontWeight: '600', flex: 1 },
  sheetActionSecSub: { fontSize: 11, marginTop: 1 },

  sheetCancel: { alignItems: 'center', paddingVertical: 10 },
  sheetCancelTxt: { fontSize: 14, fontWeight: '600' },
});
