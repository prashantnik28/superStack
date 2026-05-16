import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import GlassCard from '../../../src/components/ui/GlassCard';

const FAMILY = [
  { id: '1', name: 'Aarav', role: 'Son', age: 10, color: '#6C63FF', status: 'At School', statusColor: '#4CAF82' },
  { id: '2', name: 'Myra', role: 'Daughter', age: 7, color: '#FF6B9D', status: 'Dance Class', statusColor: '#FFB347' },
  { id: '3', name: 'Rajan', role: 'Spouse', age: 38, color: '#4CAF82', status: 'At Work', statusColor: '#6C63FF' },
];

const ACTIVITY = [
  { day: 'Mon', tasks: 8 }, { day: 'Tue', tasks: 5 }, { day: 'Wed', tasks: 10 },
  { day: 'Thu', tasks: 7 }, { day: 'Fri', tasks: 6 }, { day: 'Sat', tasks: 3 }, { day: 'Sun', tasks: 4 },
];

const PLAN_FEATURES = [
  'Real-time GPS tracking',
  'Unlimited family members',
  'AI wardrobe suggestions',
  'Smart pantry alerts',
  'Priority support',
];

const SETTING_SECTIONS = [
  {
    title: 'Preferences',
    items: [
      { label: 'Push Notifications', icon: 'notifications', color: '#6C63FF', toggle: true, defaultOn: true },
      { label: 'Location Sharing', icon: 'location', color: '#4CAF82', toggle: true, defaultOn: true },
      { label: 'Dark Mode', icon: 'moon', color: '#6C63FF', toggle: true, defaultOn: false },
      { label: 'Email Digests', icon: 'mail', color: '#FFB347', toggle: true, defaultOn: false },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Edit Profile', icon: 'person', color: '#6C63FF', toggle: false },
      { label: 'Change Password', icon: 'lock-closed', color: '#FF6B6B', toggle: false },
      { label: 'Connected Devices', icon: 'phone-portrait', color: '#4CAF82', toggle: false, badge: '2' },
      { label: 'Language', icon: 'language', color: '#FFB347', toggle: false, value: 'English' },
    ],
  },
  {
    title: 'Privacy & Support',
    items: [
      { label: 'Privacy & Security', icon: 'shield-checkmark', color: '#4CAF82', toggle: false },
      { label: 'Data & Storage', icon: 'server', color: '#6C63FF', toggle: false },
      { label: 'Help & Support', icon: 'help-circle', color: '#FFB347', toggle: false },
      { label: 'Rate smartStack', icon: 'star', color: '#FF6B9D', toggle: false },
    ],
  },
];

const maxTasks = Math.max(...ACTIVITY.map(a => a.tasks));

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const [toggles, setToggles] = useState({ 'Push Notifications': true, 'Location Sharing': true, 'Email Digests': false });

  const toggleSwitch = (label) => {
    if (label === 'Dark Mode') { toggleTheme(); return; }
    setToggles(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScrollView style={[styles.scroll]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero Card */}
      <GlassCard style={[styles.heroCard, { backgroundColor: isDark ? '#1A1A2E' : '#6C63FF' }]}>
        <View style={styles.heroInner}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarTxt}>P</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{user?.name || 'Somya Singh'}</Text>
            <Text style={styles.heroEmail}>{user?.email || 'somya@example.com'}</Text>
            <View style={styles.heroPlanRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.heroPlan}>Family Pro · Active</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.heroEditBtn}>
            <Ionicons name="pencil" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroStats}>
          {[
            { label: 'Tasks Done', value: '47', icon: 'checkmark-circle' },
            { label: 'Services', value: '4', icon: 'apps' },
            { label: 'Members', value: '3', icon: 'people' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.heroStat}>
                <Ionicons name={s.icon} size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.heroStatValue}>{s.value}</Text>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </GlassCard>

      {/* Weekly Activity */}
      <GlassCard style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Weekly Activity</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Tasks completed</Text>
        </View>
        <View style={styles.barChart}>
          {ACTIVITY.map(a => (
            <View key={a.day} style={styles.barCol}>
              <Text style={[styles.barValue, { color: colors.textSecondary }]}>{a.tasks}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(a.tasks / maxTasks) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.barDay, { color: colors.textSecondary }]}>{a.day}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Family Members */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Family</Text>
      <GlassCard style={styles.familyCard}>
        {FAMILY.map((m, i) => (
          <View key={m.id}>
            <View style={styles.familyRow}>
              <View style={[styles.familyAvatar, { backgroundColor: m.color }]}>
                <Text style={styles.familyInitials}>{m.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.familyName, { color: colors.textPrimary }]}>{m.name} <Text style={[styles.familyAge, { color: colors.textSecondary }]}>· Age {m.age}</Text></Text>
                <Text style={[styles.familyRole, { color: colors.textSecondary }]}>{m.role}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: m.statusColor + '22' }]}>
                <View style={[styles.statusDot, { backgroundColor: m.statusColor }]} />
                <Text style={[styles.statusTxt, { color: m.statusColor }]}>{m.status}</Text>
              </View>
            </View>
            {i < FAMILY.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
        <TouchableOpacity style={[styles.addMemberBtn, { borderColor: colors.primary }]}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[styles.addMemberTxt, { color: colors.primary }]}>Add Family Member</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* Subscription Plan */}
      <GlassCard style={[styles.planCard, { backgroundColor: isDark ? '#16163A' : '#6C63FF08' }]}>
        <View style={styles.planHeader}>
          <View style={[styles.planIconWrap, { backgroundColor: '#6C63FF22' }]}>
            <Ionicons name="diamond" size={22} color="#6C63FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planTitle, { color: colors.textPrimary }]}>Family Pro Plan</Text>
            <Text style={[styles.planRenew, { color: colors.textSecondary }]}>Renews Jun 1, 2026 · ₹299/mo</Text>
          </View>
          <TouchableOpacity style={[styles.managePlanBtn, { backgroundColor: '#6C63FF' }]}>
            <Text style={styles.managePlanTxt}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.planFeatures}>
          {PLAN_FEATURES.map(f => (
            <View key={f} style={styles.planFeatureRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF82" />
              <Text style={[styles.planFeatureTxt, { color: colors.textSecondary }]}>{f}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Settings */}
      {SETTING_SECTIONS.map(section => (
        <View key={section.title}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
          <GlassCard style={styles.settingsCard}>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <View style={styles.settingRow}>
                  <View style={[styles.settingIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  {item.toggle ? (
                    <Switch
                      value={item.label === 'Dark Mode' ? isDark : (toggles[item.label] ?? item.defaultOn)}
                      onValueChange={() => toggleSwitch(item.label)}
                      trackColor={{ false: colors.border, true: colors.primary + 'AA' }}
                      thumbColor={(item.label === 'Dark Mode' ? isDark : toggles[item.label]) ? colors.primary : '#ccc'}
                      ios_backgroundColor={colors.border}
                    />
                  ) : item.value ? (
                    <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{item.value}</Text>
                  ) : item.badge ? (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeTxt}>{item.badge}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  )}
                </View>
                {i < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </GlassCard>
        </View>
      ))}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.textPrimary }]}>smart<Text style={{ color: colors.primary }}>Stack</Text></Text>
        <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0 · Build 100</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#FF6B6B18', borderColor: '#FF6B6B40' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutTxt}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },

  heroCard: { padding: 0, overflow: 'hidden', borderWidth: 0 },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 16 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  heroAvatarTxt: { color: '#fff', fontSize: 26, fontWeight: '800' },
  heroName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroEmail: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  heroPlanRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  heroPlan: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  heroEditBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', paddingVertical: 14, paddingHorizontal: 20 },
  heroStat: { flex: 1, alignItems: 'center', gap: 3 },
  heroStatValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  statDivider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  activityCard: { padding: 16, gap: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 11 },
  barChart: { flexDirection: 'row', gap: 8, height: 80, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, fontWeight: '600' },
  barTrack: { flex: 1, width: '70%', backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 9, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '700', paddingHorizontal: 2 },
  familyCard: { padding: 14, gap: 12 },
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  familyAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  familyInitials: { color: '#fff', fontWeight: '700', fontSize: 14 },
  familyName: { fontSize: 14, fontWeight: '700' },
  familyAge: { fontSize: 12, fontWeight: '400' },
  familyRole: { fontSize: 11, marginTop: 2 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '700' },
  divider: { height: 0.5, marginVertical: 8 },
  addMemberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 4 },
  addMemberTxt: { fontSize: 13, fontWeight: '700' },

  planCard: { borderRadius: 20, padding: 16, gap: 14, borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planTitle: { fontSize: 15, fontWeight: '700' },
  planRenew: { fontSize: 11, marginTop: 2 },
  managePlanBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 11 },
  managePlanTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planFeatures: { gap: 8 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planFeatureTxt: { fontSize: 12 },

  settingsCard: { padding: 0, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, flex: 1, fontWeight: '500' },
  settingValue: { fontSize: 13 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },

  appInfo: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  appName: { fontSize: 16, fontWeight: '800' },
  appVersion: { fontSize: 11 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16, borderWidth: 1 },
  logoutTxt: { color: '#FF6B6B', fontSize: 15, fontWeight: '700' },
});
