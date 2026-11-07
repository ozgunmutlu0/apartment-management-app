import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
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

/** Remembers this device's token so sign-out can unregister exactly it. */
const TOKEN_STORAGE_KEY = 'fmb.pushToken';

async function readStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

async function writeStoredToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  } catch {
    // non-critical
  }
}

/** Registers this device's token for the signed-in user (moves it away from any previous user). */
export async function registerPushToken(token: string): Promise<void> {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : undefined;
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (error) {
    warn('Registering the push token failed.', error);
    return;
  }
  await writeStoredToken(token);
}

/** Best effort: call BEFORE signing out so the device stops receiving this user's pushes. */
export async function clearPushToken(): Promise<void> {
  try {
    const token = await readStoredToken();
    if (!token) return;
    const { error } = await supabase.rpc('unregister_push_token', { p_token: token });
    if (error) {
      warn('Unregistering the push token failed.', error);
      return;
    }
    await writeStoredToken(null);
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
