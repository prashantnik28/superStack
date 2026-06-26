import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../src/context/ThemeContext';
import { useFamilyStore } from '../../../src/stores/useFamilyStore';

const SERVICES = [
  { id: 'kitchen',   label: 'Kitchen',    icon: 'restaurant',       color: '#FFB347', desc: 'Pantry, shopping list, meal planner' },
  { id: 'wardrobe',  label: 'Wardrobe',   icon: 'shirt',            color: '#6C63FF', desc: 'Clothing items and outfit suggestions' },
  { id: 'calendar',  label: 'Calendar',   icon: 'calendar',         color: '#4CAF82', desc: 'Family events and reminders' },
  { id: 'expenses',  label: 'Expenses',   icon: 'wallet',           color: '#10B981', desc: 'Family transactions and budgets' },
  { id: 'tracking',  label: 'Tracking',   icon: 'navigate-circle',  color: '#3B82F6', desc: 'Location sharing and geo-zones' },
  { id: 'wellbeing', label: 'Wellbeing',  icon: 'heart',            color: '#FF6B9D', desc: 'Mood check-ins and health logs' },
  { id: 'cctv',      label: 'CCTV',       icon: 'videocam',         color: '#9C27B0', desc: 'Home camera feeds' },
];

const MEMBER_COLORS = ['#6C63FF', '#FF6B9D', '#4CAF82', '#FFB347', '#3B82F6', '#9C27B0', '#26C6DA'];

function PermissionRow({ service, value, onToggle, loading, colors, isDark }) {
  return (
    <View style={[S.permRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={[S.permIcon, { backgroundColor: service.color + '20' }]}>
        <Ionicons name={service.icon} size={16} color={service.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[S.permLabel, { color: colors.textPrimary }]}>{service.label}</Text>
        <Text style={[S.permDesc, { color: colors.textSecondary }]} numberOfLines={1}>{service.desc}</Text>
      </View>
      {loading
        ? <ActivityIndicator size="small" color={service.color} />
        : (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: isDark ? '#333' : '#DDD', true: service.color + '80' }}
            thumbColor={value ? service.color : (isDark ? '#666' : '#fff')}
            ios_backgroundColor={isDark ? '#333' : '#DDD'}
          />
        )}
    </View>
  );
}

function MemberCard({ member, index, permissions, onToggle, loadingKey, colors, isDark, expanded, onExpand }) {
  const color = MEMBER_COLORS[index % MEMBER_COLORS.length];
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#fff';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const allOn = SERVICES.every(s => permissions[s.id] !== false);
  const onCount = SERVICES.filter(s => permissions[s.id] !== false).length;

  return (
    <View style={[S.memberCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Header row */}
      <TouchableOpacity style={S.memberHeader} onPress={onExpand} activeOpacity={0.75}>
        <LinearGradient
          colors={[color, color + 'CC']}
          style={S.memberAvatar}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={S.memberInitial}>{member.name[0].toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[S.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
          <Text style={[S.memberSub, { color: colors.textSecondary }]}>
            {onCount}/{SERVICES.length} services enabled
          </Text>
        </View>
        <View style={[S.accessChip, {
          backgroundColor: allOn ? '#4CAF8215' : '#FF6B6B15',
          borderColor: allOn ? '#4CAF8240' : '#FF6B6B40',
        }]}>
          <Text style={{ color: allOn ? '#4CAF82' : '#FF6B6B', fontSize: 10, fontWeight: '700' }}>
            {allOn ? 'Full Access' : 'Restricted'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16} color={colors.textSecondary}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* Expanded permission toggles */}
      {expanded && (
        <View style={[S.permList, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
          {/* Quick toggle all */}
          <TouchableOpacity
            style={[S.toggleAllRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F7FF' }]}
            onPress={() => SERVICES.forEach(s => onToggle(s.id, !allOn))}
            activeOpacity={0.75}
          >
            <Ionicons name={allOn ? 'close-circle-outline' : 'checkmark-circle-outline'} size={15} color={allOn ? '#FF6B6B' : '#4CAF82'} />
            <Text style={{ color: allOn ? '#FF6B6B' : '#4CAF82', fontSize: 12, fontWeight: '700', flex: 1, marginLeft: 6 }}>
              {allOn ? 'Restrict All' : 'Enable All'}
            </Text>
          </TouchableOpacity>

          {SERVICES.map((svc, i) => (
            <PermissionRow
              key={svc.id}
              service={svc}
              value={permissions[svc.id] !== false}
              onToggle={v => onToggle(svc.id, v)}
              loading={loadingKey === svc.id}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function FamilySettingsScreen() {
  const { colors, isDark } = useTheme();
  const {
    members, isAdmin, family,
    allPermissions, fetchAllPermissions, updatePermission,
  } = useFamilyStore();

  const [expandedId, setExpandedId] = useState(null);
  const [loadingKey, setLoadingKey] = useState(null); // "memberId:service"

  useFocusEffect(useCallback(() => {
    fetchAllPermissions();
  }, []));

  // Non-admin members only (admin always has full access)
  const nonAdminMembers = members.filter(m => m.role !== 'admin');

  const handleToggle = async (memberId, service, allowed) => {
    const key = `${memberId}:${service}`;
    setLoadingKey(key);
    try {
      await updatePermission(memberId, service, allowed);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update permission');
    } finally {
      setLoadingKey(null);
    }
  };

  const bg = isDark ? '#070714' : '#F5F4FF';

  if (!isAdmin) {
    return (
      <View style={[S.center, { backgroundColor: bg }]}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
        <Text style={[S.emptyTitle, { color: colors.textPrimary }]}>Admin Only</Text>
        <Text style={[S.emptySub, { color: colors.textSecondary }]}>Only the family admin can manage permissions.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

      {/* Info banner */}
      <LinearGradient colors={['#6C63FF20', '#FF6B9D10']} style={S.infoBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={[S.infoIconWrap, { backgroundColor: '#6C63FF20' }]}>
          <Ionicons name="shield-checkmark" size={18} color="#6C63FF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[S.infoTitle, { color: colors.textPrimary }]}>You are the Main Member</Text>
          <Text style={[S.infoSub, { color: colors.textSecondary }]}>
            As {family?.name ?? 'your family'}'s admin, you decide what each member can access. Toggle services on or off per person.
          </Text>
        </View>
      </LinearGradient>

      {/* Member cards */}
      {nonAdminMembers.length === 0 ? (
        <View style={S.center}>
          <Ionicons name="people-outline" size={44} color={colors.textSecondary} />
          <Text style={[S.emptyTitle, { color: colors.textPrimary }]}>No Other Members</Text>
          <Text style={[S.emptySub, { color: colors.textSecondary }]}>Invite family members first to manage their permissions.</Text>
        </View>
      ) : (
        nonAdminMembers.map((member, i) => {
          const perms = allPermissions[member.id] ?? Object.fromEntries(SERVICES.map(s => [s.id, true]));
          return (
            <MemberCard
              key={member.id}
              member={member}
              index={i}
              permissions={perms}
              onToggle={(service, allowed) => handleToggle(member.id, service, allowed)}
              loadingKey={loadingKey?.startsWith(member.id) ? loadingKey.split(':')[1] : null}
              colors={colors}
              isDark={isDark}
              expanded={expandedId === member.id}
              onExpand={() => setExpandedId(expandedId === member.id ? null : member.id)}
            />
          );
        })
      )}

      {/* Admin card (locked) */}
      <View style={[S.adminCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8F7FF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.12)' }]}>
        <LinearGradient colors={['#6C63FF', '#9C27B0']} style={S.memberAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={S.memberInitial}>{members.find(m => m.role === 'admin')?.name?.[0]?.toUpperCase() ?? 'A'}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[S.memberName, { color: colors.textPrimary }]}>
              {members.find(m => m.role === 'admin')?.name ?? 'Admin'}
            </Text>
            <View style={[S.accessChip, { backgroundColor: '#6C63FF15', borderColor: '#6C63FF40' }]}>
              <Text style={{ color: '#6C63FF', fontSize: 10, fontWeight: '800' }}>MAIN</Text>
            </View>
          </View>
          <Text style={[S.memberSub, { color: colors.textSecondary }]}>Full access · Cannot be restricted</Text>
        </View>
        <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(108,99,255,0.15)' },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  infoTitle: { fontSize: 13, fontWeight: '800', marginBottom: 3 },
  infoSub: { fontSize: 12, lineHeight: 17 },

  memberCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  memberHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { color: '#fff', fontSize: 16, fontWeight: '800' },
  memberName: { fontSize: 14, fontWeight: '700' },
  memberSub: { fontSize: 11, marginTop: 2 },
  accessChip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },

  permList: { borderTopWidth: StyleSheet.hairlineWidth },
  toggleAllRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  permIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  permLabel: { fontSize: 13, fontWeight: '700' },
  permDesc: { fontSize: 11, marginTop: 1 },

  adminCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
});
