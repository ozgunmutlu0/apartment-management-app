import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { TicketRow } from '@/features/tickets/components/TicketRow';
import { useTickets, useTicketsRealtime } from '@/features/tickets/api';
import { TICKET_STATUSES, type TicketStatus } from '@/features/tickets/types';
import { useColors } from '@/theme/colors';

export default function TicketsScreen() {
  const { t } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const router = useRouter();
  const colors = useColors();
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState(0);

  const status: TicketStatus | null = segment === 0 ? null : (TICKET_STATUSES[segment - 1] ?? null);
  const tickets = useTickets({ status, category: null });
  useTicketsRealtime();

  const segments = useMemo(
    () => [t('all'), ...TICKET_STATUSES.map((s) => t(`status.${s}`))],
    [t],
  );

  const query = search.trim().toLocaleLowerCase();
  const data = useMemo(
    () =>
      (tickets.data ?? []).filter((ticket) =>
        query ? ticket.title.toLocaleLowerCase().includes(query) : true,
      ),
    [tickets.data, query],
  );

  const canCreate = role === 'resident' || role === 'manager';
  const filtered = query.length > 0 || status !== null;

  let empty;
  if (tickets.isPending) {
    empty = <ActivityIndicator style={styles.loading} />;
  } else if (tickets.isError) {
    empty = (
      <View style={styles.errorBox}>
        <EmptyState icon="error" title={t('list.errorTitle')} />
        <PrimaryButton title={tc('buttons.retry')} onPress={() => void tickets.refetch()} />
      </View>
    );
  } else if (filtered) {
    empty = (
      <EmptyState
        title={t('list.emptyFilteredTitle')}
        message={t('list.emptyFilteredMessage')}
      />
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
                  hitSlop={8}
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
          <SegmentedControl
            values={segments}
            selectedIndex={segment}
            onChange={(event) => setSegment(event.nativeEvent.selectedSegmentIndex)}
            style={styles.segmented}
          />
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
  content: { padding: 16, flexGrow: 1 },
  segmented: { marginBottom: 16 },
  separator: { height: 10 },
  loading: { marginTop: 48 },
  errorBox: { gap: 12, alignItems: 'center' },
});
