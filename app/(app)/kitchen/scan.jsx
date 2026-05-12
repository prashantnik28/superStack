import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

export default function ScanScreen() {
  const { colors } = useTheme();
  const [scanned, setScanned] = useState(false);

  const handleManualScan = () => {
    setScanned(true);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Barcode Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraArea}>
        <View style={[styles.cameraPlaceholder, { backgroundColor: '#111' }]}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Ionicons name="barcode" size={60} color="rgba(255,255,255,0.4)" style={{ marginTop: 20 }} />
          <Text style={styles.cameraHint}>Point camera at barcode</Text>
          <TouchableOpacity style={styles.demoBtn} onPress={handleManualScan}>
            <Text style={styles.demoBtnTxt}>Simulate Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {scanned && (
        <GlassCard style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={[styles.resultIcon, { backgroundColor: '#4CAF8222' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF82" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultName, { color: colors.textPrimary }]}>Amul Full Cream Milk</Text>
              <Text style={[styles.resultBrand, { color: colors.textSecondary }]}>Amul · 500ml</Text>
            </View>
          </View>
          <View style={styles.resultMeta}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Category</Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>Dairy</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Expires</Text>
              <Text style={[styles.metaValue, { color: '#FFB347' }]}>May 14, 2026</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Calories</Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]}>61 kcal</Text>
            </View>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity style={[styles.addToBtn, { backgroundColor: '#FFB347' }]} onPress={() => router.back()}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addToBtnTxt}>Add to Pantry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.border }]} onPress={() => setScanned(false)}>
              <Text style={[styles.retryTxt, { color: colors.textSecondary }]}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const CORNER_SIZE = 20;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = '#FFB347';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  cameraArea: { flex: 1 },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  scanFrame: { width: 220, height: 140, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: CORNER_COLOR },
  cameraHint: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  demoBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  demoBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  resultCard: { margin: 16, padding: 16, gap: 14 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultBrand: { fontSize: 12, marginTop: 2 },
  resultMeta: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 12 },
  metaItem: { alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 10, fontWeight: '600' },
  metaValue: { fontSize: 13, fontWeight: '700' },
  resultActions: { flexDirection: 'row', gap: 10 },
  addToBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 13 },
  addToBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 13, borderWidth: 1 },
  retryTxt: { fontSize: 14, fontWeight: '600' },
});
