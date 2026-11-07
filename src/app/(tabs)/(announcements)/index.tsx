import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAnnouncements } from '@/features/announcements/api';
import { AnnouncementActionsMenu } from '@/features/announcements/components/AnnouncementActionsMenu';
import { AnnouncementCard } from '@/features/announcements/components/AnnouncementCard';
import { useAnnouncementActions } from '@/features/announcements/components/useAnnouncementActions';
import {
  ANNOUNCEMENT_CATEGORIES,
  isAnnouncementCategory,
  type AnnouncementCategory,
} from '@/features/announcements/types';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

type Filter = AnnouncementCategory | 'all';

export default function AnnouncementsScreen() {
  const { t } = useTranslation('announcements');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const { role } = useAuth();
  const isManager = role === 'manager';
  const { data, isPending, isError, refetch, isRefetching } = useAnnouncements();
  const { pin, confirmDelete } = useAnnouncementActions();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  // Realtime is not enabled for announcements: refetch whenever the screen gains focus.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return (data ?? []).filter(
      (a) =>
        (filter === 'all' || a.category === filter) &&
        (!q || a.title.toLocaleLowerCase().includes(q) || a.body.toLocaleLowerCase().includes(q)),
    );
  }, [data, filter, query]);

  const filterActions: MenuAction[] = [
    { id: 'all', title: t('filter.all'), state: filter === 'all' ? 'on' : 'off' },
    ...ANNOUNCEMENT_CATEGORIES.map((c): MenuAction => ({
      id: c,
      title: t(`categories.${c}`),
      state: filter === c ? 'on' : 'off',
    })),
  ];

  const headerRight = () => (
    <View style={styles.headerRight}>
      <MenuView
        title={t('filter.title')}
        actions={filterActions}
        onPressAction={({ nativeEvent }) => {
          const id = nativeEvent.event;
          if (id === 'all') setFilter('all');
          else if (isAnnouncementCategory(id)) setFilter(id);
        }}
      >
        <View accessible accessibilityRole="button" accessibilityLabel={t('actions.filter')}>
          <SymbolView
            name={{
              ios:
                filter === 'all'
                  ? 'line.3.horizontal.decrease.circle'
                  : 'line.3.horizontal.decrease.circle.fill',
              android: 'filter_list',
            }}
            size={24}
            tintColor={colors.tint}
          />
        </View>
      </MenuView>
      {isManager ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('actions.new')}
          hitSlop={8}
          onPress={() => router.push('/(tabs)/(announcements)/new')}
        >
          <SymbolView name={{ ios: 'plus', android: 'add' }} size={24} tintColor={colors.tint} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight,
          headerSearchBarOptions: {
            placeholder: t('search'),
            onChangeText: (e) => setQuery(e.nativeEvent.text),
            onCancelButtonPress: () => setQuery(''),
          },
        }}
      />
      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <EmptyState icon="error" title={t('errors.load')} />
          <PrimaryButton
            variant="plain"
            title={tc('buttons.retry')}
            onPress={() => void refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="announcement"
              title={t('empty.title')}
              message={filter !== 'all' || query ? t('empty.filtered') : t('empty.message')}
            />
          }
          renderItem={({ item }) => {
            const card = (
              <AnnouncementCard
                announcement={item}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/(announcements)/[id]', params: { id: item.id } })
                }
              />
            );
            if (!isManager) return card;
            return (
              <AnnouncementActionsMenu
                longPress
                announcement={item}
                onEdit={() =>
                  router.push({ pathname: '/(tabs)/(announcements)/new', params: { id: item.id } })
                }
                onTogglePin={() => pin(item)}
                onDelete={() => confirmDelete(item)}
              >
                {card}
              </AnnouncementActionsMenu>
            );
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
