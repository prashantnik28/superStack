import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS, SPACING } from '../lib/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const [mode, setMode] = useState('light');

  useEffect(() => {
    if (scheme === 'dark' || scheme === 'light') setMode(scheme);
  }, [scheme]);

  const toggleTheme = () => setMode(m => m === 'light' ? 'dark' : 'light');
  const colors = COLORS[mode] || COLORS.light;

  return (
    <ThemeContext.Provider value={{ colors, spacing: SPACING, isDark: mode === 'dark', mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
