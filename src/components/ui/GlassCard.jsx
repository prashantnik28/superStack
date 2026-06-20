import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

export default function GlassCard({ children, style, intensity }) {
  const { isDark, radius } = useTheme();

  if (!isDark) {
    return (
      <View style={[styles.lightShadow, { borderRadius: radius }]}>
        <View style={[styles.inner, { borderRadius: radius }, style]}>
          {children}
        </View>
      </View>
    );
  }

  const blur = intensity ?? 30;
  return (
    <View style={[styles.darkShadow, { borderRadius: radius }]}>
      <View style={[styles.inner, styles.darkInner, { borderRadius: radius }, style]}>
        {Platform.OS === 'ios' && (
          <>
            <BlurView intensity={blur} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(12,8,28,0.44)' }]} />
          </>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lightShadow: {
    shadowColor: '#4A5B8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  inner: {
    overflow: 'hidden',
  },
  darkInner: {
    borderWidth: 0.6,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: Platform.OS !== 'ios' ? 'rgba(255,255,255,0.07)' : 'transparent',
  },
});
