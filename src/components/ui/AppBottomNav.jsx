import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppBottomNav({
  tabs,
  // Accept either a function (isActive) or a string (active) for flexibility
  isActive,
  active,
  onPress,
  onAdd,
  isDark,
  accentColor = '#6C63FF',
}) {
  const insets = useSafeAreaInsets();
  const bg     = isDark ? '#111118' : '#FFFFFF';
  const muted  = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  // Supports both isActive(fn) from the master layout and active(string) from screen-local navs
  const checkActive = (tab) =>
    isActive ? isActive(tab) : (tab.id ?? tab.label) === active;

  return (
    <View
      style={[
        S.bar,
        {
          backgroundColor: bg,
          borderTopColor: border,
          paddingBottom: (insets.bottom || 0) + 6,
        },
      ]}
    >
      {tabs.map((tab, i) => {
        if (tab.center) {
          // Centre with no icon defined → home-style accent circle (+)
          if (!tab.icon) {
            return (
              <TouchableOpacity
                key="center"
                onPress={tab.route ? () => onPress(tab) : onAdd}
                activeOpacity={0.75}
                style={S.item}
              >
                <View style={[S.circle, { backgroundColor: accentColor }]}>
                  <Ionicons name="add" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }

          // Centre with icon defined → flat icon+label (e.g. Kitchen Scan)
          const on    = tab.route ? checkActive(tab) : false;
          const color = on ? accentColor : muted;
          return (
            <TouchableOpacity
              key="center"
              onPress={tab.route ? () => onPress(tab) : onAdd}
              activeOpacity={0.7}
              style={S.item}
            >
              <Ionicons
                name={on ? (tab.iconOn ?? tab.icon) : tab.icon}
                size={23}
                color={color}
              />
              <Text style={[S.lbl, { color, fontWeight: on ? '700' : '500' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        // Regular tab
        const on    = checkActive(tab);
        const color = on ? accentColor : muted;
        return (
          <TouchableOpacity
            key={tab.id ?? tab.label ?? i}
            onPress={() => onPress(tab)}
            activeOpacity={0.7}
            style={S.item}
          >
            <Ionicons
              name={on ? (tab.iconOn ?? tab.icon) : (tab.iconOff ?? tab.icon)}
              size={22}
              color={color}
            />
            <Text style={[S.lbl, { color, fontWeight: on ? '700' : '500' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const S = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 2,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbl: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
});
