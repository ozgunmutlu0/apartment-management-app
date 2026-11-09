import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { SectionLabel } from '@/components/SectionLabel';
import { Skeleton } from '@/components/Skeleton';
import { useDuesFormat } from '@/features/dues/utils';
import { REPORT_PERIODS, useReport, type ReportPeriod } from '@/features/reports/api';
import { BarRow } from '@/features/reports/components/BarRow';
import { TICKET_CATEGORIES, TICKET_STATUSES } from '@/features/tickets/types';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation('reports');
  const { t: tt } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const fmt = useDuesFormat();
  const [periodIndex, setPeriodIndex] = useState(0);
  const period: ReportPeriod = REPORT_PERIODS[periodIndex];
  const report = useReport(period);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await report.refetch();
    setRefreshing(false);
  };

  const data = report.data;
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  // Categories are not states: one accent for every bar, ranking is shown by length.
  const categoryRows = data
    ? TICKET_CATEGORIES.map((c) => ({
        key: c,
        count: data.tickets.byCategory[c],
        color: colors.tint,
      })).sort((a, b) => b.count - a.count)
    : [];
  const maxCategory = categoryRows[0]?.count ?? 0;
  const maxStatus = data ? Math.max(...TICKET_STATUSES.map((s) => data.tickets.byStatus[s])) : 0;

  const avg = data?.tickets.avgResolutionHours ?? null;
  const avgLabel =
    avg === null
      ? t('tickets.noResolved')
      : avg < 48
        ? t('tickets.avgHours', { value: avg.toFixed(1) })
        : t('tickets.avgDays', { value: (avg / 24).toFixed(1) });

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.periodBlock}>
        <SegmentedControl
          values={REPORT_PERIODS.map((p) => t(`period.${p}`))}
          selectedIndex={periodIndex}
          onChange={(e) => setPeriodIndex(e.nativeEvent.selectedSegmentIndex)}
        />
        {data ? (
          <Text style={[styles.range, { color: colors.secondaryLabel }]}>
            {t('range', { from: dateFormat.format(data.from), to: dateFormat.format(data.to) })}
          </Text>
        ) : null}
      </View>

      {report.isPending ? (
        <>
          <View style={styles.tiles}>
            <GlassCard style={styles.tile}>
              <Skeleton width={60} height={28} />
              <Skeleton width="70%" height={14} />
            </GlassCard>
            <GlassCard style={styles.tile}>
              <Skeleton width={60} height={28} />
              <Skeleton width="70%" height={14} />
            </GlassCard>
          </View>
          <GlassCard style={styles.card}>
            <Skeleton width="40%" height={20} />
            <Skeleton height={10} radius={999} />
            <Skeleton height={10} radius={999} />
            <Skeleton height={10} radius={999} />
          </GlassCard>
        </>
      ) : report.isError ? (
        <EmptyState
          icon="error"
          title={t('error')}
          action={{ title: tc('buttons.retry'), onPress: () => void report.refetch() }}
        />
      ) : data ? (
        <>
          <View>
            <SectionLabel>{t('tickets.title')}</SectionLabel>
            <View style={styles.tiles}>
              <GlassCard style={styles.tile}>
                <Text style={[styles.big, { color: colors.label }]}>{data.tickets.total}</Text>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('tickets.total')}
                </Text>
              </GlassCard>
              <GlassCard style={styles.tile}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.big, { color: colors.label }]}
                >
                  {avgLabel}
                </Text>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('tickets.avgResolution')}
                </Text>
              </GlassCard>
            </View>
          </View>

          {data.tickets.total === 0 ? (
            <GlassCard style={styles.card}>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('tickets.empty')}
              </Text>
            </GlassCard>
          ) : (
            <>
              <GlassCard style={styles.card}>
                <Text style={[styles.title, { color: colors.label }]}>
                  {t('tickets.byStatus')}
                </Text>
                {TICKET_STATUSES.map((s) => (
                  <BarRow
                    key={s}
                    label={tt(`status.${s}`)}
                    value={data.tickets.byStatus[s]}
                    max={maxStatus}
                    color={colors.tint}
                  />
                ))}
              </GlassCard>
              <GlassCard style={styles.card}>
                <Text style={[styles.title, { color: colors.label }]}>
                  {t('tickets.byCategory')}
                </Text>
                {categoryRows.map((row) => (
                  <BarRow
                    key={row.key}
                    label={tt(`category.${row.key}`)}
                    value={row.count}
                    max={maxCategory}
                    color={row.color}
                  />
                ))}
              </GlassCard>
            </>
          )}

          <View>
            <SectionLabel>{t('dues.title')}</SectionLabel>
            {data.dues.count === 0 ? (
              <GlassCard style={styles.card}>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('dues.empty')}
                </Text>
              </GlassCard>
            ) : (
              <View style={styles.group}>
                <GlassCard style={styles.card}>
                  <BarRow
                    label={t('dues.collectionRate')}
                    value={data.dues.rate ?? 0}
                    max={1}
                    color={colors.green}
                    valueLabel={`${Math.round((data.dues.rate ?? 0) * 100)}%`}
                  />
                </GlassCard>
                <View style={styles.tiles}>
                  <GlassCard style={styles.tile}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.big, { color: colors.green }]}
                    >
                      {fmt.money(data.dues.collected)}
                    </Text>
                    <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                      {t('dues.collected')}
                    </Text>
                  </GlassCard>
                  <GlassCard style={styles.tile}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.big, { color: colors.label }]}
                    >
                      {fmt.money(data.dues.expected)}
                    </Text>
                    <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                      {t('dues.expected')}
                    </Text>
                  </GlassCard>
                </View>
                <GlassCard style={styles.tile}>
                  <Text
                    style={[
                      styles.big,
                      { color: data.dues.overdueTotal > 0 ? colors.red : colors.label },
                    ]}
                  >
                    {fmt.money(data.dues.overdueTotal)}
                  </Text>
                  <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                    {t('dues.overdueTotal')}
                  </Text>
                </GlassCard>
              </View>
            )}
          </View>

          {data.tickets.total > 0 ? (
            <GlassCard style={styles.card}>
              <Text style={[styles.title, { color: colors.label }]}>{t('top.title')}</Text>
              {categoryRows
                .filter((r) => r.count > 0)
                .slice(0, 3)
                .map((row, index) => (
                  <View key={row.key} style={styles.topRow}>
                    <Text style={[styles.rank, { color: colors.secondaryLabel }]}>{index + 1}</Text>
                    <Text style={[styles.topLabel, { color: colors.label }]}>
                      {tt(`category.${row.key}`)}
                    </Text>
                    <Text style={[styles.topCount, { color: colors.label }]}>{row.count}</Text>
                  </View>
                ))}
            </GlassCard>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl },
  periodBlock: { gap: space.sm },
  range: { ...type.caption, textAlign: 'center' },
  card: { gap: space.lg },
  group: { gap: space.md },
  title: { ...type.headline },
  tiles: { flexDirection: 'row', gap: space.md },
  tile: { flex: 1, gap: space.xs },
  big: { ...type.stat, fontVariant: ['tabular-nums'] },
  caption: { ...type.small },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rank: { width: 20, ...type.bodyStrong, fontVariant: ['tabular-nums'] },
  topLabel: { flex: 1, ...type.body },
  topCount: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
});
