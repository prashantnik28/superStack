import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import PulseButton from '../../../src/components/ui/PulseButton';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';

const TABS = [
  { id: 'sos',      label: 'SOS',       icon: 'warning-outline',          activeIcon: 'warning' },
  { id: 'map',      label: 'Map',       icon: 'map-outline',               activeIcon: 'map' },
  { id: 'checkins', label: 'Check-ins', icon: 'checkmark-circle-outline',  activeIcon: 'checkmark-circle' },
];

const CONTACTS = [
  { id: '1', name: 'Prashant (Husband)', phone: '+91 9650246059', relation: 'Spouse',    icon: 'person', color: '#6C63FF' },
  { id: '2', name: 'Somya (Wife)',        phone: '+91 9650246059', relation: 'Spouse',    icon: 'heart',  color: '#FF6B9D' },
  { id: '3', name: 'Mrs. Kapoor',         phone: '+91 9650246059', relation: 'Neighbor',  icon: 'home',   color: '#4CAF82' },
  { id: '4', name: 'Police',              phone: '100',            relation: 'Emergency', icon: 'shield', color: '#FF6B6B' },
];

const SAFE_ZONES = [
  { name: 'Home', address: '45 MG Road, Bangalore', icon: 'home', active: true },
  { name: 'St. Joseph School', address: 'Church Street, Bangalore', icon: 'school', active: true },
];

const CHECKINS = [
  { name: 'Aarav',    place: 'St. Joseph School',    time: '8:40 AM',  color: '#6C63FF' },
  { name: 'Sejal',    place: 'Dance Studio',          time: '10:15 AM', color: '#FF6B9D' },
  { name: 'Somya',    place: 'Connaught Place, Delhi', time: '9:02 AM', color: '#4CAF82' },
  { name: 'Prashant', place: 'Sector 62, Noida',      time: '9:18 AM', color: '#FFB347' },
];

export default function EmergencyScreen() {
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const [activeTab, setActiveTab] = useState('sos');
  const [sosSent, setSosSent] = useState(false);

  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleSOS = () => {
    setSosSent(true);
    Alert.alert('SOS Sent!', 'Your location has been shared with all emergency contacts.', [
      { text: 'OK', onPress: () => setSosSent(false) },
    ]);
  };

  return (
    <View style={styles.flex}>
      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, {
        borderBottomColor: border,
        backgroundColor: 'transparent',
      }]}>
        {TABS.map(tab => {
          const isAct = activeTab === tab.id;
          const tabColor = tab.id === 'sos' ? '#FF3B30' : '#6C63FF';
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isAct && { borderBottomColor: tabColor, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isAct ? tab.activeIcon : tab.icon}
                size={16}
                color={isAct ? tabColor : sub}
              />
              <Text style={[styles.tabLabel, { color: isAct ? tabColor : sub, fontWeight: isAct ? '700' : '500' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <ScrollView
        key={activeTab}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── MAP ── */}
        {activeTab === 'map' && (
          <>
            <GlassCard style={styles.mapCard}>
              <View style={[styles.mapPlaceholder, { backgroundColor: colors.primary + '0F' }]}>
                <Ionicons name="map" size={52} color={colors.primary} />
                <Text style={[styles.mapTitle, { color: colors.primary }]}>Live Tracking Map</Text>
                <Text style={[styles.mapSub, { color: sub }]}>Real-time GPS tracking coming soon</Text>
              </View>
            </GlassCard>

            <Text style={[styles.secLabel, { color: sub }]}>MEMBER LOCATIONS</Text>
            {members.map(m => (
              <GlassCard key={m.id} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { backgroundColor: m.color }]}>
                  <Text style={styles.memberInitials}>{m.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{m.name}</Text>
                  <Text style={[styles.memberStatus, { color: sub }]}>{m.status || 'Home Area'}</Text>
                </View>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineTxt}>Online</Text>
                </View>
              </GlassCard>
            ))}
          </>
        )}

        {/* ── CHECK-INS ── */}
        {activeTab === 'checkins' && (
          <>
            <Text style={[styles.secLabel, { color: sub }]}>TODAY'S CHECK-INS</Text>
            {CHECKINS.map((c, i) => (
              <GlassCard key={i} style={styles.memberRow}>
                <View style={[styles.memberAvatar, { backgroundColor: c.color }]}>
                  <Text style={styles.memberInitials}>{c.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{c.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={11} color={sub} />
                    <Text style={[styles.memberStatus, { color: sub }]}>{c.place}</Text>
                  </View>
                </View>
                <Text style={[styles.checkTime, { color: sub }]}>{c.time}</Text>
              </GlassCard>
            ))}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#6C63FF' }]}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.actionBtnTxt}>Add Check-in</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SOS ── */}
        {activeTab === 'sos' && (
          <>
            <GlassCard style={styles.sosCard}>
              <Text style={[styles.sosCardTitle, { color: colors.textPrimary }]}>Emergency Alert</Text>
              <Text style={[styles.sosCardSub, { color: sub }]}>
                Press and hold to send your location to all emergency contacts
              </Text>
              <View style={styles.pulseWrap}>
                <PulseButton onPress={handleSOS} />
              </View>
              {sosSent && (
                <View style={[styles.sentBanner, { backgroundColor: '#4CAF8222' }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF82" />
                  <Text style={[styles.sentTxt, { color: '#4CAF82' }]}>SOS alert sent successfully!</Text>
                </View>
              )}
            </GlassCard>

            <Text style={[styles.secLabel, { color: sub }]}>EMERGENCY CONTACTS</Text>
            {CONTACTS.map(c => (
              <GlassCard key={c.id} style={styles.contactCard}>
                <View style={[styles.contactIcon, { backgroundColor: c.color + '22' }]}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{c.name}</Text>
                  <Text style={[styles.memberStatus, { color: sub }]}>{c.phone}</Text>
                  <Text style={[styles.relation, { color: c.color }]}>{c.relation}</Text>
                </View>
                <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              </GlassCard>
            ))}

            <Text style={[styles.secLabel, { color: sub }]}>SAFE ZONES</Text>
            <GlassCard style={styles.safeZoneCard}>
              <View style={styles.safeZoneHeader}>
                <Ionicons name="location" size={18} color="#6C63FF" />
                <Text style={[styles.safeZoneTitle, { color: colors.textPrimary }]}>Monitored Zones</Text>
              </View>
              {SAFE_ZONES.map((z, i) => (
                <View key={i} style={[styles.zoneRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: border, paddingTop: 12, marginTop: 4 }]}>
                  <View style={[styles.zoneIcon, { backgroundColor: '#6C63FF22' }]}>
                    <Ionicons name={z.icon} size={15} color="#6C63FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                    <Text style={[styles.zoneAddr, { color: sub }]}>{z.address}</Text>
                  </View>
                  <View style={[styles.activeChip, { backgroundColor: '#4CAF8220' }]}>
                    <Text style={styles.activeChipTxt}>Active</Text>
                  </View>
                </View>
              ))}
            </GlassCard>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
              onPress={handleSOS}
              activeOpacity={0.85}
            >
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={styles.actionBtnTxt}>Send SOS Alert to Family</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 0.5, paddingHorizontal: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 11,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 12 },

  // Content
  content: { padding: 16, gap: 14 },
  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },

  // Stats
  statsCard: { padding: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 5 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  statDiv: { width: 0.5, height: 40 },

  // Member rows
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberStatus: { fontSize: 11, marginTop: 2 },
  safeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  safeChipTxt: { fontSize: 10, color: '#4CAF82', fontWeight: '700' },

  // Map
  mapCard: { overflow: 'hidden' },
  mapPlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapTitle: { fontSize: 15, fontWeight: '700' },
  mapSub: { fontSize: 12, textAlign: 'center' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF82' },
  onlineTxt: { fontSize: 11, color: '#4CAF82', fontWeight: '600' },

  // Check-ins
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  checkTime: { fontSize: 11, fontWeight: '600' },

  // SOS card
  sosCard: { padding: 20, alignItems: 'center', gap: 10 },
  sosCardTitle: { fontSize: 18, fontWeight: '700' },
  sosCardSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  pulseWrap: { paddingVertical: 16 },
  sentBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sentTxt: { fontSize: 13, fontWeight: '600' },

  // Contacts
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  contactIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  relation: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#4CAF82', alignItems: 'center', justifyContent: 'center' },

  // Safe zones
  safeZoneCard: { padding: 16, gap: 12 },
  safeZoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safeZoneTitle: { fontSize: 15, fontWeight: '700' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zoneIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  zoneName: { fontSize: 13, fontWeight: '600' },
  zoneAddr: { fontSize: 11, marginTop: 2 },
  activeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeChipTxt: { color: '#4CAF82', fontSize: 10, fontWeight: '700' },

  // Action button
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 13 },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
