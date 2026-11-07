import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';

import { useUnreadCount } from './api';
import { notificationHref } from './links';
import { configureNotificationHandler, getPushToken, savePushToken, setAppBadge } from './push';
import { useNotificationsRealtime } from './realtime';

configureNotificationHandler();

/**
 * Mount inside <AuthProvider>. Handles realtime updates, push token registration, tap-to-open
 * (incl. cold start) and the app icon badge.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();
  const userId = profile?.id;
  const hasBuilding = !!profile?.building_id;
  const storedToken = profile?.expo_push_token ?? null;

  useNotificationsRealtime();

  // Register the push token once per signed-in profile.
  const registeredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!userId) {
      registeredFor.current = null; // signed out (token cleared): register again on next sign-in
      return;
    }
    if (registeredFor.current === userId) return;
    registeredFor.current = userId;
    void (async () => {
      const token = await getPushToken();
      if (token && token !== storedToken) await savePushToken(userId, token);
    })();
  }, [userId, storedToken]);

  // Tap on a notification (warm or cold start) -> open the related screen.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' || !lastResponse || !hasBuilding) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponse.current === id) return;
    handledResponse.current = id;
    const href = notificationHref(lastResponse.notification.request.content.data);
    if (!href) return;
    try {
      router.push(href);
    } catch {
      // navigator not ready; the notification list still shows it
    }
  }, [lastResponse, hasBuilding, router]);

  // App icon badge follows the unread count.
  const unread = useUnreadCount().data;
  useEffect(() => {
    if (unread !== undefined) void setAppBadge(unread);
  }, [unread]);
  useEffect(() => {
    if (!userId) void setAppBadge(0);
  }, [userId]);

  return children;
}
