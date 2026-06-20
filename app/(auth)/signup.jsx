import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthStore } from '../../src/stores/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '806565486713-3s682bf657vmb0omlfqplh7r55941plq.apps.googleusercontent.com';
const redirectUri = 'https://auth.expo.io/@prashantnik/smartstack';

// ── Data ──────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { emoji: '🇮🇳', name: 'India',          dial: '+91' },
  { emoji: '🇺🇸', name: 'United States',   dial: '+1'  },
  { emoji: '🇬🇧', name: 'United Kingdom',  dial: '+44' },
  { emoji: '🇦🇺', name: 'Australia',       dial: '+61' },
  { emoji: '🇨🇦', name: 'Canada',          dial: '+1'  },
  { emoji: '🇸🇬', name: 'Singapore',       dial: '+65' },
  { emoji: '🇦🇪', name: 'UAE',             dial: '+971'},
  { emoji: '🇸🇦', name: 'Saudi Arabia',    dial: '+966'},
  { emoji: '🇩🇪', name: 'Germany',         dial: '+49' },
  { emoji: '🇫🇷', name: 'France',          dial: '+33' },
  { emoji: '🇮🇹', name: 'Italy',           dial: '+39' },
  { emoji: '🇪🇸', name: 'Spain',           dial: '+34' },
  { emoji: '🇯🇵', name: 'Japan',           dial: '+81' },
  { emoji: '🇨🇳', name: 'China',           dial: '+86' },
  { emoji: '🇰🇷', name: 'South Korea',     dial: '+82' },
  { emoji: '🇳🇿', name: 'New Zealand',     dial: '+64' },
  { emoji: '🇿🇦', name: 'South Africa',    dial: '+27' },
  { emoji: '🇳🇬', name: 'Nigeria',         dial: '+234'},
  { emoji: '🇧🇷', name: 'Brazil',          dial: '+55' },
  { emoji: '🇲🇽', name: 'Mexico',          dial: '+52' },
  { emoji: '🇵🇰', name: 'Pakistan',        dial: '+92' },
  { emoji: '🇧🇩', name: 'Bangladesh',      dial: '+880'},
  { emoji: '🇱🇰', name: 'Sri Lanka',       dial: '+94' },
  { emoji: '🇳🇵', name: 'Nepal',           dial: '+977'},
  { emoji: '🇷🇺', name: 'Russia',          dial: '+7'  },
];

const GENDERS = ['Male', 'Female', 'Non-binary'];

// Instagram-style username format (no API uniqueness check — backend needed for that)
function isValidUsernameFormat(val) {
  if (!val || val.length < 3 || val.length > 30) return false;
  if (!/^[a-z0-9._]+$/.test(val)) return false;
  if (val.startsWith('.') || val.endsWith('.')) return false;
  if (val.includes('..')) return false;
  return true;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SignupScreen() {
  const { isDark } = useTheme();
  const { register, googleLogin } = useAuthStore();

  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [gender, setGender]         = useState('');
  const [country, setCountry]       = useState(COUNTRIES[0]);
  const [countryModal, setCountryModal] = useState(false);
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');
  const [username, setUsername]     = useState('');
  const [dobDay, setDobDay]         = useState('');
  const [dobMonth, setDobMonth]     = useState('');
  const [dobYear, setDobYear]       = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

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
      router.replace('/(app)/overview');
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const usernameStatus = username.length === 0 ? null : isValidUsernameFormat(username);

  const handleSignup = async () => {
    if (!firstName.trim())                           { setError('First name is required'); return; }
    if (!phone.trim())                               { setError('Phone number is required'); return; }
    if (!email.trim())                               { setError('Email is required'); return; }
    if (!username.trim())                            { setError('Username is required'); return; }
    if (!isValidUsernameFormat(username))            { setError('Invalid username format (3–30 chars, lowercase/numbers/dots/underscores, no leading or trailing dots)'); return; }
    if (!dobDay || !dobMonth || !dobYear || dobYear.length < 4) { setError('Please enter a valid date of birth'); return; }
    if (!password)                                   { setError('Password is required'); return; }
    if (password.length < 6)                         { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');
    try {
      await register({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        name:      [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
        gender:    gender || null,
        phone:     `${country.dial}${phone.trim()}`,
        email:     email.trim(),
        username:  username.trim(),
        dob:       `${dobDay.padStart(2,'0')}/${dobMonth.padStart(2,'0')}/${dobYear}`,
        password,
      });
      router.replace('/(app)/overview');
    } catch (e) {
      setError(e?.response?.data?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg       = isDark ? '#111118' : '#FFFFFF';
  const inputBg      = isDark ? 'rgba(255,255,255,0.06)' : '#F7F7FB';
  const inputBorder  = isDark ? 'rgba(255,255,255,0.10)' : '#E8E6F0';
  const txt          = isDark ? '#F0EEFF' : '#16163A';
  const sub          = isDark ? 'rgba(240,238,255,0.45)' : '#6B7280';
  const divider      = isDark ? 'rgba(255,255,255,0.08)' : '#EFEFEF';
  const googleBg     = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const googleBorder = isDark ? 'rgba(255,255,255,0.10)' : '#E0E0E0';
  const labelColor   = isDark ? 'rgba(240,238,255,0.55)' : '#9CA3AF';
  const modalBg      = isDark ? '#1C1C1E' : '#FFFFFF';
  const modalBorder  = isDark ? 'rgba(255,255,255,0.08)' : '#EFEFEF';
  const genderChipBg = isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F8';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradient header */}
      <LinearGradient
        colors={['#1a0533', '#6C1060', '#FF6B9D']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerOrb} />
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={['#FF6B9D', '#8B5CF6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Text style={styles.logoLetter}>S</Text>
            </LinearGradient>
          </View>
          <Text style={styles.h1}>Create Account</Text>
          <Text style={styles.headerSub}>Join smartStack today</Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Scrollable form card */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.cardOuter}>
        <ScrollView
          style={[styles.card, { backgroundColor: cardBg }]}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >

          {/* ── Name row ── */}
          <View style={styles.row}>
            <View style={[styles.inputWrap, styles.flex1, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Ionicons name="person-outline" size={16} color="#8B5CF6" />
              <TextInput
                style={[styles.input, { color: txt }]}
                placeholder="First name *"
                placeholderTextColor={sub}
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputWrap, styles.flex1, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TextInput
                style={[styles.input, { color: txt }]}
                placeholder="Last name"
                placeholderTextColor={sub}
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* ── Gender ── */}
          <View>
            <Text style={[styles.fieldLabel, { color: labelColor }]}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map(g => {
                const active = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(active ? '' : g)}
                    style={[
                      styles.genderChip,
                      { backgroundColor: active ? '#6C63FF' : genderChipBg },
                      active && styles.genderChipActive,
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.genderChipTxt, { color: active ? '#fff' : sub }]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Phone ── */}
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <Ionicons name="call-outline" size={16} color="#4CAF82" />
            <TouchableOpacity
              onPress={() => setCountryModal(true)}
              style={styles.codeBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.codeEmoji]}>{country.emoji}</Text>
              <Text style={[styles.codeTxt, { color: txt }]}>{country.dial}</Text>
              <Ionicons name="chevron-down" size={11} color={sub} />
            </TouchableOpacity>
            <View style={[styles.codeSep, { backgroundColor: inputBorder }]} />
            <TextInput
              style={[styles.input, { color: txt }]}
              placeholder="Phone number *"
              placeholderTextColor={sub}
              keyboardType="phone-pad"
              maxLength={15}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* ── Email ── */}
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <Ionicons name="mail-outline" size={16} color="#FF6B9D" />
            <TextInput
              style={[styles.input, { color: txt }]}
              placeholder="Email address *"
              placeholderTextColor={sub}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* ── Username ── */}
          <View>
            <View style={[styles.inputWrap, {
              backgroundColor: inputBg,
              borderColor: usernameStatus === true ? '#4CAF82' : usernameStatus === false ? '#FF6B6B' : inputBorder,
            }]}>
              <Text style={[styles.atSign, { color: '#6C63FF' }]}>@</Text>
              <TextInput
                style={[styles.input, { color: txt }]}
                placeholder="username *"
                placeholderTextColor={sub}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={v => setUsername(v.toLowerCase().replace(/\s/g, ''))}
              />
              {usernameStatus === true  && <Ionicons name="checkmark-circle" size={17} color="#4CAF82" />}
              {usernameStatus === false && <Ionicons name="close-circle"     size={17} color="#FF6B6B" />}
            </View>
            <Text style={[styles.hint, {
              color: usernameStatus === false ? '#FF6B6B' : labelColor,
            }]}>
              {usernameStatus === false
                ? '3–30 chars · lowercase, numbers, dots, underscores · no leading/trailing dots'
                : 'Unique username like Instagram (e.g. prashant.singh28)'}
            </Text>
          </View>

          {/* ── Date of Birth ── */}
          <View>
            <Text style={[styles.fieldLabel, { color: labelColor }]}>Date of Birth *</Text>
            <View style={styles.dobRow}>
              <View style={[styles.inputWrap, styles.dobSegment, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, styles.dobInput, { color: txt }]}
                  placeholder="DD"
                  placeholderTextColor={sub}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobDay}
                  onChangeText={setDobDay}
                />
              </View>
              <Text style={[styles.dobSlash, { color: sub }]}>/</Text>
              <View style={[styles.inputWrap, styles.dobSegment, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, styles.dobInput, { color: txt }]}
                  placeholder="MM"
                  placeholderTextColor={sub}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                />
              </View>
              <Text style={[styles.dobSlash, { color: sub }]}>/</Text>
              <View style={[styles.inputWrap, styles.dobYearWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[styles.input, styles.dobInput, { color: txt }]}
                  placeholder="YYYY"
                  placeholderTextColor={sub}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={dobYear}
                  onChangeText={setDobYear}
                />
              </View>
            </View>
          </View>

          {/* ── Password ── */}
          <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
            <Ionicons name="lock-closed-outline" size={16} color="#FFB347" />
            <TextInput
              style={[styles.input, { color: txt }]}
              placeholder="Password * (min 6 chars)"
              placeholderTextColor={sub}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(s => !s)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={sub} />
            </TouchableOpacity>
          </View>

          {/* ── Error ── */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* ── Create Account ── */}
          <LinearGradient
            colors={['#FF6B9D', '#8B5CF6', '#6C63FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.btnGradient, { opacity: loading ? 0.7 : 1 }]}
          >
            <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading} activeOpacity={0.88}>
              <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Divider ── */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: divider }]} />
            <Text style={[styles.dividerTxt, { color: sub }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: divider }]} />
          </View>

          {/* ── Google ── */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: googleBg, borderColor: googleBorder }]}
            onPress={() => promptGoogleAsync()}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={[styles.googleTxt, { color: txt }]}>Continue with Google</Text>
          </TouchableOpacity>

          {/* ── Sign In link ── */}
          <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
            <Text style={[styles.link, { color: sub }]}>
              Already have an account?{'  '}
              <Text style={styles.linkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Country picker modal ── */}
      <Modal
        visible={countryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModal(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: modalBg }]}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: txt }]}>Select Country</Text>
            <TouchableOpacity onPress={() => setCountryModal(false)}>
              <Ionicons name="close" size={22} color={sub} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={COUNTRIES}
            keyExtractor={item => item.name}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.rowSep, { backgroundColor: modalBorder }]} />
            )}
            renderItem={({ item }) => {
              const selected = item.name === country.name;
              return (
                <TouchableOpacity
                  style={[styles.countryRow, selected && { backgroundColor: '#6C63FF12' }]}
                  onPress={() => { setCountry(item); setCountryModal(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text style={[styles.countryName, { color: txt }]}>{item.name}</Text>
                  <Text style={[styles.countryDial, { color: sub }]}>{item.dial}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={18} color="#6C63FF" />}
                </TouchableOpacity>
              );
            }}
          />
          <SafeAreaView edges={['bottom']} />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FF6B9D' },

  header: { paddingBottom: 28 },
  headerOrb: {
    position: 'absolute', borderRadius: 999,
    width: 200, height: 200, top: -55, right: -55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerInner: { paddingHorizontal: 24, paddingTop: 4 },
  back: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  logoBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  logoLetter: { color: '#fff', fontSize: 24, fontWeight: '900' },
  h1: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginTop: 4 },

  cardOuter: { flex: 1, marginTop: -20 },
  card: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  cardContent: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 40, gap: 12 },

  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 13, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 14 },

  // Gender
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 1 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1, alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  genderChipActive: {
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  genderChipTxt: { fontSize: 13, fontWeight: '600' },

  // Phone country code
  codeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  codeEmoji: { fontSize: 16 },
  codeTxt: { fontSize: 13, fontWeight: '700' },
  codeSep: { width: 1, height: 18, marginHorizontal: 4 },

  atSign: { fontSize: 15, fontWeight: '800' },

  // Username hint
  hint: { fontSize: 11, marginTop: 5, marginLeft: 3, lineHeight: 16 },

  // DOB
  dobRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dobSegment: { flex: 1 },
  dobYearWrap: { flex: 1.6 },
  dobInput: { textAlign: 'center' },
  dobSlash: { fontSize: 18, fontWeight: '300' },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,107,0.10)',
    paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10,
  },
  errorTxt: { color: '#FF6B6B', fontSize: 12, fontWeight: '600', flex: 1 },

  // Buttons
  btnGradient: {
    borderRadius: 12, marginTop: 4,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerTxt: { fontSize: 11, fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 13, borderRadius: 12, borderWidth: 1,
  },
  googleG: { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleTxt: { fontSize: 14, fontWeight: '600' },

  linkWrap: { alignItems: 'center' },
  link: { fontSize: 13 },
  linkBold: { color: '#FF6B9D', fontWeight: '700' },

  // Country modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '72%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 14,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(150,150,150,0.3)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  countryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13, gap: 12,
  },
  countryEmoji: { fontSize: 22 },
  countryName: { flex: 1, fontSize: 14, fontWeight: '500' },
  countryDial: { fontSize: 13, fontWeight: '600' },
  rowSep: { height: 1, marginLeft: 56 },
});
