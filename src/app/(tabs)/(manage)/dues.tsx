import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useManagerDues } from '@/features/dues/api';
import { DueStatusBadge } from '@/features/dues/components/DueStatusBadge';
import type { ManagerDue } from '@/features/dues/types';
import {
  effectiveStatus,
  paidTotal,
  periodOf,
  remainingOf,
  shiftPeriod,
  useDuesFormat,
} from '@/features/dues/utils';
import { useColors } from '@/theme/colors';

export default function ManageDuesScreen() {
  const { t } = useTranslation('dues');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const fmt = useDuesFormat();
  const [period, setPeriod] = useState(() => periodOf(new Date()));
  const { data, isLoading, isError, isRefetching, refetch } = useManagerDues(period);

  const stats = useMemo(() => {
    const dues = data ?? [];
    return {
      expected: dues.reduce((s, d) => s + Number(d.amount), 0),
      collected: dues.reduce((s, d) => s + paidTotal(d.payments), 0),
      paid: dues.filter((d) => d.status === 'paid').length,
      total: dues.length,
    };
  }, [data]);

  const open = (due: ManagerDue) => {
    const remaining = remainingOf(due);
    if (due.payments.length > 0) {
      router.push({ pathname: '/due-payments', params: { dueId: due.id, period } });
    } else if (remaining > 0) {
      router.push({
        pathname: '/record-payment',
        params: { dueId: due.id, unitLabel: due.unitLabel, remaining: String(remaining) },
      });
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.periodRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('manage.previousMonth')}
          hitSlop={12}
          onPress={() => setPeriod((p) => shiftPeriod(p, -1))}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left' }}
            size={22}
            tintColor={colors.tint}
          />
        </Pressable>
        <Text style={[styles.periodLabel, { color: colors.label }]} accessibilityRole="header">
          {fmt.month(period)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('manage.nextMonth')}
          hitSlop={12}
          onPress={() => setPeriod((p) => shiftPeriod(p, 1))}
        >
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right' }}
            size={22}
            tintColor={colors.tint}
          />
        </Pressable>
      </View>
      <GlassCard style={styles.stats}>
        <View style={styles.statsRow}>
          <View>
            <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
              {t('manage.stats.collected')}
            </Text>
            <Text style={[styles.statValue, { color: colors.green }]}>
              {fmt.money(stats.collected)}
            </Text>
          </View>
          <View style={styles.statEnd}>
            <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
              {t('manage.stats.expected')}
            </Text>
            <Text style={[styles.statValue, { color: colors.label }]}>
              {fmt.money(stats.expected)}
            </Text>
          </View>
        </View>
        <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
          {t('manage.stats.paidCount', { paid: stats.paid, total: stats.total })}
        </Text>
      </GlassCard>
    </View>
  );

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <EmptyState icon="error" title={t('manage.error')} />
        <PrimaryButton variant="plain" title={tc('buttons.retry')} onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('manage.generate')}
              hitSlop={12}
              onPress={() => router.push({ pathname: '/generate-dues', params: { period } })}
            >
              <Icon name="add" size={22} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        data={data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? undefined : (
            <EmptyState
              icon="dues"
              title={t('manage.empty.title')}
              message={t('manage.empty.message')}
            />
          )
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
        )}
        renderItem={({ item }) => {
          const status = effectiveStatus(item);
          const partial = status !== 'paid' && item.payments.length > 0;
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => open(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.secondarySystemGroupedBackground },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.rowMain}>
                <Text style={[styles.unit, { color: colors.label }]}>
                  {t('manage.unit', { label: item.unitLabel })}
                </Text>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {item.residentNames.length > 0
                    ? item.residentNames.join(', ')
                    : t('manage.noResident')}
                </Text>
                {partial ? (
                  <Text style={[styles.caption, { color: colors.orange }]}>
                    {t('manage.partial')} ·{' '}
                    {t('remaining', { amount: fmt.money(remainingOf(item)) })}
                  </Text>
                ) : null}
              </View>
              <View style={styles.rowEnd}>
                <Text style={[styles.amount, { color: colors.label }]}>
                  {fmt.money(Number(item.amount))}
                </Text>
                <DueStatusBadge status={status} />
              </View>
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { gap: 12, paddingVertical: 8 },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabel: { fontSize: 20, fontWeight: '600' },
  stats: { gap: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statEnd: { alignItems: 'flex-end' },
  statValue: { fontSize: 22, fontWeight: '600' },
  caption: { fontSize: 14 },
  row: { flexDirection: 'row', gap: 12, padding: 14, justifyContent: 'space-between' },
  pressed: { opacity: 0.6 },
  rowMain: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: 6 },
  unit: { fontSize: 17, fontWeight: '500' },
  amount: { fontSize: 17, fontWeight: '600' },
});
