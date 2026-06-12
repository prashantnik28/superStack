import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import GlassCard from '../../src/components/ui/GlassCard';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '806565486713-3s682bf657vmb0omlfqplh7r55941plq.apps.googleusercontent.com';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, googleLogin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const token = googleResponse.authentication?.accessToken;
      if (token) handleGoogleToken(token);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (token) => {
    setLoading(true); setError('');
    try {
      await googleLogin(token);
      router.replace('/(app)/overview');
    } catch (e) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await login(email, password);
      router.replace('/(app)/overview');
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Sign in to your smartStack account</Text>

          <GlassCard style={styles.form}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
              <Text style={[styles.forgot, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </GlassCard>

          {error ? <Text style={styles.errorTxt}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerTxt, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => promptGoogleAsync()}
            disabled={loading}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleTxt, { color: colors.textPrimary }]}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={[styles.link, { color: colors.textSecondary }]}>
              Don't have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 24, gap: 20 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  h1: { fontSize: 32, fontWeight: '800' },
  sub: { fontSize: 14 },
  form: { padding: 20, gap: 10 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  forgot: { fontSize: 13, fontWeight: '500' },
  errorTxt: { color: '#FF6B6B', textAlign: 'center', fontSize: 13 },
  btn: { paddingVertical: 17, borderRadius: 16, alignItems: 'center', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerTxt: { fontSize: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5 },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleTxt: { fontSize: 15, fontWeight: '600' },
  link: { fontSize: 14 },
});
