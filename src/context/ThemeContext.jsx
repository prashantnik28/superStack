import React, { createContext, useContext, useState } from 'react';
import { COLORS, SPACING } from '../lib/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [radius, setRadius] = useState(10);
  const toggleTheme = () => setMode(m => m === 'light' ? 'dark' : 'light');
  const colors = COLORS[mode] || COLORS.light;

  return (
    <ThemeContext.Provider value={{ colors, spacing: SPACING, isDark: mode === 'dark', mode, toggleTheme, radius, setRadius }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
