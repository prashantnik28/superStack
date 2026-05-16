import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';
import PulseButton from '../../../src/components/ui/PulseButton';


const CONTACTS = [
  { id: '1', name: 'Rajan (Husband)', phone: '+91 98765 43210', relation: 'Spouse', icon: 'person', color: '#6C63FF' },
  { id: '2', name: 'Mom', phone: '+91 98100 11223', relation: 'Parent', icon: 'heart', color: '#FF6B9D' },
  { id: '3', name: 'Neighbor — Mrs. Kapoor', phone: '+91 97001 22334', relation: 'Neighbor', icon: 'home', color: '#4CAF82' },
  { id: '4', name: 'Police', phone: '100', relation: 'Emergency', icon: 'shield', color: '#FF6B6B' },
];

export default function SOSScreen() {
  const { colors } = useTheme();
  const [sent, setSent] = useState(false);

  const handleSOS = () => {
    setSent(true);
    Alert.alert('SOS Sent!', 'Your location has been shared with all emergency contacts.', [
      { text: 'OK', onPress: () => setSent(false) },
    ]);
  };

  return (
    <View style={[styles.flex]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.h2, { color: colors.textPrimary }]}>SOS & Emergency</Text>

        <GlassCard style={styles.sosCard}>
          <Text style={[styles.sosTitle, { color: colors.textPrimary }]}>Emergency Alert</Text>
          <Text style={[styles.sosSub, { color: colors.textSecondary }]}>
            Press and hold to send your location to all emergency contacts
          </Text>
          <View style={styles.pulseWrap}>
            <PulseButton onPress={handleSOS} />
          </View>
          {sent && (
            <View style={[styles.sentBanner, { backgroundColor: '#4CAF8222' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF82" />
              <Text style={[styles.sentTxt, { color: '#4CAF82' }]}>SOS alert sent successfully!</Text>
            </View>
          )}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency Contacts</Text>
        {CONTACTS.map(c => (
          <GlassCard key={c.id} style={styles.contactCard}>
            <View style={[styles.contactIcon, { backgroundColor: c.color + '22' }]}>
              <Ionicons name={c.icon} size={20} color={c.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.contactName, { color: colors.textPrimary }]}>{c.name}</Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{c.phone}</Text>
              <Text style={[styles.contactRelation, { color: c.color }]}>{c.relation}</Text>
            </View>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: '#4CAF82' }]}>
              <Ionicons name="call" size={16} color="#fff" />
            </TouchableOpacity>
          </GlassCard>
        ))}

        <GlassCard style={styles.safeZoneCard}>
          <View style={styles.safeZoneHeader}>
            <Ionicons name="location" size={20} color="#6C63FF" />
            <Text style={[styles.safeZoneTitle, { color: colors.textPrimary }]}>Safe Zones</Text>
          </View>
          {[
            { name: 'Home', address: '45 MG Road, Bangalore', icon: 'home', active: true },
            { name: 'St. Joseph School', address: 'Church Street, Bangalore', icon: 'school', active: true },
          ].map((z, i) => (
            <View key={i} style={[styles.zoneRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 10 }]}>
              <View style={[styles.zoneIcon, { backgroundColor: '#6C63FF22' }]}>
                <Ionicons name={z.icon} size={16} color="#6C63FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneName, { color: colors.textPrimary }]}>{z.name}</Text>
                <Text style={[styles.zoneAddr, { color: colors.textSecondary }]}>{z.address}</Text>
              </View>
              <View style={[styles.activeChip, { backgroundColor: '#4CAF8222' }]}>
                <Text style={{ color: '#4CAF82', fontSize: 10, fontWeight: '700' }}>Active</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  h2: { fontSize: 22, fontWeight: '700' },
  sosCard: { padding: 20, alignItems: 'center', gap: 12 },
  sosTitle: { fontSize: 18, fontWeight: '700' },
  sosSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  pulseWrap: { paddingVertical: 20 },
  sentBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  sentTxt: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  contactIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactPhone: { fontSize: 12, marginTop: 2 },
  contactRelation: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  safeZoneCard: { padding: 16, gap: 12 },
  safeZoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  safeZoneTitle: { fontSize: 15, fontWeight: '700' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  zoneIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  zoneName: { fontSize: 13, fontWeight: '600' },
  zoneAddr: { fontSize: 11, marginTop: 2 },
  activeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});
