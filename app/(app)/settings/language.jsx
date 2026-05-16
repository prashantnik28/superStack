import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const ACCENT = '#6C63FF';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸', region: 'United States' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'India' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', region: 'India' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'India' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳', region: 'India' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳', region: 'India' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', region: 'India' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'Spain' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'Germany' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'Saudi Arabia' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳', region: 'China' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'Japan' },
];

export default function LanguageScreen() {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState('en');

  const txt = colors.textPrimary;
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const currentLang = LANGUAGES.find(l => l.code === selected);

  const applyLanguage = () => {
    if (selected === 'en') {
      Alert.alert('Language', 'English is already applied.');
    } else {
      Alert.alert('Language Applied', `${currentLang.label} (${currentLang.native}) has been set. Restart the app for full effect.`, [{ text: 'OK' }]);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Current selection banner */}
      <GlassCard style={styles.currentBanner}>
        <Text style={styles.currentFlag}>{currentLang.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.currentLabel, { color: txt }]}>Current Language</Text>
          <Text style={[styles.currentLang, { color: ACCENT }]}>{currentLang.label} — {currentLang.native}</Text>
        </View>
        <View style={[styles.checkBadge, { backgroundColor: ACCENT + '20' }]}>
          <Ionicons name="checkmark-circle" size={20} color={ACCENT} />
        </View>
      </GlassCard>

      <Text style={[styles.secLabel, { color: sub }]}>SELECT LANGUAGE</Text>
      <GlassCard style={styles.card}>
        {LANGUAGES.map((lang, i) => {
          const isSelected = selected === lang.code;
          return (
            <View key={lang.code}>
              {i > 0 && <View style={[styles.div, { backgroundColor: divColor }]} />}
              <TouchableOpacity
                style={[styles.langRow, isSelected && { backgroundColor: isDark ? ACCENT + '12' : ACCENT + '08' }]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.75}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langLabel, { color: isSelected ? ACCENT : txt, fontWeight: isSelected ? '700' : '600' }]}>
                    {lang.label}
                  </Text>
                  <Text style={[styles.langNative, { color: sub }]}>{lang.native} · {lang.region}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={ACCENT} />}
              </TouchableOpacity>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={16} color={sub} />
        <Text style={[styles.noteTxt, { color: sub }]}>
          Family names, content and dates are not affected by this setting. Some features may only be available in English.
        </Text>
      </GlassCard>

      <TouchableOpacity style={[styles.applyBtn, { backgroundColor: ACCENT }]} onPress={applyLanguage} activeOpacity={0.85}>
        <Ionicons name="language" size={18} color="#fff" />
        <Text style={styles.applyTxt}>Apply Language</Text>
      </TouchableOpacity>

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 16, gap: 12 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  currentBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  currentFlag: { fontSize: 32 },
  currentLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  currentLang: { fontSize: 16, fontWeight: '800' },
  checkBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  card: { padding: 0 },
  div: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 14 },
  flag: { fontSize: 26 },
  langLabel: { fontSize: 14 },
  langNative: { fontSize: 11, marginTop: 2 },

  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  noteTxt: { flex: 1, fontSize: 12, lineHeight: 18 },

  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  applyTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
