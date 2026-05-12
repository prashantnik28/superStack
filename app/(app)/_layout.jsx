import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useServiceStore } from '../../src/stores/useServiceStore';
import { useFamilyStore } from '../../src/stores/useFamilyStore';
import { useAuthStore } from '../../src/stores/useAuthStore';

const SERVICES = [
  { id: 'wellbeing', name: 'Well-being', icon: 'heart', color: '#FF6B9D', route: '/(app)/wellbeing' },
  { id: 'wardrobe', name: 'Wardrobe', icon: 'shirt', color: '#6C63FF', route: '/(app)/wardrobe' },
  { id: 'kitchen', name: 'Kitchen', icon: 'restaurant', color: '#FFB347', route: '/(app)/kitchen' },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', color: '#4CAF82', route: '/(app)/calendar' },
];

const H = { href: null };

function ServiceDrawer({ visible, onClose }) {
  const { colors, isDark } = useTheme();
  const { members } = useFamilyStore();
  const { activeService, switchService } = useServiceStore();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={[styles.drawer, { backgroundColor: isDark ? '#1C1C2E' : '#FFFFFF' }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {/* Greeting */}
          <View style={styles.drawerHeader}>
            <View>
              <Text style={[styles.greet, { color: isDark ? '#F0EEFF' : '#16163A' }]}>Good morning 👋</Text>
              <Text style={[styles.greetSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>Manage your family from here</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0EEFF' }]}>
              <Ionicons name="close" size={18} color={isDark ? '#F0EEFF' : '#6C63FF'} />
            </TouchableOpacity>
          </View>

          {/* Family Avatars */}
          {members.length > 0 && (
            <View>
              <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>FAMILY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
                {members.map(m => (
                  <View key={m.id} style={styles.avatarWrap}>
                    <View style={[styles.avatar, { backgroundColor: m.color }]}>
                      <Text style={styles.avatarTxt}>{m.name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.avatarOnlineDot, { backgroundColor: '#4CAF82' }]} />
                    <Text style={[styles.avatarName, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{m.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Services */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SERVICES</Text>
          <View style={styles.svcGrid}>
            {SERVICES.map(s => {
              const isActive = activeService === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.svcTile,
                    { backgroundColor: isActive ? s.color : (isDark ? 'rgba(255,255,255,0.07)' : s.color + '15') },
                    isActive && { shadowColor: s.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
                  ]}
                  onPress={() => { switchService(s.id); router.push(s.route); onClose(); }}
                >
                  <View style={[styles.svcIconWrap, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : s.color + '20' }]}>
                    <Ionicons name={s.icon} size={22} color={isActive ? '#fff' : s.color} />
                  </View>
                  <Text style={[styles.svcName, { color: isActive ? '#fff' : (isDark ? '#F0EEFF' : '#16163A') }]}>{s.name}</Text>
                  {isActive && (
                    <View style={styles.activeCheck}>
                      <Ionicons name="checkmark-circle" size={14} color="rgba(255,255,255,0.9)" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Actions */}
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>QUICK ACTIONS</Text>
          <View style={styles.quickRow}>
            {[
              { label: 'Dashboard', icon: 'grid', route: '/(app)/dashboard' },
              { label: 'Profile', icon: 'person', route: '/(app)/profile' },
              { label: 'Calendar', icon: 'calendar', route: '/(app)/calendar' },
            ].map(q => (
              <TouchableOpacity key={q.label} style={[styles.quickBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : '#F0EEFF' }]}
                onPress={() => { router.push(q.route); onClose(); }}>
                <Ionicons name={q.icon} size={18} color="#6C63FF" />
                <Text style={[styles.quickLabel, { color: isDark ? '#F0EEFF' : '#16163A' }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AppLayout() {
  const { colors, isDark } = useTheme();
  const { activeService } = useServiceStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = activeService === 'dashboard' ? 'smartStack' : activeService.charAt(0).toUpperCase() + activeService.slice(1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
          <Ionicons name="menu" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(app)/dashboard')} style={styles.titleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            smart<Text style={{ color: colors.primary }}>Stack</Text>
          </Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0EEFF' }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(app)/profile')} style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.userAvatarTxt}>P</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ServiceDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingBottom: Platform.OS === 'ios' ? 22 : 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}>
        <Tabs.Screen name="dashboard/index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="calendar/index" options={{ title: 'Calendar', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="wellbeing/index" options={{ title: 'Services', tabBarIcon: ({ color, size }) => <Ionicons name="apps-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="profile/index" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="wellbeing/tracking" options={H} />
        <Tabs.Screen name="wellbeing/checkins" options={H} />
        <Tabs.Screen name="wellbeing/sos" options={H} />
        <Tabs.Screen name="wardrobe/index" options={H} />
        <Tabs.Screen name="wardrobe/add-item" options={H} />
        <Tabs.Screen name="wardrobe/suggestions" options={H} />
        <Tabs.Screen name="kitchen/index" options={H} />
        <Tabs.Screen name="kitchen/scan" options={H} />
        <Tabs.Screen name="kitchen/expiry" options={H} />
        <Tabs.Screen name="kitchen/shopping" options={H} />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF6B6B', borderWidth: 1, borderColor: '#fff' },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userAvatarTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  drawer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greet: { fontSize: 20, fontWeight: '800' },
  greetSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  avatarRow: { gap: 16, paddingVertical: 4 },
  avatarWrap: { alignItems: 'center', gap: 4, position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarOnlineDot: { position: 'absolute', bottom: 18, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  avatarName: { fontSize: 11, fontWeight: '600' },
  svcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  svcTile: { width: '47%', padding: 14, borderRadius: 16, gap: 8 },
  svcIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  svcName: { fontSize: 13, fontWeight: '700' },
  activeCheck: { position: 'absolute', top: 10, right: 10 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  quickLabel: { fontSize: 11, fontWeight: '700' },
});
