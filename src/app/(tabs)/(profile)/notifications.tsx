import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
  type NotificationRow as NotificationData,
} from '@/features/notifications/api';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { notificationHref } from '@/features/notifications/links';
import { useColors } from '@/theme/colors';

export default function NotificationsScreen() {
  const { t } = useTranslation('notifications');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const query = useNotifications();
  const unreadCount = useUnreadCount().data ?? 0;
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const remove = useDeleteNotification();

  const items = query.data?.pages.flat() ?? [];

  const open = (n: NotificationData) => {
    if (n.read_at === null) markRead.mutate(n.id);
    const href = notificationHref(n.data);
    if (href) router.push(href);
  };

  const confirmDelete = (n: NotificationData) => {
    Alert.alert(t('delete.title'), t('delete.message'), [
      { text: tc('buttons.delete'), style: 'destructive', onPress: () => remove.mutate(n.id) },
      { text: tc('buttons.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                disabled={markAllRead.isPending}
                onPress={() => markAllRead.mutate()}
              >
                <Text style={[styles.headerButton, { color: colors.tint }]}>
                  {t('markAllRead')}
                </Text>
              </Pressable>
            ) : null,
        }}
      />
      {query.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <EmptyState icon="error" title={t('error')} />
          <PrimaryButton
            variant="plain"
            title={tc('buttons.retry')}
            onPress={() => void query.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
            />
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState icon="notification" title={t('empty.title')} message={t('empty.message')} />
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => open(item)}
              onMarkRead={() => markRead.mutate(item.id)}
              onDelete={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  headerButton: { fontSize: 17 },
});
