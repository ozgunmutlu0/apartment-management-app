import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const ANDROID_CHANNEL_ID = 'default';

/** Foreground behaviour: show banners (and keep them in the notification list). */
export function configureNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function warn(message: string, error?: unknown) {
  if (__DEV__) console.warn(`[notifications] ${message}`, error ?? '');
}

/**
 * Asks for permission (only while it can still be asked for), fetches the Expo push token and
 * returns it. Returns null whenever push is unavailable; never throws.
 */
export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'FixMyBuilding',
        importance: AndroidImportance.DEFAULT,
      });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (permission.status === 'undetermined' && permission.canAskAgain) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (permission.status !== 'granted') return null; // denied: respect it, don't nag

    const projectId: string | undefined =
      Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      warn('No EAS projectId (run `eas init`); skipping push token registration.');
      return null;
    }
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    // e.g. Expo Go on Android (SDK 53+) has no remote push support
    warn('Push token registration failed.', error);
    return null;
  }
}

export async function savePushToken(userId: string, token: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
  if (error) warn('Saving the push token failed.', error);
}

/** Best effort: call BEFORE signing out so the device stops receiving this user's pushes. */
export async function clearPushToken(userId: string | undefined): Promise<void> {
  if (!userId) return;
  try {
    await savePushToken(userId, null);
  } catch (error) {
    warn('Clearing the push token failed.', error);
  }
}

export async function setAppBadge(count: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    warn('Setting the badge count failed.', error);
  }
}
