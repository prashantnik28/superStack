import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

export default function PulseButton({ onPress, size = 110 }) {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const ring1 = Animated.loop(
      Animated.parallel([
        Animated.timing(scale1, { toValue: 1.6, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity1, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    const ring2 = Animated.loop(
      Animated.parallel([
        Animated.timing(scale2, { toValue: 1.9, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity2, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    ring1.start();
    ring2.start();
    return () => { ring1.stop(); ring2.stop(); };
  }, []);

  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2 }]}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#FF6B6B', transform: [{ scale: scale2 }], opacity: opacity2 }]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#FF6B6B', transform: [{ scale: scale1 }], opacity: opacity1 }]} />
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.label}>SOS</Text>
        <Text style={styles.sub}>Hold to send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  btn: {
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 14,
  },
  label: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 2, fontWeight: '600' },
});
