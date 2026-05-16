import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

export default function GlassCard({ children, style, intensity }) {
  const { isDark } = useTheme();

  if (!isDark) {
    return (
      <View style={styles.lightShadow}>
        <View style={[styles.inner, styles.lightInner, style]}>
          {children}
        </View>
      </View>
    );
  }

  const blur = intensity ?? 30;
  return (
    <View style={styles.darkShadow}>
      <View style={[styles.inner, styles.darkInner, style]}>
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

const RADIUS = 14;

const styles = StyleSheet.create({
  lightShadow: {
    borderRadius: RADIUS,
    shadowColor: '#4A5B8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  darkShadow: {
    borderRadius: RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  inner: {
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  lightInner: {
    backgroundColor: '#FFFFFF',
  },
  darkInner: {
    borderWidth: 0.6,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: Platform.OS !== 'ios' ? 'rgba(255,255,255,0.07)' : 'transparent',
  },
});
