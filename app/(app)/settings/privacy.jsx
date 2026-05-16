import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#4CAF82';

function SettingRow({ icon, color, label, subtitle, toggle, value, onToggle, chevron, destructive, onPress, last, divColor }) {
  return (
    <>
      <TouchableOpacity
        style={styles.row}
        activeOpacity={toggle ? 1 : 0.75}
        onPress={toggle ? undefined : onPress}
      >
        <View style={[styles.rowIcon, { backgroundColor: (destructive ? '#FF6B6B' : color) + '20' }]}>
          <Ionicons name={icon} size={17} color={destructive ? '#FF6B6B' : color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: destructive ? '#FF6B6B' : undefined }]}>{label}</Text>
          {subtitle ? <Text style={[styles.rowSub, { color: destructive ? '#FF6B6B88' : undefined }]}>{subtitle}</Text> : null}
        </View>
        {toggle
          ? <Switch value={value} onValueChange={onToggle}
              trackColor={{ false: '#D1D5DB', true: color + 'AA' }}
              thumbColor={value ? color : '#F9FAFB'}
              ios_backgroundColor="#D1D5DB"
            />
          : chevron
          ? <Ionicons name="chevron-forward" size={15} color={undefined} />
          : null}
      </TouchableOpacity>
      {!last && <View style={[styles.div, { backgroundColor: divColor }]} />}
    </>
  );
}

export default function PrivacyScreen() {
  const { colors, isDark } = useTheme();
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [location, setLocation] = useState(true);
  const [usageData, setUsageData] = useState(true);
  const [crashReports, setCrashReports] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  const styles2 = { rowLabel: { color: colors.textPrimary }, rowSub: { color: isDark ? '#9CA3AF' : '#6B7280' } };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Security */}
      <Text style={[styles.secLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SECURITY</Text>
      <GlassCard style={styles.card}>
        <SettingRow icon="finger-print" color="#6C63FF" label="Biometric Authentication" subtitle="Face ID or Touch ID to unlock" toggle value={biometric} onToggle={setBiometric} divColor={divColor} />
        <SettingRow icon="shield-checkmark" color="#4CAF82" label="Two-Factor Authentication" subtitle={twoFactor ? 'Enabled via SMS' : 'Add extra account security'} toggle value={twoFactor} onToggle={setTwoFactor} divColor={divColor} />
        <SettingRow icon="time" color="#FFB347" label="Auto-Lock" subtitle="After 5 minutes of inactivity" chevron
          onPress={() => Alert.alert('Auto-Lock', 'Choose timeout: 1 min / 5 min / 15 min / Never')}
          divColor={divColor} last />
      </GlassCard>

      {/* Privacy */}
      <Text style={[styles.secLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>PRIVACY</Text>
      <GlassCard style={styles.card}>
        <SettingRow icon="location" color="#4CAF82" label="Location Sharing" subtitle="Share real-time location with family" toggle value={location} onToggle={setLocation} divColor={divColor} />
        <SettingRow icon="analytics" color="#6C63FF" label="Usage Analytics" subtitle="Help us improve smartStack" toggle value={usageData} onToggle={setUsageData} divColor={divColor} />
        <SettingRow icon="bug" color="#FFB347" label="Crash Reports" subtitle="Automatically send crash logs" toggle value={crashReports} onToggle={setCrashReports} divColor={divColor} />
        <SettingRow icon="people" color="#FF6B9D" label="Public Profile" subtitle="Allow family search by name" toggle value={publicProfile} onToggle={setPublicProfile} divColor={divColor} last />
      </GlassCard>

      {/* Data */}
      <Text style={[styles.secLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>DATA & STORAGE</Text>
      <GlassCard style={styles.card}>
        <SettingRow icon="download-outline" color="#6C63FF" label="Download My Data" subtitle="Export all your data (emailed within 24h)" chevron
          onPress={() => Alert.alert('Download Data', 'A download link will be sent to your email address within 24 hours.', [{ text: 'OK' }])}
          divColor={divColor} />
        <SettingRow icon="trash-outline" color="#FFB347" label="Clear App Cache" subtitle="Free up local storage space" chevron
          onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully!', [{ text: 'OK' }])}
          divColor={divColor} />
        <SettingRow icon="skull-outline" color="#FF6B6B" label="Delete Account" subtitle="Permanently remove your account" chevron destructive
          onPress={() => Alert.alert('Delete Account', 'This will permanently delete your account and all family data. This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => {} },
          ])}
          divColor={divColor} last />
      </GlassCard>

      <GlassCard style={styles.noteCard}>
        <Ionicons name="lock-closed" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
        <Text style={[styles.noteTxt, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          smartStack uses end-to-end encryption. Your family's data is never sold or shared with third parties.
        </Text>
      </GlassCard>

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  card: { padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, marginTop: 2 },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  noteTxt: { flex: 1, fontSize: 12, lineHeight: 18 },
});
