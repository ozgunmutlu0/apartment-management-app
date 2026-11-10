import { useMemo, useState } from 'react';
import { createLiraFormatter } from '@/lib/money';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { SectionLabel } from '@/components/SectionLabel';
import { Segmented } from '@/components/Segmented';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { REPORT_PERIODS, useReport, type ReportPeriod } from '@/features/reports/api';
import { BarRow } from '@/features/reports/components/BarRow';
import { TICKET_CATEGORIES, TICKET_STATUSES } from '@/features/tickets/types';
import { useColors, useStatusColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

/** Locale-aware decimal; falls back to a manual comma for Turkish if Intl ignores the locale. */
function formatDecimal(value: number, digits: number, language: string): string {
  const fixed = value.toFixed(digits);
  const turkish = language.startsWith('tr');
  try {
    const formatted = new Intl.NumberFormat(language, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
    return turkish && digits > 0 && formatted === fixed ? fixed.replace('.', ',') : formatted;
  } catch {
    return turkish ? fixed.replace('.', ',') : fixed;
  }
}

function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={[styles.title, { color: colors.label }]} accessibilityRole="header">
          {title}
        </Text>
        {caption ? (
          <Text style={[styles.caption, { color: colors.secondaryLabel }]}>{caption}</Text>
        ) : null}
      </View>
      {children}
    </GlassCard>
  );
}

export default function ReportsScreen() {
  const { t, i18n } = useTranslation('reports');
  const { t: tt } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const statusColors = useStatusColors();
  // StatTile figures are one line of 28pt in a half-width card: drop the decimals.
  const money = useMemo(() => createLiraFormatter(i18n.language, 0), [i18n.language]);
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
      ? '-'
      : avg < 48
        ? t('tickets.avgHours', { value: formatDecimal(avg, avg < 10 ? 1 : 0, i18n.language) })
        : t('tickets.avgDays', { value: formatDecimal(avg / 24, 1, i18n.language) });

  return (
    <ScrollView
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.periodBlock}>
        <Segmented
          values={REPORT_PERIODS.map((p) => t(`period.${p}`))}
          selectedIndex={periodIndex}
          onChange={setPeriodIndex}
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
            <GlassCard style={styles.skeletonTile}>
              <Skeleton width={36} height={36} />
              <Skeleton width={60} height={28} />
              <Skeleton width="70%" height={14} />
            </GlassCard>
            <GlassCard style={styles.skeletonTile}>
              <Skeleton width={36} height={36} />
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
              <StatTile
                icon="ticket"
                tone="tint"
                value={data.tickets.total}
                label={t('tickets.total')}
              />
              <StatTile
                icon="clock"
                tone={avg === null ? 'neutral' : 'green'}
                value={avgLabel}
                label={avg === null ? t('tickets.noResolved') : t('tickets.avgResolution')}
              />
            </View>
          </View>

          {data.tickets.total === 0 ? (
            <GlassCard>
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('tickets.empty')}
              </Text>
            </GlassCard>
          ) : (
            <>
              <ChartCard title={t('tickets.byStatus')} caption={t('tickets.byStatusCaption')}>
                {TICKET_STATUSES.map((s) => (
                  <BarRow
                    key={s}
                    label={tt(`status.${s}`)}
                    value={data.tickets.byStatus[s]}
                    max={maxStatus}
                    color={statusColors[s]}
                  />
                ))}
              </ChartCard>
              <ChartCard title={t('tickets.byCategory')} caption={t('tickets.byCategoryCaption')}>
                {categoryRows.map((row) => (
                  <BarRow
                    key={row.key}
                    label={tt(`category.${row.key}`)}
                    value={row.count}
                    max={maxCategory}
                    color={row.color}
                  />
                ))}
              </ChartCard>
            </>
          )}

          <View>
            <SectionLabel>{t('dues.title')}</SectionLabel>
            {data.dues.count === 0 ? (
              <GlassCard>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('dues.empty')}
                </Text>
              </GlassCard>
            ) : (
              <View style={styles.group}>
                <View style={styles.tiles}>
                  <StatTile
                    icon="statusResolved"
                    tone="green"
                    value={money.format(data.dues.collected)}
                    label={t('dues.collected')}
                  />
                  <StatTile
                    icon="dues"
                    tone="tint"
                    value={money.format(data.dues.expected)}
                    label={t('dues.expected')}
                  />
                </View>
                <View style={styles.tiles}>
                  <StatTile
                    icon="error"
                    tone={data.dues.overdueTotal > 0 ? 'red' : 'neutral'}
                    value={money.format(data.dues.overdueTotal)}
                    label={t('dues.overdueTotal')}
                  />
                  <StatTile
                    icon="reports"
                    tone="green"
                    value={`${Math.round((data.dues.rate ?? 0) * 100)}%`}
                    label={t('dues.collectionRate')}
                  />
                </View>
                <ChartCard title={t('dues.collectionRate')} caption={t('dues.rateCaption')}>
                  <BarRow
                    label={t('dues.collected')}
                    value={data.dues.rate ?? 0}
                    max={1}
                    color={colors.green}
                    valueLabel={`${Math.round((data.dues.rate ?? 0) * 100)}%`}
                  />
                </ChartCard>
              </View>
            )}
          </View>

          {data.tickets.total > 0 ? (
            <ChartCard title={t('top.title')}>
              {categoryRows
                .filter((r) => r.count > 0)
                .slice(0, 3)
                .map((row, index) => (
                  <View key={row.key} style={styles.topRow}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.tintSoft }]}>
                      <Text style={[styles.rank, { color: colors.tint }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.topLabel, { color: colors.label }]} numberOfLines={1}>
                      {tt(`category.${row.key}`)}
                    </Text>
                    <Text style={[styles.topCount, { color: colors.label }]}>{row.count}</Text>
                  </View>
                ))}
            </ChartCard>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl + space.xl },
  periodBlock: { gap: space.sm },
  range: { ...type.caption, textAlign: 'center' },
  card: { gap: space.lg },
  cardHead: { gap: 2 },
  group: { gap: space.md },
  title: { ...type.headline },
  tiles: { flexDirection: 'row', gap: space.md },
  skeletonTile: { flex: 1, gap: space.sm },
  caption: { ...type.small },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: { ...type.label, fontVariant: ['tabular-nums'] },
  topLabel: { flex: 1, ...type.body },
  topCount: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
});
