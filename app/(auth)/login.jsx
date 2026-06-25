import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { usePantryStore } from '../../src/stores/usePantryStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '806565486713-3s682bf657vmb0omlfqplh7r55941plq.apps.googleusercontent.com';
const redirectUri = 'https://auth.expo.io/@prashantnik/smartstack';

// ── Quick-login accounts (dev convenience) ────────────────────────────────
// Aarav and Myra are children in the family — no login accounts
const DEV_ACCOUNTS = [
  { label: 'Prashant', username: 'prashantsingh', password: 'qwertyuiop', color: '#6C63FF' },
  { label: 'Somya',    username: 'somyasingh',    password: 'qwertyuiop', color: '#FF6B9D' },
];

export default function LoginScreen() {
  const { isDark } = useTheme();
  const { login, googleLogin } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOpen, setDevOpen] = useState(false);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    redirectUri,
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
      usePantryStore.getState().fetchItems();
      router.replace('/(app)/overview');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier || !password) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      await login(identifier.trim(), password);
      usePantryStore.getState().fetchItems();
      router.replace('/(app)/overview');
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc) => {
    setIdentifier(acc.username);
    setPassword(acc.password);
    setError('');
    setDevOpen(false);
    setLoading(true);
    try {
      await login(acc.username, acc.password);
      usePantryStore.getState().fetchItems();
      router.replace('/(app)/overview');
    } catch (e) {
      setError(e?.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg      = isDark ? '#111118' : '#FFFFFF';
  const inputBg     = isDark ? 'rgba(255,255,255,0.06)' : '#F7F7FB';
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : '#E8E6F0';
  const txt         = isDark ? '#F0EEFF' : '#16163A';
  const sub         = isDark ? 'rgba(240,238,255,0.45)' : '#6B7280';
  const divider     = isDark ? 'rgba(255,255,255,0.08)' : '#EFEFEF';
  const googleBg    = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const googleBorder = isDark ? 'rgba(255,255,255,0.10)' : '#E0E0E0';
  const devBg       = isDark ? 'rgba(255,255,255,0.04)' : '#F5F4FF';
  const devBorder   = isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.20)';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#16163A', '#2D1B6E', '#6C63FF']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.orb, { top: -80, right: -80 }]} />
      <View style={[styles.orb2, { bottom: '38%', left: -60 }]} />

      <View style={styles.column}>

        <SafeAreaView edges={['top']} style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.hero}>
          <LinearGradient
            colors={['#8B5CF6', '#FF6B9D']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoLetter}>S</Text>
          </LinearGradient>
          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in to your family hub</Text>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            bounces={false}
            overScrollMode="never"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.sheet, { backgroundColor: cardBg }]}>

              {/* Identifier — email or username */}
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons name="person-outline" size={17} color="#8B5CF6" />
                <TextInput
                  style={[styles.input, { color: txt }]}
                  placeholder="Email or username"
                  placeholderTextColor={sub}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>

              {/* Password */}
              <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Ionicons name="lock-closed-outline" size={17} color="#8B5CF6" />
                <TextInput
                  style={[styles.input, { color: txt }]}
                  placeholder="Password"
                  placeholderTextColor={sub}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(s => !s)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={sub} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              ) : null}

              {/* Sign In */}
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6', '#FF6B9D']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.btnGradient, { opacity: loading ? 0.7 : 1 }]}
              >
                <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
                  <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
                </TouchableOpacity>
              </LinearGradient>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: divider }]} />
                <Text style={[styles.dividerTxt, { color: sub }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: divider }]} />
              </View>

              {/* Google */}
              <TouchableOpacity
                style={[styles.googleBtn, { backgroundColor: googleBg, borderColor: googleBorder }]}
                onPress={() => promptGoogleAsync()}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.googleTxt, { color: txt }]}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Sign Up link */}
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.linkWrap}>
                <Text style={[styles.link, { color: sub }]}>
                  Don't have an account?{'  '}
                  <Text style={styles.linkBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              {/* ── Dev Quick Login ─────────────────────────────────────────── */}
              <View style={[styles.devWrap, { backgroundColor: devBg, borderColor: devBorder }]}>
                <TouchableOpacity
                  style={styles.devHeader}
                  onPress={() => setDevOpen(o => !o)}
                  activeOpacity={0.8}
                >
                  <View style={styles.devHeaderLeft}>
                    <Ionicons name="flash" size={12} color="#6C63FF" />
                    <Text style={[styles.devTitle, { color: txt }]}>Quick Login</Text>
                  </View>
                  <Ionicons
                    name={devOpen ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={sub}
                  />
                </TouchableOpacity>

                {devOpen && (
                  <View style={styles.devGrid}>
                    {DEV_ACCOUNTS.map((acc) => (
                      <TouchableOpacity
                        key={acc.username}
                        style={[styles.devChip, { borderColor: acc.color + '40', backgroundColor: acc.color + '12' }]}
                        onPress={() => quickLogin(acc)}
                        activeOpacity={0.75}
                        disabled={loading}
                      >
                        <View style={[styles.devDot, { backgroundColor: acc.color }]} />
                        <Text style={[styles.devChipTxt, { color: txt }]}>{acc.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <SafeAreaView edges={['bottom']} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  orb: {
    position: 'absolute', borderRadius: 999,
    width: 260, height: 260,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orb2: {
    position: 'absolute', borderRadius: 999,
    width: 180, height: 180,
    backgroundColor: 'rgba(255,107,157,0.10)',
  },

  column: { flex: 1, flexDirection: 'column' },

  backRow: { paddingHorizontal: 24, paddingTop: 8 },
  back: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    gap: 10,
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
    marginBottom: 4,
  },
  logoLetter: { color: '#fff', fontSize: 30, fontWeight: '900' },
  h1: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 14 },

  forgot: { fontSize: 12, fontWeight: '600', color: '#8B5CF6' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,107,0.10)',
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10,
  },
  errorTxt: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },

  btnGradient: {
    borderRadius: 13,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.38, shadowRadius: 12, elevation: 6,
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerTxt: { fontSize: 11, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 13, borderWidth: 1,
  },
  googleG: { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleTxt: { fontSize: 14, fontWeight: '600' },

  linkWrap: { alignItems: 'center' },
  link: { fontSize: 13 },
  linkBold: { color: '#6C63FF', fontWeight: '700' },

  // Dev panel
  devWrap: {
    borderRadius: 12, borderWidth: 1,
    overflow: 'hidden',
  },
  devHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  devHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  devTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  devGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 12, paddingBottom: 12,
  },
  devChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  devDot: { width: 7, height: 7, borderRadius: 4 },
  devChipTxt: { fontSize: 12, fontWeight: '600' },
});
