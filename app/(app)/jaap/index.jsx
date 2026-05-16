import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  useWindowDimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/context/ThemeContext';

// ── Data ──────────────────────────────────────────────────────────────────────

const MANTRAS = [
  { id: '1', name: 'ॐ नमः शिवाय',       en: 'Om Namah Shivaya',        deity: 'Shiva',     color: '#8B5CF6' },
  { id: '2', name: 'हरे राम हरे कृष्ण', en: 'Hare Rama Hare Krishna',   deity: 'Vishnu',    color: '#FFB347' },
  { id: '3', name: 'ॐ मणि पद्मे हुं',   en: 'Om Mani Padme Hum',        deity: 'Buddha',    color: '#4CAF82' },
  { id: '4', name: 'राम राम',            en: 'Ram Ram',                  deity: 'Ram',       color: '#FF6B9D' },
  { id: '5', name: 'ॐ',                  en: 'Om',                       deity: 'Universal', color: '#6C63FF' },
  { id: '6', name: 'जय श्री राम',        en: 'Jai Shri Ram',             deity: 'Ram',       color: '#E67E22' },
  { id: '7', name: 'ॐ गं गणपतये नमः',   en: 'Om Gan Ganapataye Namah',  deity: 'Ganesha',   color: '#EF4444' },
  { id: '8', name: 'सोऽहं',             en: "So'ham",                    deity: 'Self',      color: '#06B6D4' },
];

const TARGETS = [11, 21, 54, 108, 1008];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function JaapScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  // ── State ──
  const [count,      setCount]      = useState(0);
  const [rounds,     setRounds]     = useState(0);
  const [total,      setTotal]      = useState(0);
  const [mantra,     setMantra]     = useState(MANTRAS[0]);
  const [target,     setTarget]     = useState(108);
  const [elapsed,    setElapsed]    = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  // Refs prevent stale closures during rapid tapping
  const countRef  = useRef(0);
  const roundsRef = useRef(0);
  const totalRef  = useRef(0);

  // ── Geometry ──
  const RING_D     = Math.min(screenW - 48, 360);
  const CENTER     = RING_D / 2;
  const BEAD_ORBIT = CENTER - 12;
  const TAP_R      = CENTER - 46;
  const BEAD_R     = Math.max(1.8, Math.min(4.5, (2 * Math.PI * BEAD_ORBIT) / (target * 3.4)));
  const CIRCUM     = 2 * Math.PI * BEAD_ORBIT;

  // ── Bead positions ──
  const beads = useMemo(() => {
    const n = Math.min(target, 108);
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { x: CENTER + BEAD_ORBIT * Math.cos(a), y: CENTER + BEAD_ORBIT * Math.sin(a) };
    });
  }, [target, CENTER, BEAD_ORBIT]);

  // ── Animated values ──
  const tapScale   = useRef(new Animated.Value(1)).current;
  const glowOp     = useRef(new Animated.Value(0.22)).current;
  const r1Scale    = useRef(new Animated.Value(1)).current;
  const r1Op       = useRef(new Animated.Value(0)).current;
  const r2Scale    = useRef(new Animated.Value(1)).current;
  const r2Op       = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  // ── Timer ──
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Reset count when target changes
  useEffect(() => {
    countRef.current = 0;
    roundsRef.current = 0;
    setCount(0);
    setRounds(0);
  }, [target]);

  // ── Ripple burst on round completion ──
  const fireRipple = useCallback(() => {
    r1Scale.setValue(1);
    r1Op.setValue(0.75);
    Animated.parallel([
      Animated.timing(r1Scale, { toValue: 2.6, duration: 750, useNativeDriver: true }),
      Animated.timing(r1Op,    { toValue: 0,   duration: 750, useNativeDriver: true }),
    ]).start();

    r2Scale.setValue(1);
    r2Op.setValue(0);
    Animated.sequence([
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(r2Scale, { toValue: 3.2, duration: 800, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(r2Op, { toValue: 0.45, duration: 60,  useNativeDriver: true }),
          Animated.timing(r2Op, { toValue: 0,    duration: 740, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    Animated.sequence([
      Animated.spring(countScale, { toValue: 1.2, friction: 3, tension: 300, useNativeDriver: true }),
      Animated.spring(countScale, { toValue: 1,   friction: 6, tension: 200, useNativeDriver: true }),
    ]).start();
  }, [r1Scale, r1Op, r2Scale, r2Op, countScale]);

  // ── Tap handler ──
  const handleTap = useCallback(() => {
    Animated.sequence([
      Animated.timing(tapScale, { toValue: 0.91, duration: 60,  useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1,    friction: 5, tension: 220, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(glowOp, { toValue: 0.7,  duration: 80,  useNativeDriver: true }),
      Animated.timing(glowOp, { toValue: 0.22, duration: 700, useNativeDriver: true }),
    ]).start();

    totalRef.current += 1;
    countRef.current += 1;
    setTotal(totalRef.current);

    if (countRef.current >= target) {
      roundsRef.current += 1;
      countRef.current = 0;
      setRounds(roundsRef.current);
      setCount(0);
      fireRipple();
    } else {
      setCount(countRef.current);
    }
  }, [target, tapScale, glowOp, fireRipple]);

  // ── Long-press to undo ──
  const handleUndo = useCallback(() => {
    if (countRef.current > 0) {
      countRef.current -= 1;
      totalRef.current = Math.max(0, totalRef.current - 1);
      setCount(countRef.current);
      setTotal(totalRef.current);
    } else if (roundsRef.current > 0) {
      roundsRef.current -= 1;
      countRef.current = target - 1;
      totalRef.current = Math.max(0, totalRef.current - 1);
      setRounds(roundsRef.current);
      setCount(countRef.current);
      setTotal(totalRef.current);
    }
  }, [target]);

  const handleReset = () => {
    countRef.current = 0; roundsRef.current = 0; totalRef.current = 0;
    setCount(0); setRounds(0); setTotal(0); setElapsed(0);
  };

  const handleTargetChange = (t) => {
    countRef.current = 0; roundsRef.current = 0;
    setTarget(t);
  };

  // ── Helpers ──
  const progress   = count / target;
  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const roundWord  = (n) =>
    target === 108 ? (n === 1 ? 'mala' : 'malas') : (n === 1 ? 'round' : 'rounds');

  const txt = isDark ? '#F0EEFF' : '#16163A';
  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const dim = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bg  = isDark
    ? ['#0D0B1A', '#1A1035', '#0D0B1A']
    : ['#FFF8F0', '#FFF3E0', '#FFF8F0'];

  const hintText = count === 0 && rounds === 0
    ? 'tap to begin'
    : count === 0
      ? `${rounds} ${roundWord(rounds)} complete ✓`
      : `${target - count} remaining`;

  return (
    <View style={styles.flex}>
      <LinearGradient colors={bg} style={styles.flex} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}>

        {/* ── Mantra selector ── */}
        <View style={styles.topArea}>
          <TouchableOpacity
            style={[styles.mantraBtn, { backgroundColor: mantra.color + '18' }]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.mantraDot, { backgroundColor: mantra.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.mantraName, { color: mantra.color }]} numberOfLines={1}>{mantra.name}</Text>
              <Text style={[styles.mantraEn,   { color: sub }]}          numberOfLines={1}>{mantra.en} · {mantra.deity}</Text>
            </View>
            <View style={[styles.changeChip, { backgroundColor: mantra.color + '20' }]}>
              <Text style={[styles.changeTxt, { color: mantra.color }]}>Change</Text>
              <Ionicons name="chevron-down" size={11} color={mantra.color} />
            </View>
          </TouchableOpacity>

          {/* Target chips */}
          <View style={styles.targetRow}>
            {TARGETS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.targetChip, { backgroundColor: target === t ? mantra.color : dim }]}
                onPress={() => handleTargetChange(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.targetNum, { color: target === t ? '#fff' : sub }]}>{t}</Text>
                {target === t && (
                  <Text style={styles.targetLbl}>beads</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Ring ── */}
        <View style={styles.ringArea}>
          {/* Ambient glow */}
          <Animated.View style={[
            styles.glow,
            {
              backgroundColor: mantra.color,
              width: RING_D * 1.25, height: RING_D * 1.25,
              borderRadius: RING_D * 0.625,
              opacity: glowOp,
            },
          ]} />

          {/* Ripple rings */}
          <Animated.View style={[
            styles.ripple,
            {
              borderColor: mantra.color + 'AA',
              width: TAP_R * 2, height: TAP_R * 2, borderRadius: TAP_R,
              transform: [{ scale: r1Scale }],
              opacity: r1Op,
            },
          ]} />
          <Animated.View style={[
            styles.ripple,
            {
              borderColor: mantra.color + '66',
              width: TAP_R * 2, height: TAP_R * 2, borderRadius: TAP_R,
              transform: [{ scale: r2Scale }],
              opacity: r2Op,
            },
          ]} />

          {/* Bead ring + tap button */}
          <Animated.View style={[{ width: RING_D, height: RING_D }, { transform: [{ scale: tapScale }] }]}>
            <Svg width={RING_D} height={RING_D} style={StyleSheet.absoluteFill}>
              {/* Track */}
              <Circle
                cx={CENTER} cy={CENTER} r={BEAD_ORBIT}
                stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                strokeWidth={BEAD_R * 2 + 6}
                fill="none"
              />

              {target > 108 ? (
                /* Smooth arc for large targets */
                <>
                  <Circle
                    cx={CENTER} cy={CENTER} r={BEAD_ORBIT}
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
                    strokeWidth={BEAD_R * 2}
                    fill="none"
                  />
                  {count > 0 && (
                    <Circle
                      cx={CENTER} cy={CENTER} r={BEAD_ORBIT}
                      stroke={mantra.color}
                      strokeWidth={BEAD_R * 2 + 1}
                      fill="none"
                      strokeDasharray={CIRCUM}
                      strokeDashoffset={CIRCUM * (1 - progress)}
                      strokeLinecap="round"
                      rotation="-90"
                      origin={`${CENTER}, ${CENTER}`}
                    />
                  )}
                </>
              ) : (
                /* Individual beads for ≤ 108 */
                beads.map((b, i) => (
                  <Circle
                    key={i}
                    cx={b.x} cy={b.y}
                    r={i < count ? BEAD_R + 0.8 : BEAD_R}
                    fill={
                      i < count
                        ? mantra.color
                        : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.11)'
                    }
                  />
                ))
              )}
            </Svg>

            {/* Tap circle */}
            <TouchableOpacity
              style={[
                styles.tapCircle,
                {
                  width: TAP_R * 2, height: TAP_R * 2, borderRadius: TAP_R,
                  top: CENTER - TAP_R, left: CENTER - TAP_R,
                  borderColor: mantra.color + '28',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
                },
              ]}
              onPress={handleTap}
              onLongPress={handleUndo}
              delayLongPress={550}
              activeOpacity={1}
            >
              <Animated.Text style={[styles.countBig, { color: mantra.color, transform: [{ scale: countScale }] }]}>
                {count}
              </Animated.Text>
              <Text style={[styles.countSub, { color: sub }]}>{hintText}</Text>
              {rounds > 0 && (
                <View style={[styles.roundBadge, { backgroundColor: mantra.color + '1E' }]}>
                  <Ionicons name="checkmark-circle" size={11} color={mantra.color} />
                  <Text style={[styles.roundBadgeTxt, { color: mantra.color }]}>
                    {rounds} {roundWord(rounds)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.holdHint, { color: sub }]}>hold to undo · tap to count</Text>
        </View>

        {/* ── Stats bar ── */}
        <View style={[styles.statsArea, { paddingBottom: insets.bottom + 14 }]}>
          <View style={[styles.progressTrack, { backgroundColor: dim }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: mantra.color }]} />
          </View>

          <View style={styles.statsRow}>
            {[
              { label: target === 108 ? 'Malas' : 'Rounds', value: rounds },
              { label: 'Timer',      value: formatTime(elapsed) },
              { label: 'Total Taps', value: total },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[styles.statDiv, { backgroundColor: dim }]} />}
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: mantra.color }]}>{s.value}</Text>
                  <Text style={[styles.statLbl, { color: sub }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
            <View style={[styles.statDiv, { backgroundColor: dim }]} />
            <TouchableOpacity style={styles.statItem} onPress={handleReset} activeOpacity={0.7}>
              <Ionicons name="refresh" size={19} color={sub} />
              <Text style={[styles.statLbl, { color: sub }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* ── Mantra Picker ── */}
      <Modal visible={showPicker} animationType="slide" transparent statusBarTranslucent>
        <TouchableOpacity style={styles.overlay} onPress={() => setShowPicker(false)} activeOpacity={1}>
          <View
            style={[styles.sheet, { backgroundColor: isDark ? '#1A1035' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />
            <Text style={[styles.sheetTitle, { color: txt }]}>Choose Mantra</Text>
            {MANTRAS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.sheetItem,
                  { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                  mantra.id === m.id && { backgroundColor: m.color + '12' },
                ]}
                onPress={() => { setMantra(m); setShowPicker(false); }}
                activeOpacity={0.75}
              >
                <View style={[styles.sheetDot, { backgroundColor: m.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetName, { color: txt }]}>{m.name}</Text>
                  <Text style={[styles.sheetSub,  { color: sub }]}>{m.en} · {m.deity}</Text>
                </View>
                {mantra.id === m.id
                  ? <Ionicons name="checkmark-circle" size={20} color={m.color} />
                  : <View style={[styles.sheetArrow, { borderColor: m.color + '50' }]}>
                      <Ionicons name="chevron-forward" size={14} color={m.color} />
                    </View>
                }
              </TouchableOpacity>
            ))}
            <View style={{ height: 34 }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  topArea:    { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  mantraBtn:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  mantraDot:  { width: 10, height: 10, borderRadius: 5 },
  mantraName: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  mantraEn:   { fontSize: 11, marginTop: 1 },
  changeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  changeTxt:  { fontSize: 11, fontWeight: '700' },

  targetRow:  { flexDirection: 'row', gap: 7 },
  targetChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, gap: 1 },
  targetNum:  { fontSize: 13, fontWeight: '800' },
  targetLbl:  { fontSize: 7.5, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  ringArea:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  glow:       { position: 'absolute' },
  ripple:     { position: 'absolute', borderWidth: 1.5 },
  tapCircle:  { position: 'absolute', borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  countBig:   { fontSize: 72, fontWeight: '800', letterSpacing: -3, lineHeight: 80 },
  countSub:   { fontSize: 12, fontWeight: '500' },
  roundBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, marginTop: 2 },
  roundBadgeTxt: { fontSize: 11, fontWeight: '700' },
  holdHint:   { fontSize: 10, letterSpacing: 0.3 },

  statsArea:     { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  statsRow:      { flexDirection: 'row', alignItems: 'center' },
  statItem:      { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 3 },
  statVal:       { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:       { fontSize: 10, fontWeight: '600' },
  statDiv:       { width: 0.5, height: 30 },

  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:       { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 16, fontWeight: '800', paddingHorizontal: 20, paddingBottom: 12 },
  sheetItem:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5 },
  sheetDot:    { width: 12, height: 12, borderRadius: 6 },
  sheetName:   { fontSize: 15, fontWeight: '700' },
  sheetSub:    { fontSize: 11, marginTop: 2 },
  sheetArrow:  { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
