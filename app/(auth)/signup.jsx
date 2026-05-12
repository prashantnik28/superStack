import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import GlassCard from '../../src/components/ui/GlassCard';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    login({ name: name || 'User', email, id: '1' }, 'token-123');
    router.replace('/(app)/dashboard');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.h1, { color: colors.textPrimary }]}>Create account</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Join smartStack today</Text>

          <GlassCard style={styles.form}>
            {[
              { label: 'Full Name', value: name, set: setName, placeholder: 'Priya Sharma' },
              { label: 'Email', value: email, set: setEmail, placeholder: 'priya@example.com', keyboard: 'email-address' },
              { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', secure: true },
            ].map(f => (
              <View key={f.label}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{f.label}</Text>
                <TextInput style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]} placeholder={f.placeholder} placeholderTextColor={colors.textSecondary} keyboardType={f.keyboard || 'default'} autoCapitalize={f.keyboard ? 'none' : 'words'} secureTextEntry={f.secure} value={f.value} onChangeText={f.set} />
              </View>
            ))}
          </GlassCard>

          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleSignup}>
            <Text style={styles.btnText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={[styles.link, { color: colors.textSecondary }]}>
              Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text>
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
  btn: { paddingVertical: 17, borderRadius: 16, alignItems: 'center', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { fontSize: 14 },
});
