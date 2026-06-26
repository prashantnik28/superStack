import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../lib/api';
import { useAuthStore } from '../stores/useAuthStore';

// Notifications don't work in Expo Go — only in dev builds / production
const IS_EXPO_GO = Constants.appOwnership === 'expo';

if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
    }),
  });
}

async function registerForPushNotificationsAsync() {
  if (IS_EXPO_GO) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:      'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token.data;
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || IS_EXPO_GO) return;

    registerForPushNotificationsAsync()
      .then((expoPushToken) => {
        if (!expoPushToken) return;
        api.patch('/users/push-token', { expoPushToken }).catch(() => {});
      })
      .catch(() => {});
  }, [isAuthenticated]);
}
