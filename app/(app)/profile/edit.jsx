import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import GlassCard from '../../../src/components/ui/GlassCard';

export default function EditProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);

  const inputBg = isDark ? '#1C1C35' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.15)';
  const sub = isDark ? '#9CA3AF' : '#6B7280';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const updates = { name: name.trim() };
      if (avatar.trim()) updates.avatar = avatar.trim();
      await updateProfile(updates);
      router.back();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U').slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <Text style={[styles.avatarHint, { color: sub }]}>
            {user?.uniqueId ? `Your ID: ${user.uniqueId}` : 'Your profile'}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          {/* Name */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: sub }]}>DISPLAY NAME</Text>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Ionicons name="person-outline" size={16} color={sub} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={sub}
                maxLength={60}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={[styles.fieldDiv, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

          {/* Email (read-only) */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: sub }]}>EMAIL</Text>
            <View style={[styles.inputRow, { backgroundColor: isDark ? '#161625' : '#F9F9FF', borderColor: borderCol, opacity: 0.6 }]}>
              <Ionicons name="mail-outline" size={16} color={sub} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={user?.email || ''}
                editable={false}
                placeholderTextColor={sub}
              />
              <Ionicons name="lock-closed-outline" size={13} color={sub} style={{ marginRight: 12 }} />
            </View>
            <Text style={[styles.fieldNote, { color: sub }]}>Email cannot be changed</Text>
          </View>

          <View style={[styles.fieldDiv, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

          {/* Avatar URL */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: sub }]}>AVATAR URL (optional)</Text>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Ionicons name="image-outline" size={16} color={sub} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={avatar}
                onChangeText={setAvatar}
                placeholder="https://…"
                placeholderTextColor={sub}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
              />
            </View>
          </View>
        </GlassCard>

        {/* Provider badge */}
        {user?.provider === 'google' && (
          <View style={[styles.providerBadge, { backgroundColor: isDark ? '#1C1C35' : '#F3F0FF' }]}>
            <Ionicons name="logo-google" size={14} color={colors.primary} />
            <Text style={[styles.providerTxt, { color: sub }]}>Signed in with Google</Text>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnTxt}>Save Changes</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },

  avatarWrap: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 28, fontWeight: '800' },
  avatarHint: { fontSize: 12, fontWeight: '500' },

  card: { padding: 4, gap: 0 },
  fieldWrap: { padding: 14, gap: 8 },
  fieldDiv: { height: 0.5 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, height: 48,
  },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '500' },
  fieldNote: { fontSize: 11, marginTop: -2 },

  providerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignSelf: 'center',
  },
  providerTxt: { fontSize: 12, fontWeight: '500' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
