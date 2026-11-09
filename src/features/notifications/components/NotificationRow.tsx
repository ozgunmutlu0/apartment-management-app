import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { IconTile, type Tone } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

import type { NotificationRow as NotificationData } from '../api';
import { notificationStatus, notificationTitleKey } from '../links';
import { formatRelative } from '@/features/tickets/format';

export type NotificationRowProps = {
  notification: NotificationData;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
};

export function useNotificationTitle() {
  const { t } = useTranslation('notifications');
  return (n: NotificationData): string => {
    const key = notificationTitleKey(n.type);
    if (key === 'ticket_status') {
      const status = notificationStatus(n.data);
      return status
        ? t('title.ticket_status', { status: t(`status.${status}`), title: n.title })
        : t('title.ticket_status_unknown', { title: n.title });
    }
    return t(`title.${key}`, { title: n.title });
  };
}

const STATUS_TONE: Record<string, Tone> = {
  pending: 'neutral',
  in_review: 'blue',
  in_progress: 'orange',
  resolved: 'green',
};

/** Tone is a state only for ticket status changes; everything else uses the accent. */
function toneOf(n: NotificationData): Tone {
  if (notificationTitleKey(n.type) !== 'ticket_status') return 'tint';
  const status = notificationStatus(n.data);
  return (status && STATUS_TONE[status]) || 'tint';
}

function iconOf(n: NotificationData): 'ticket' | 'announcement' | 'notification' {
  switch (notificationTitleKey(n.type)) {
    case 'announcement':
      return 'announcement';
    case 'generic':
      return 'notification';
    default:
      return 'ticket';
  }
}

/** One notification; long-press opens a native context menu (mark read / delete). */
export function NotificationRow({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: NotificationRowProps) {
  const { t, i18n } = useTranslation('notifications');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const titleOf = useNotificationTitle();
  const unread = notification.read_at === null;
  // The Android menu host sizes to its content (unbounded), so pin the row to the list width.
  const { width } = useWindowDimensions();

  const readAction: MenuAction = { id: 'read', title: t('markRead'), image: 'checkmark' };
  const deleteAction: MenuAction = {
    id: 'delete',
    title: tc('buttons.delete'),
    image: 'trash',
    attributes: { destructive: true },
  };
  const actions: MenuAction[] = unread ? [readAction, deleteAction] : [deleteAction];

  return (
    <MenuView
      shouldOpenOnLongPress
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'read') onMarkRead();
        else if (nativeEvent.event === 'delete') onDelete();
      }}
    >
      <View style={{ width: width - space.lg * 2 }}>
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ selected: unread }}
          onPress={onPress}
        >
          <GlassCard flat={Platform.OS === 'android'} style={styles.row}>
            <IconTile name={iconOf(notification)} tone={toneOf(notification)} />
            <View style={styles.body}>
              <Text
                style={[styles.title, unread ? type.headline : type.body, { color: colors.label }]}
                numberOfLines={2}
              >
                {titleOf(notification)}
              </Text>
              {notification.body ? (
                <Text style={[styles.text, { color: colors.secondaryLabel }]} numberOfLines={2}>
                  {notification.body}
                </Text>
              ) : null}
              <Text style={[styles.time, { color: colors.secondaryLabel }]}>
                {formatRelative(notification.created_at, i18n.language)}
              </Text>
            </View>
            {unread ? (
              <View
                accessibilityLabel={t('unread')}
                style={[styles.dot, { backgroundColor: colors.tint }]}
              />
            ) : null}
          </GlassCard>
        </PressableScale>
      </View>
    </MenuView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  body: { flex: 1, gap: 2 },
  title: {},
  text: { ...type.small },
  time: { ...type.caption },
});
