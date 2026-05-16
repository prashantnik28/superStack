import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const INITIAL_DEVICES = [
  {
    id: '1', name: "Somya's iPhone 14 Pro", os: 'iOS 18.2', icon: 'phone-portrait',
    lastSeen: 'Active now', thisDevice: true, color: '#6C63FF',
    browser: 'smartStack App', location: 'Bangalore, IN',
  },
  {
    id: '2', name: "Rajan's iPhone 13", os: 'iOS 17.6', icon: 'phone-portrait',
    lastSeen: 'Yesterday, 6:30 PM', color: '#4CAF82',
    browser: 'smartStack App', location: 'Bangalore, IN',
  },
  {
    id: '3', name: 'Family iPad Air', os: 'iPadOS 18.1', icon: 'tablet-portrait',
    lastSeen: '3 days ago', color: '#FFB347',
    browser: 'smartStack App', location: 'Bangalore, IN',
  },
];

const TRUSTED = [
  { id: 't1', name: 'Home', address: 'Koramangala, Bangalore', icon: 'home', color: '#6C63FF' },
  { id: 't2', name: 'Office', address: 'MG Road, Bangalore', icon: 'business', color: '#4CAF82' },
];

export default function DevicesScreen() {
  const { colors, isDark } = useTheme();
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  const txt = colors.textPrimary;
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const removeDevice = (id, name) => {
    Alert.alert('Remove Device', `Remove "${name}" from your account?\n\nThis will sign out the device immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setDevices(d => d.filter(dev => dev.id !== id)) },
    ]);
  };

  const signOutAll = () => {
    Alert.alert('Sign Out All Devices', 'Sign out from all other devices? You will remain signed in on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out All', style: 'destructive', onPress: () => setDevices(d => d.filter(dev => dev.thisDevice)) },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Security banner */}
      <GlassCard style={styles.banner}>
        <View style={[styles.bannerIcon, { backgroundColor: '#4CAF8220' }]}>
          <Ionicons name="shield-checkmark" size={22} color="#4CAF82" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: txt }]}>Device Security</Text>
          <Text style={[styles.bannerSub, { color: sub }]}>
            {devices.length} device{devices.length !== 1 ? 's' : ''} signed in to your account. Review any you don't recognise.
          </Text>
        </View>
      </GlassCard>

      {/* Devices list */}
      <Text style={[styles.secLabel, { color: sub }]}>SIGNED IN DEVICES</Text>
      <GlassCard style={styles.card}>
        {devices.map((dev, i) => (
          <View key={dev.id}>
            {i > 0 && <View style={[styles.div, { backgroundColor: divColor }]} />}
            <View style={styles.devRow}>
              <View style={[styles.devIconWrap, { backgroundColor: dev.color + '20' }]}>
                <Ionicons name={dev.icon} size={22} color={dev.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.devNameRow}>
                  <Text style={[styles.devName, { color: txt }]} numberOfLines={1}>{dev.name}</Text>
                  {dev.thisDevice && (
                    <View style={[styles.thisBadge, { backgroundColor: '#6C63FF20' }]}>
                      <Text style={styles.thisBadgeTxt}>This device</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.devMeta, { color: sub }]}>{dev.os} · {dev.location}</Text>
                <Text style={[styles.devLastSeen, { color: dev.thisDevice ? '#4CAF82' : sub }]}>
                  {dev.thisDevice ? '● Active now' : dev.lastSeen}
                </Text>
              </View>
              {!dev.thisDevice && (
                <TouchableOpacity onPress={() => removeDevice(dev.id, dev.name)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </GlassCard>

      {devices.filter(d => !d.thisDevice).length > 0 && (
        <TouchableOpacity
          style={[styles.signOutAll, { borderColor: isDark ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.25)', backgroundColor: isDark ? 'rgba(255,107,107,0.08)' : '#FFF5F5' }]}
          onPress={signOutAll}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
          <Text style={styles.signOutTxt}>Sign Out All Other Devices</Text>
        </TouchableOpacity>
      )}

      {/* Trusted locations */}
      <Text style={[styles.secLabel, { color: sub }]}>TRUSTED LOCATIONS</Text>
      <GlassCard style={styles.card}>
        {TRUSTED.map((loc, i) => (
          <View key={loc.id}>
            {i > 0 && <View style={[styles.div, { backgroundColor: divColor }]} />}
            <View style={styles.locRow}>
              <View style={[styles.locIcon, { backgroundColor: loc.color + '20' }]}>
                <Ionicons name={loc.icon} size={17} color={loc.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locName, { color: txt }]}>{loc.name}</Text>
                <Text style={[styles.locAddr, { color: sub }]}>{loc.address}</Text>
              </View>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="create-outline" size={18} color={sub} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </GlassCard>

      <TouchableOpacity
        style={[styles.addLocBtn, { backgroundColor: isDark ? 'rgba(108,99,255,0.12)' : '#F0EEFF', borderColor: isDark ? 'rgba(108,99,255,0.3)' : 'rgba(108,99,255,0.2)' }]}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={18} color="#6C63FF" />
        <Text style={[styles.addLocTxt, { color: '#6C63FF' }]}>Add Trusted Location</Text>
      </TouchableOpacity>

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  bannerIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  bannerSub: { fontSize: 12, lineHeight: 17 },
  card: { padding: 0 },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  devRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  devIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  devNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  devName: { fontSize: 13, fontWeight: '700', flex: 1 },
  thisBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  thisBadgeTxt: { color: '#6C63FF', fontSize: 9, fontWeight: '700' },
  devMeta: { fontSize: 11, marginBottom: 2 },
  devLastSeen: { fontSize: 11, fontWeight: '600' },
  removeBtn: { padding: 4 },
  signOutAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  signOutTxt: { color: '#FF6B6B', fontSize: 14, fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  locIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locName: { fontSize: 14, fontWeight: '600' },
  locAddr: { fontSize: 11, marginTop: 2 },
  addLocBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  addLocTxt: { fontSize: 14, fontWeight: '700' },
});
