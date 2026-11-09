import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/lib/auth';
import { TicketRow } from '@/features/tickets/components/TicketRow';
import { useTickets, useTicketsRealtime } from '@/features/tickets/api';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useColors } from '@/theme/colors';
import { radius, space, scrollProps } from '@/theme/tokens';

export default function TicketsScreen() {
  const { t } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const router = useRouter();
  const colors = useColors();
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const status: TicketStatus | null = TICKET_STATUSES.find((s) => s === filter) ?? null;
  const tickets = useTickets({ status: null, category: null });
  useTicketsRealtime();

  const chips = useMemo(() => {
    const all = tickets.data ?? [];
    return [
      { key: 'all', label: t('all'), count: tickets.data ? all.length : undefined },
      ...TICKET_STATUSES.map((s) => ({
        key: s,
        label: t(`status.${s}`),
        count: tickets.data ? all.filter((x) => x.status === s).length : undefined,
      })),
    ];
  }, [t, tickets.data]);

  const query = search.trim().toLocaleLowerCase();
  const data = useMemo(
    () =>
      (tickets.data ?? []).filter(
        (ticket) =>
          (status === null || ticket.status === status) &&
          (query ? ticket.title.toLocaleLowerCase().includes(query) : true),
      ),
    [tickets.data, query, status],
  );

  const canCreate = role === 'resident' || role === 'manager';
  const filtered = query.length > 0 || status !== null;

  let empty;
  if (tickets.isPending) {
    empty = (
      <View style={styles.skeletons}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={92} radius={radius.card} />
        ))}
      </View>
    );
  } else if (tickets.isError) {
    empty = (
      <EmptyState
        icon="error"
        title={t('list.errorTitle')}
        action={{ title: tc('buttons.retry'), onPress: () => void tickets.refetch() }}
      />
    );
  } else if (filtered) {
    empty = (
      <EmptyState title={t('list.emptyFilteredTitle')} message={t('list.emptyFilteredMessage')} />
    );
  } else {
    empty = (
      <EmptyState
        icon="ticket"
        title={t('list.emptyTitle')}
        message={role === 'technician' ? t('list.emptyTechnicianMessage') : t('list.emptyMessage')}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('list.searchPlaceholder'),
            autoCapitalize: 'none',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
            onCancelButtonPress: () => setSearch(''),
          },
          headerRight: canCreate
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('list.add')}
                  hitSlop={space.md}
                  onPress={() => router.push('/(tabs)/(tickets)/new')}
                >
                  <SymbolView
                    name={{ ios: 'plus', android: 'add' }}
                    size={22}
                    tintColor={colors.tint}
                  />
                </Pressable>
              )
            : undefined,
        }}
      />
      <FlatList
        {...scrollProps}
        data={data}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
        style={{ backgroundColor: colors.systemGroupedBackground }}
        refreshControl={
          <RefreshControl
            refreshing={tickets.isRefetching}
            onRefresh={() => void tickets.refetch()}
          />
        }
        ListHeaderComponent={
          <View style={styles.chips}>
            <FilterChips options={chips} value={filter} onChange={setFilter} />
          </View>
        }
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <TicketRow
            ticket={item}
            showUnit={role === 'manager'}
            onPress={() =>
              router.push({ pathname: '/(tabs)/(tickets)/[id]', params: { id: item.id } })
            }
          />
        )}
      />
    </>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, flexGrow: 1 },
  chips: { marginBottom: space.lg },
  separator: { height: space.md },
  skeletons: { gap: space.md },
});
