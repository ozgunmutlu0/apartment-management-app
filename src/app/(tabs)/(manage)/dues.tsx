import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import {
  HeroCaption,
  HeroCard,
  HeroEyebrow,
  HeroFigure,
  HeroProgress,
} from '@/components/HeroCard';
import { Icon } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
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
import { radius, space, type } from '@/theme/tokens';

export default function ManageDuesScreen() {
  const { t, i18n } = useTranslation('dues');
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
          <View style={[styles.navButton, { backgroundColor: colors.tintSoft }]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'chevron_left' }}
              size={16}
              tintColor={colors.tint}
            />
          </View>
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
          <View style={[styles.navButton, { backgroundColor: colors.tintSoft }]}>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right' }}
              size={16}
              tintColor={colors.tint}
            />
          </View>
        </Pressable>
      </View>
      <HeroCard>
        <HeroEyebrow>{t('manage.stats.collected').toLocaleUpperCase(i18n.language)}</HeroEyebrow>
        <HeroFigure style={styles.figure} numberOfLines={1} adjustsFontSizeToFit>
          {fmt.money(stats.collected)}
        </HeroFigure>
        <HeroCaption>
          {t('manage.stats.expected')}: {fmt.money(stats.expected)}
        </HeroCaption>
        <HeroProgress
          value={stats.expected > 0 ? stats.collected / stats.expected : 0}
          accessibilityLabel={t('manage.stats.collected')}
        />
        <HeroCaption style={styles.paidCount}>
          {t('manage.stats.paidCount', { paid: stats.paid, total: stats.total })}
        </HeroCaption>
      </HeroCard>
    </View>
  );

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="error"
          title={t('manage.error')}
          action={{ title: tc('buttons.retry'), onPress: () => void refetch() }}
        />
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
          isLoading ? (
            <View style={styles.separator}>
              {[0, 1, 2].map((i) => (
                <GlassCard key={i} style={styles.row}>
                  <View style={styles.rowMain}>
                    <Skeleton width="40%" height={18} />
                    <Skeleton width="60%" height={14} />
                  </View>
                  <Skeleton width={72} height={18} />
                </GlassCard>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="dues"
              title={t('manage.empty.title')}
              message={t('manage.empty.message')}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
        renderItem={({ item }) => {
          const status = effectiveStatus(item);
          const partial = status !== 'paid' && item.payments.length > 0;
          return (
            <PressableScale accessibilityRole="button" onPress={() => open(item)}>
              <GlassCard style={styles.row}>
                <IconTile
                  name={status === 'paid' ? 'check' : status === 'overdue' ? 'error' : 'clock'}
                  tone={
                    status === 'paid'
                      ? 'green'
                      : status === 'overdue'
                        ? 'red'
                        : partial
                          ? 'orange'
                          : 'neutral'
                  }
                />
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
              </GlassCard>
            </PressableScale>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.md },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl + space.xl },
  header: { gap: space.lg, paddingVertical: space.sm, marginBottom: space.sm },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLabel: { ...type.title },
  figure: { marginTop: space.xs, marginBottom: space.xs },
  paidCount: { marginTop: space.sm },
  caption: { ...type.small },
  separator: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowMain: { flex: 1, flexShrink: 1, gap: space.xs },
  rowEnd: { alignItems: 'flex-end', gap: space.sm },
  unit: { ...type.headline },
  amount: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
});
