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

function PasswordField({ label, value, onChange, placeholder, sub, inputBg, borderCol, textColor }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: sub }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
        <Ionicons name="lock-closed-outline" size={16} color={sub} style={{ marginLeft: 12 }} />
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={sub}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setShow(v => !v)} style={{ padding: 12 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={sub} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { colors, isDark } = useTheme();
  const { changePassword, user, logout } = useAuthStore();

  const [old, setOld] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const inputBg = isDark ? '#1C1C35' : '#F3F0FF';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,99,255,0.15)';
  const sub = isDark ? '#9CA3AF' : '#6B7280';

  const strength = !next ? 0 : next.length < 6 ? 1 : next.length < 10 ? 2 : /[A-Z]/.test(next) && /\d/.test(next) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#FF6B6B', '#FFB347', '#4CAF82', '#6C63FF'][strength];

  const handleSave = async () => {
    if (!old || !next || !confirm) {
      Alert.alert('All fields required', 'Please fill in all three fields.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Passwords do not match', 'New password and confirmation must match.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(old, next);
      Alert.alert('Password changed', 'Your password has been updated. Please sign in again.', [
        {
          text: 'OK',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Google accounts can't change password
  if (user?.provider === 'google') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
        <View style={[styles.providerIcon, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="logo-google" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.providerTitle, { color: colors.textPrimary }]}>Google Account</Text>
        <Text style={[styles.providerSub, { color: sub }]}>
          Your account uses Google Sign-In. To change your password, please visit your Google account settings.
        </Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.saveBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <GlassCard style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={sub} />
          <Text style={[styles.infoTxt, { color: sub }]}>
            After changing your password, you'll be signed out and asked to sign in again.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <PasswordField
            label="CURRENT PASSWORD"
            value={old}
            onChange={setOld}
            placeholder="Enter current password"
            sub={sub} inputBg={inputBg} borderCol={borderCol} textColor={colors.textPrimary}
          />
          <View style={[styles.div, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
          <PasswordField
            label="NEW PASSWORD"
            value={next}
            onChange={setNext}
            placeholder="At least 8 characters"
            sub={sub} inputBg={inputBg} borderCol={borderCol} textColor={colors.textPrimary}
          />
          {/* Strength bar */}
          {next.length > 0 && (
            <View style={[styles.strengthWrap, { paddingHorizontal: 14, paddingBottom: 10 }]}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map(lvl => (
                  <View
                    key={lvl}
                    style={[styles.strengthBar, {
                      backgroundColor: strength >= lvl ? strengthColor : (isDark ? '#2A2A40' : '#E5E7EB'),
                    }]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
            </View>
          )}
          <View style={[styles.div, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />
          <PasswordField
            label="CONFIRM NEW PASSWORD"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat new password"
            sub={sub} inputBg={inputBg} borderCol={borderCol} textColor={colors.textPrimary}
          />
          {confirm.length > 0 && next !== confirm && (
            <View style={[styles.mismatch, { paddingHorizontal: 14, paddingBottom: 10 }]}>
              <Ionicons name="alert-circle" size={13} color="#FF6B6B" />
              <Text style={styles.mismatchTxt}>Passwords do not match</Text>
            </View>
          )}
        </GlassCard>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="lock-closed" size={17} color="#fff" />
                <Text style={styles.saveBtnTxt}>Update Password</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  infoTxt: { flex: 1, fontSize: 12, lineHeight: 18 },

  card: { padding: 0 },
  fieldWrap: { padding: 14, gap: 8 },
  div: { height: 0.5 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, height: 48,
  },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '500' },

  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 44 },

  mismatch: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  mismatchTxt: { color: '#FF6B6B', fontSize: 12 },

  providerIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  providerTitle: { fontSize: 20, fontWeight: '800' },
  providerSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
