import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '1', icon: 'people', colors: ['#6C63FF', '#FF6B9D'], title: 'One App for\nYour Whole Family', sub: 'Track, manage and organise your family life from one beautiful app.' },
  { id: '2', icon: 'shield-checkmark', colors: ['#4CAF82', '#6C63FF'], title: 'Keep Everyone\nSafe', sub: 'Real-time GPS, school check-ins and one-tap SOS so you\'re always in the know.' },
  { id: '3', icon: 'sparkles', colors: ['#FF6B9D', '#FFB347'], title: 'Smart Suggestions\nEvery Day', sub: 'AI-powered outfit picks and pantry management keep life running smoothly.' },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);

  const next = () => {
    if (idx < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: idx + 1, animated: true });
      setIdx(idx + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <LinearGradient colors={item.colors} style={[styles.slide, { width }]}>
            <SafeAreaView style={styles.slideInner}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={80} color="rgba(255,255,255,0.95)" />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </SafeAreaView>
          </LinearGradient>
        )}
      />
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === idx ? colors.primary : colors.border, width: i === idx ? 24 : 8 }]} />
          ))}
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={next}>
          <Text style={styles.btnText}>{idx === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={[styles.skip, { color: colors.textSecondary }]}>
            Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: { flex: 1 },
  slideInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 40 },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
  footer: { padding: 28, paddingBottom: 44, alignItems: 'center', gap: 18 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  btn: { width: '100%', paddingVertical: 17, borderRadius: 16, alignItems: 'center', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { fontSize: 13 },
});
