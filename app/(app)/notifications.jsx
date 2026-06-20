import React, { useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import GlassCard from '../../src/components/ui/GlassCard';
import { useNotificationsStore } from '../../src/stores/useNotificationsStore';

function NotifRow({ notif, divColor, colors, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const { markRead } = useNotificationsStore();

  const handlePress = () => {
    if (!notif.read) markRead(notif.id);
    if (notif.actionRoute) router.push(notif.actionRoute);
  };

  const handleLongPress = () => {
    Alert.alert('Delete Notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(notif.id) },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <TouchableOpacity
        style={styles.notifRow}
        activeOpacity={0.75}
        onPress={handlePress}
        onLongPress={handleLongPress}
      >
        <View style={[styles.avatar, { backgroundColor: notif.color + '22' }]}>
          <Ionicons name={notif.icon} size={17} color={notif.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[styles.notifTitle, {
              color: !notif.read ? colors.textPrimary : colors.textSecondary,
              fontWeight: !notif.read ? '600' : '500',
            }]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          {!!notif.body && (
            <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
              {notif.body}
            </Text>
          )}
          <Text style={[styles.notifTime, { color: colors.textSecondary, opacity: 0.55 }]}>
            {notif.time}
          </Text>
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          {!notif.read && <View style={[styles.unreadDot, { backgroundColor: notif.color }]} />}
          {!!notif.actionRoute && (
            <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} style={{ opacity: 0.4 }} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const divColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const { notifications, loading, fetchNotifications, markAllRead, deleteNotification } = useNotificationsStore();

  useFocusEffect(useCallback(() => {
    fetchNotifications();
  }, []));

  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n => n.read);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <Text style={[styles.countTxt, { color: colors.textSecondary }]}>
          {unread.length === 0 ? 'All caught up' : `${unread.length} unread`}
        </Text>
        {unread.length > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && notifications.length === 0 && (
        <GlassCard style={{ padding: 28, alignItems: 'center', gap: 8 }}>
          <Ionicons name="notifications-off-outline" size={28} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>No notifications yet</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', opacity: 0.7 }}>
            Notifications from Calendar, Family, Kitchen and more will appear here.
          </Text>
        </GlassCard>
      )}

      {!loading && unread.length > 0 && (
        <>
          <Text style={[styles.secLabel, { color: colors.textSecondary }]}>NEW</Text>
          <GlassCard style={styles.listCard}>
            {unread.map((n, i) => (
              <View key={n.id}>
                {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
                <NotifRow notif={n} colors={colors} divColor={divColor} onDelete={deleteNotification} />
              </View>
            ))}
          </GlassCard>
        </>
      )}

      {!loading && read.length > 0 && (
        <>
          <Text style={[styles.secLabel, { color: colors.textSecondary }]}>EARLIER</Text>
          <GlassCard style={styles.listCard}>
            {read.map((n, i) => (
              <View key={n.id}>
                {i > 0 && <View style={[styles.rowDiv, { backgroundColor: divColor }]} />}
                <NotifRow notif={n} colors={colors} divColor={divColor} onDelete={deleteNotification} />
              </View>
            ))}
          </GlassCard>
        </>
      )}

      <Text style={[styles.hint, { color: colors.textSecondary }]}>Long press any notification to delete it</Text>
      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: 'transparent' },
  content:    { padding: 14, paddingBottom: 24, gap: 10 },
  topRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countTxt:   { fontSize: 12, fontWeight: '500' },
  markAll:    { fontSize: 12, fontWeight: '700' },
  secLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  listCard:   { padding: 0 },
  rowDiv:     { height: 0.5, marginHorizontal: 14 },
  notifRow:   {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  avatar:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifTitle: { fontSize: 13, lineHeight: 18 },
  notifBody:  { fontSize: 11, lineHeight: 15, opacity: 0.8 },
  notifTime:  { fontSize: 10, marginTop: 2 },
  unreadDot:  { width: 8, height: 8, borderRadius: 4 },
  hint:       { fontSize: 10, textAlign: 'center', opacity: 0.4, marginTop: 4 },
});
