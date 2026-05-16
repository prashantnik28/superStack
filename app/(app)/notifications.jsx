import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import GlassCard from '../../src/components/ui/GlassCard';

const CHILD_PHOTOS = {
  '1': require('../../assets/userchild2.png'),
  '2': require('../../assets/userchild1.png'),
};

const NEW_NOTIFS = [
  {
    id: '1', icon: 'school', color: '#6C63FF',
    title: 'Aarav checked in at school',
    sub: 'St. Joseph School · 8:40 AM',
    time: 'Just now', photoId: '1',
  },
  {
    id: '2', icon: 'sparkles', color: '#4CAF82',
    title: 'Home Cleaning is confirmed',
    sub: 'Tomorrow, 3:00 PM – 5:00 PM',
    time: '10:32 AM',
  },
  {
    id: '3', icon: 'water', color: '#26C6DA',
    title: 'Milk Delivery completed',
    sub: 'Today, 7:15 AM',
    time: '7:15 AM',
  },
];

const EARLIER_NOTIFS = [
  {
    id: '4', icon: 'musical-notes', color: '#FF6B9D',
    title: "Myra's dance class starts today",
    sub: 'City Dance Studio, 10:00 AM',
    time: 'Yesterday', photoId: '2',
  },
  {
    id: '5', icon: 'bug', color: '#FFB347',
    title: 'Pest Control service completed',
    sub: 'By CleanHome Services',
    time: 'May 12',
  },
  {
    id: '6', icon: 'lock-closed', color: '#6B7280',
    title: 'Front Door Lock was locked',
    sub: 'Auto-lock triggered',
    time: 'May 12, 9:00 PM',
  },
  {
    id: '7', icon: 'cart', color: '#FFB347',
    title: 'Grocery delivery scheduled',
    sub: 'Arrives Wednesday 3–5 PM',
    time: 'May 11',
  },
  {
    id: '8', icon: 'warning', color: '#FF6B6B',
    title: '3 items expiring soon',
    sub: 'Milk, Yogurt, Bread — check kitchen',
    time: 'May 11',
  },
];

function NotifRow({ notif, isNew, divColor, colors }) {
  const photo = notif.photoId ? CHILD_PHOTOS[notif.photoId] : null;
  return (
    <TouchableOpacity style={styles.notifRow} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: photo ? 'transparent' : notif.color + '22' }]}>
        {photo
          ? <Image source={photo} style={styles.avatarImg} />
          : <Ionicons name={notif.icon} size={17} color={notif.color} />
        }
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.notifTitle, { color: isNew ? colors.textPrimary : colors.textSecondary, fontWeight: isNew ? '600' : '500' }]}
          numberOfLines={1}
        >
          {notif.title}
        </Text>
        <Text style={[styles.notifSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {notif.sub}
        </Text>
        <Text style={[styles.notifTime, { color: colors.textSecondary, opacity: 0.6 }]}>
          {notif.time}
        </Text>
      </View>

      {/* Unread dot */}
      {isNew && <View style={[styles.unreadDot, { backgroundColor: notif.color }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const [read, setRead] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Mark all read */}
      <View style={styles.topRow}>
        <Text style={[styles.countTxt, { color: colors.textSecondary }]}>
          {read ? 'All caught up' : `${NEW_NOTIFS.length} unread`}
        </Text>
        {!read && (
          <TouchableOpacity onPress={() => setRead(true)}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* NEW section */}
      {!read && (
        <>
          <Text style={[styles.secLabel, { color: colors.textSecondary }]}>NEW</Text>
          <GlassCard style={styles.listCard}>
            {NEW_NOTIFS.map((n, i) => (
              <View key={n.id}>
                {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
                <NotifRow notif={n} isNew colors={colors} divColor={divColor} />
              </View>
            ))}
          </GlassCard>
        </>
      )}

      {/* EARLIER section */}
      <Text style={[styles.secLabel, { color: colors.textSecondary }]}>EARLIER</Text>
      <GlassCard style={styles.listCard}>
        {EARLIER_NOTIFS.map((n, i) => (
          <View key={n.id}>
            {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
            <NotifRow notif={n} isNew={false} colors={colors} divColor={divColor} />
          </View>
        ))}
      </GlassCard>

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 14, paddingBottom: 24, gap: 10 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countTxt: { fontSize: 12, fontWeight: '500' },
  markAll: { fontSize: 12, fontWeight: '700' },

  secLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },

  listCard: { padding: 0 },
  rowDiv: { height: 0.5, marginHorizontal: 14 },

  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  notifTitle: { fontSize: 13, lineHeight: 18 },
  notifSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  notifTime: { fontSize: 10, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
