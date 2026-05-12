import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  createAnimatedComponent,
  Easing,
} from 'react-native-reanimated';

const AnimatedView = createAnimatedComponent(View);

export default function PulseButton({ onPress, size = 110 }) {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.6);
  const opacity2 = useSharedValue(0.4);

  useEffect(() => {
    scale1.value = withRepeat(
      withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 0 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      false
    );
    scale2.value = withRepeat(
      withTiming(1.9, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(0, { duration: 1600 })
      ),
      -1,
      false
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2 }]}>
      <AnimatedView style={[styles.ring, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#FF6B6B' }, ring2Style]} />
      <AnimatedView style={[styles.ring, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#FF6B6B' }, ring1Style]} />
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
      >
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
