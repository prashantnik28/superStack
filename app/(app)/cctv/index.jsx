import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../../../src/context/ThemeContext';
import GlassCard from '../../../src/components/ui/GlassCard';

const TABS = [
  { id: 'live',       label: 'Live',       icon: 'videocam-outline',      activeIcon: 'videocam' },
  { id: 'recordings', label: 'Recordings', icon: 'film-outline',          activeIcon: 'film' },
  { id: 'alerts',     label: 'Alerts',     icon: 'notifications-outline', activeIcon: 'notifications' },
  { id: 'settings',   label: 'Settings',   icon: 'settings-outline',      activeIcon: 'settings' },
];

const CAMERAS = [
  { id: '1', name: 'Front Door',  status: 'live', res: '1080p', icon: 'home',  color: '#6C63FF' },
  { id: '2', name: 'Living Room', status: 'live', res: '720p',  icon: 'tv',    color: '#4CAF82' },
  { id: '3', name: 'Office Chamber', status: 'live', res: '1080p', icon: 'briefcase', color: '#FFB347' },
  { id: '4', name: 'Garage',      status: 'offline', res: '4K', icon: 'car',  color: '#FF6B9D' },
];

const RECORDINGS = [
  { id: '1', camera: 'Front Door',  time: '09:14 AM', duration: '2m 34s', type: 'motion', size: '18 MB' },
  { id: '2', camera: 'Living Room', time: '08:02 AM', duration: '1m 10s', type: 'motion', size: '8 MB'  },
  { id: '3', camera: 'Front Door',  time: '07:45 AM', duration: '0m 45s', type: 'manual', size: '5 MB'  },
  { id: '4', camera: 'Office Chamber', time: '07:11 AM', duration: '3m 01s', type: 'motion', size: '22 MB' },
  { id: '5', camera: 'Living Room', time: 'Yesterday · 11:58 PM', duration: '1m 22s', type: 'sound', size: '10 MB' },
];

const ALERTS = [
  { id: '1', camera: 'Front Door',  msg: 'Motion detected near entrance',  time: '09:14 AM', type: 'motion',  read: false },
  { id: '2', camera: 'Living Room', msg: 'Person detected in living room',  time: '08:02 AM', type: 'person',  read: false },
  { id: '3', camera: 'Office Chamber', msg: 'Motion detected in office',     time: '06:30 AM', type: 'motion',  read: true  },
  { id: '4', camera: 'Garage',      msg: 'Camera went offline',             time: '07:11 AM', type: 'offline', read: true  },
];

const ALERT_COLORS = { motion: '#FFB347', person: '#FF6B9D', offline: '#EF4444', sound: '#6C63FF' };
const ALERT_ICONS  = { motion: 'walk',    person: 'person',  offline: 'wifi-off', sound: 'volume-high' };
const REC_COLORS   = { motion: '#FFB347', manual: '#6C63FF', sound: '#4CAF82' };
const REC_ICONS    = { motion: 'walk',    manual: 'ellipse', sound: 'volume-high' };

export default function CCTVScreen() {
  const { colors, isDark } = useTheme();
  const { width: screenW } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('live');
  const [selectedCam, setSelectedCam] = useState('1');
  const [gridMode, setGridMode] = useState(false);

  const sub = isDark ? '#9CA3AF' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Front Door → cctv3, Living Room → cctv1, Office Chamber → cctv2
  const playerFrontDoor = useVideoPlayer(require('../../../assets/cctvfootages/cctv3.mp4'), p => {
    p.loop = true; p.muted = true; p.play();
  });
  const playerLivingRoom = useVideoPlayer(require('../../../assets/cctvfootages/cctv1.mp4'), p => {
    p.loop = true; p.muted = true; p.play();
  });
  const playerOffice = useVideoPlayer(require('../../../assets/cctvfootages/cctv2.mp4'), p => {
    p.loop = true; p.muted = true; p.play();
  });

  const CAM_PLAYERS = { '1': playerFrontDoor, '2': playerLivingRoom, '3': playerOffice };

  const camW = (screenW - 32 - 8) / 2;

  return (
    <View style={styles.flex}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: border }]}>
        {TABS.map(tab => {
          const isAct = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isAct && { borderBottomColor: '#6C63FF', borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={isAct ? tab.activeIcon : tab.icon} size={15} color={isAct ? '#6C63FF' : sub} />
              <Text style={[styles.tabLabel, { color: isAct ? '#6C63FF' : sub, fontWeight: isAct ? '700' : '500' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── LIVE ── */}
        {activeTab === 'live' && (
          <>
            {/* Single-camera main feed */}
            {!gridMode && (
              <View style={[styles.mainFeedWrap, { backgroundColor: '#000' }]}>
                <VideoView
                  player={CAM_PLAYERS[selectedCam]}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  nativeControls={false}
                />
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
                <View style={styles.feedTopRow}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTxt}>LIVE</Text>
                  </View>
                  <Text style={styles.feedCamName}>
                    {CAMERAS.find(c => c.id === selectedCam)?.name}
                  </Text>
                  <TouchableOpacity onPress={() => setGridMode(true)} style={styles.gridBtn}>
                    <Ionicons name="grid" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.feedBottomRow}>
                  <Text style={styles.feedRes}>{CAMERAS.find(c => c.id === selectedCam)?.res}</Text>
                </View>
              </View>
            )}

            {/* 2×2 grid view — all 3 live cameras + 1 offline */}
            {gridMode && (
              <View style={styles.gridWrap}>
                <View style={styles.gridRow}>
                  {/* Cam 1 — Front Door (cctv3.mp4) */}
                  <TouchableOpacity
                    style={[styles.gridCell, { width: camW, backgroundColor: '#000' }]}
                    onPress={() => { setSelectedCam('1'); setGridMode(false); }}
                    activeOpacity={0.85}
                  >
                    <VideoView player={playerFrontDoor} style={StyleSheet.absoluteFillObject} contentFit="cover" nativeControls={false} />
                    <View style={styles.gridCellLabel}>
                      <Text style={styles.gridCellTxt}>Front Door</Text>
                      <View style={styles.smallLiveDot} />
                    </View>
                  </TouchableOpacity>

                  {/* Cam 2 — Living Room (cctv1.mp4) */}
                  <TouchableOpacity
                    style={[styles.gridCell, { width: camW, backgroundColor: '#000' }]}
                    onPress={() => { setSelectedCam('2'); setGridMode(false); }}
                    activeOpacity={0.85}
                  >
                    <VideoView player={playerLivingRoom} style={StyleSheet.absoluteFillObject} contentFit="cover" nativeControls={false} />
                    <View style={styles.gridCellLabel}>
                      <Text style={styles.gridCellTxt}>Living Room</Text>
                      <View style={styles.smallLiveDot} />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.gridRow}>
                  {/* Cam 3 — Office Chamber (cctv2.mp4) */}
                  <TouchableOpacity
                    style={[styles.gridCell, { width: camW, backgroundColor: '#000' }]}
                    onPress={() => { setSelectedCam('3'); setGridMode(false); }}
                    activeOpacity={0.85}
                  >
                    <VideoView player={playerOffice} style={StyleSheet.absoluteFillObject} contentFit="cover" nativeControls={false} />
                    <View style={styles.gridCellLabel}>
                      <Text style={styles.gridCellTxt}>Office Chamber</Text>
                      <View style={styles.smallLiveDot} />
                    </View>
                  </TouchableOpacity>

                  {/* Cam 4 — offline */}
                  <View style={[styles.gridCell, { width: camW, backgroundColor: '#111111' }]}>
                    <View style={styles.offlineCell}>
                      <Ionicons name="wifi-off" size={22} color="#4B5563" />
                      <Text style={styles.offlineTxt}>Offline</Text>
                    </View>
                    <View style={styles.gridCellLabel}>
                      <Text style={styles.gridCellTxt}>Garage</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.exitGridBtn} onPress={() => setGridMode(false)}>
                  <Text style={styles.exitGridTxt}>Exit Grid View</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Camera selector */}
            {!gridMode && (
              <>
                <Text style={[styles.secLabel, { color: sub }]}>SELECT CAMERA</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.camRow}>
                  {CAMERAS.map(cam => {
                    const isSel = selectedCam === cam.id;
                    const isLive = cam.status === 'live';
                    return (
                      <TouchableOpacity
                        key={cam.id}
                        style={[styles.camChip, {
                          backgroundColor: isSel ? cam.color : (isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6'),
                          borderColor: isSel ? cam.color : 'transparent',
                          opacity: !isLive ? 0.5 : 1,
                        }]}
                        onPress={() => isLive && setSelectedCam(cam.id)}
                        activeOpacity={isLive ? 0.8 : 1}
                      >
                        <Ionicons name={cam.icon} size={13} color={isSel ? '#fff' : sub} />
                        <Text style={[styles.camChipTxt, { color: isSel ? '#fff' : sub }]}>{cam.name}</Text>
                        {isLive && (
                          <View style={[styles.smallLiveDot, { backgroundColor: isSel ? 'rgba(255,255,255,0.7)' : '#4CAF82' }]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Stats strip */}
            <GlassCard style={styles.statsCard}>
              {[
                { label: 'Online',     val: '3', color: '#4CAF82' },
                { label: 'Offline',    val: '1', color: '#EF4444' },
                { label: 'Alerts',     val: '4', color: '#FFB347' },
                { label: 'Storage',    val: '68%', color: '#6C63FF' },
              ].map((s, i) => (
                <View key={s.label} style={[styles.statItem, i > 0 && { borderLeftWidth: 0.5, borderLeftColor: border }]}>
                  <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.statLabel, { color: sub }]}>{s.label}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* ── RECORDINGS ── */}
        {activeTab === 'recordings' && (
          <>
            <View style={styles.filterRow}>
              {['All', 'Motion', 'Sound', 'Manual'].map((f, i) => (
                <TouchableOpacity key={f} style={[styles.filterChip, { backgroundColor: i === 0 ? '#6C63FF' : (isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6') }]}>
                  <Text style={[styles.filterTxt, { color: i === 0 ? '#fff' : sub }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.secLabel, { color: sub }]}>TODAY</Text>
            {RECORDINGS.map(rec => (
              <GlassCard key={rec.id} style={styles.recCard}>
                <View style={[styles.recThumb, { backgroundColor: REC_COLORS[rec.type] + '18' }]}>
                  <Ionicons name={REC_ICONS[rec.type]} size={20} color={REC_COLORS[rec.type]} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.recTopRow}>
                    <Text style={[styles.recName, { color: colors.textPrimary }]}>{rec.camera}</Text>
                    <View style={[styles.recTypePill, { backgroundColor: REC_COLORS[rec.type] + '20' }]}>
                      <Text style={[styles.recTypeTxt, { color: REC_COLORS[rec.type] }]}>{rec.type}</Text>
                    </View>
                  </View>
                  <Text style={[styles.recMeta, { color: sub }]}>{rec.time} · {rec.duration} · {rec.size}</Text>
                </View>
                <TouchableOpacity style={styles.playBtn}>
                  <Ionicons name="play" size={14} color="#6C63FF" />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </>
        )}

        {/* ── ALERTS ── */}
        {activeTab === 'alerts' && (
          <>
            <View style={styles.alertSummaryRow}>
              {[{ label: 'Today', val: '4' }, { label: 'This Week', val: '23' }, { label: 'Unread', val: '2' }].map((s, i) => (
                <GlassCard key={s.label} style={styles.alertSumCard}>
                  <Text style={[styles.alertSumVal, { color: i === 2 ? '#FF6B9D' : colors.textPrimary }]}>{s.val}</Text>
                  <Text style={[styles.alertSumLabel, { color: sub }]}>{s.label}</Text>
                </GlassCard>
              ))}
            </View>
            <Text style={[styles.secLabel, { color: sub }]}>RECENT ALERTS</Text>
            {ALERTS.map(al => (
              <GlassCard key={al.id} style={styles.alertCard}>
                <View style={[styles.alertIconWrap, { backgroundColor: ALERT_COLORS[al.type] + '20' }]}>
                  <Ionicons name={ALERT_ICONS[al.type]} size={18} color={ALERT_COLORS[al.type]} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.alertTopRow}>
                    <Text style={[styles.alertCam, { color: colors.textPrimary }]}>{al.camera}</Text>
                    {!al.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.alertMsg, { color: sub }]}>{al.msg}</Text>
                  <Text style={[styles.alertTime, { color: sub }]}>{al.time}</Text>
                </View>
              </GlassCard>
            ))}
          </>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <>
            <Text style={[styles.secLabel, { color: sub }]}>CAMERAS</Text>
            {CAMERAS.map(cam => (
              <GlassCard key={cam.id} style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: cam.color + '20' }]}>
                  <Ionicons name={cam.icon} size={18} color={cam.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingName, { color: colors.textPrimary }]}>{cam.name}</Text>
                  <Text style={[styles.settingSub, { color: sub }]}>{cam.res} · {cam.status === 'live' ? 'Online' : 'Offline'}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: cam.status === 'live' ? '#4CAF82' : '#EF4444' }]} />
                <Ionicons name="chevron-forward" size={16} color={sub} />
              </GlassCard>
            ))}

            <Text style={[styles.secLabel, { color: sub }]}>STORAGE & QUALITY</Text>
            <GlassCard style={styles.storageCard}>
              <View style={styles.storageRow}>
                <Ionicons name="server" size={18} color="#6C63FF" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingName, { color: colors.textPrimary }]}>Storage Used</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '68%', backgroundColor: '#6C63FF' }]} />
                  </View>
                </View>
                <Text style={[styles.settingSub, { color: '#6C63FF' }]}>68%</Text>
              </View>
              <View style={[styles.storageRow, { borderTopWidth: 0.5, borderTopColor: border, marginTop: 8, paddingTop: 8 }]}>
                <Ionicons name="time" size={18} color="#4CAF82" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingName, { color: colors.textPrimary }]}>Retention Period</Text>
                  <Text style={[styles.settingSub, { color: sub }]}>30 days</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={sub} />
              </View>
            </GlassCard>

            <Text style={[styles.secLabel, { color: sub }]}>NOTIFICATIONS</Text>
            {[
              { label: 'Motion Alerts',  icon: 'walk',        color: '#FFB347', on: true  },
              { label: 'Person Detected',icon: 'person',      color: '#FF6B9D', on: true  },
              { label: 'Camera Offline', icon: 'wifi-off',    color: '#EF4444', on: true  },
              { label: 'Sound Detected', icon: 'volume-high', color: '#6C63FF', on: false },
            ].map(n => (
              <GlassCard key={n.label} style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: n.color + '20' }]}>
                  <Ionicons name={n.icon} size={18} color={n.color} />
                </View>
                <Text style={[styles.settingName, { color: colors.textPrimary, flex: 1 }]}>{n.label}</Text>
                <View style={[styles.togglePill, { backgroundColor: n.on ? '#6C63FF' : (isDark ? '#374151' : '#E5E7EB') }]}>
                  <View style={[styles.toggleThumb, { transform: [{ translateX: n.on ? 16 : 0 }] }]} />
                </View>
              </GlassCard>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, paddingHorizontal: 4 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 11 },
  content: { padding: 16, gap: 12 },
  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },

  // Main feed
  mainFeedWrap: { height: 210, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  feedTopRow: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedBottomRow: { position: 'absolute', bottom: 10, right: 10 },
  feedCamName: { flex: 1, color: '#fff', fontSize: 13, fontWeight: '700' },
  feedRes: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF82' },
  liveTxt: { color: '#4CAF82', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  gridBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  // Grid view
  gridWrap: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  gridCell: { height: 110, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gridCellLabel: { position: 'absolute', bottom: 6, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridCellTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  offlineCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  offlineTxt: { color: '#4B5563', fontSize: 10, fontWeight: '600' },
  smallLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF82' },
  exitGridBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  exitGridTxt: { color: '#6C63FF', fontSize: 12, fontWeight: '700' },

  // Camera selector
  camRow: { gap: 8, paddingVertical: 2 },
  camChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  camChipTxt: { fontSize: 12, fontWeight: '600' },

  // Stats
  statsCard: { flexDirection: 'row', padding: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },

  // Recordings
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  filterTxt: { fontSize: 12, fontWeight: '600' },
  recCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  recThumb: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  recName: { fontSize: 13, fontWeight: '600', flex: 1 },
  recTypePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99 },
  recTypeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  recMeta: { fontSize: 11 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6C63FF18', alignItems: 'center', justifyContent: 'center' },

  // Alerts
  alertSummaryRow: { flexDirection: 'row', gap: 10 },
  alertSumCard: { flex: 1, alignItems: 'center', padding: 12, gap: 4 },
  alertSumVal: { fontSize: 20, fontWeight: '800' },
  alertSumLabel: { fontSize: 10, fontWeight: '600' },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 10 },
  alertIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  alertCam: { fontSize: 13, fontWeight: '600' },
  alertMsg: { fontSize: 12, lineHeight: 17 },
  alertTime: { fontSize: 10, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B9D' },

  // Settings
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  settingIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingName: { fontSize: 13, fontWeight: '600' },
  settingSub: { fontSize: 11, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  storageCard: { padding: 14, gap: 0 },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  togglePill: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
});
