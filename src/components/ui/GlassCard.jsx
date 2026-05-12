import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function GlassCard({ children, style }) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(108,99,255,0.12)',
          shadowColor: isDark ? '#000' : '#6C63FF',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
});
