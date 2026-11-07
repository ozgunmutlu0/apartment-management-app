import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { useDuesFormat } from '@/features/dues/utils';
import { REPORT_PERIODS, useReport, type ReportPeriod } from '@/features/reports/api';
import { BarRow } from '@/features/reports/components/BarRow';
import { TICKET_CATEGORIES, TICKET_STATUSES } from '@/features/tickets/types';
import { useColors, useStatusColors } from '@/theme/colors';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation('reports');
  const { t: tt } = useTranslation('tickets');
  const colors = useColors();
  const statusColors = useStatusColors();
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
  const categoryColors = [
    colors.tint,
    colors.orange,
    colors.green,
    colors.purple,
    colors.teal,
    colors.indigo,
    colors.red,
  ];

  const categoryRows = data
    ? TICKET_CATEGORIES.map((c, i) => ({
        key: c,
        count: data.tickets.byCategory[c],
        color: categoryColors[i % categoryColors.length],
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

      {report.isPending ? (
        <ActivityIndicator style={styles.loader} />
      ) : report.isError ? (
        <EmptyState icon="error" title={t('error')} />
      ) : data ? (
        <>
          <GlassCard style={styles.card}>
            <Text style={[styles.title, { color: colors.label }]}>{t('tickets.title')}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={[styles.big, { color: colors.label }]}>{data.tickets.total}</Text>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('tickets.total')}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.big, { color: colors.label }]}>{avgLabel}</Text>
                <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                  {t('tickets.avgResolution')}
                </Text>
              </View>
            </View>
            {data.tickets.total === 0 ? (
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('tickets.empty')}
              </Text>
            ) : (
              <>
                <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
                  {t('tickets.byStatus')}
                </Text>
                {TICKET_STATUSES.map((s) => (
                  <BarRow
                    key={s}
                    label={tt(`status.${s}`)}
                    value={data.tickets.byStatus[s]}
                    max={maxStatus}
                    color={statusColors[s]}
                  />
                ))}
                <Text style={[styles.sub, { color: colors.secondaryLabel }]}>
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
              </>
            )}
          </GlassCard>

          <GlassCard style={styles.card}>
            <Text style={[styles.title, { color: colors.label }]}>{t('dues.title')}</Text>
            {data.dues.count === 0 ? (
              <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                {t('dues.empty')}
              </Text>
            ) : (
              <>
                <BarRow
                  label={t('dues.collectionRate')}
                  value={data.dues.rate ?? 0}
                  max={1}
                  color={colors.green}
                  valueLabel={`${Math.round((data.dues.rate ?? 0) * 100)}%`}
                />
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={[styles.big, { color: colors.green }]}>
                      {fmt.money(data.dues.collected)}
                    </Text>
                    <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                      {t('dues.collected')}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.big, { color: colors.label }]}>
                      {fmt.money(data.dues.expected)}
                    </Text>
                    <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
                      {t('dues.expected')}
                    </Text>
                  </View>
                </View>
                <View style={styles.stat}>
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
                </View>
              </>
            )}
          </GlassCard>

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
                    <Text style={[styles.topCount, { color: row.color }]}>{row.count}</Text>
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
  content: { padding: 16, gap: 14 },
  loader: { marginTop: 24 },
  range: { fontSize: 13, textAlign: 'center' },
  card: { gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, textTransform: 'uppercase', marginTop: 4 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 2 },
  big: { fontSize: 22, fontWeight: '700' },
  caption: { fontSize: 13 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 20, fontSize: 17, fontWeight: '600' },
  topLabel: { flex: 1, fontSize: 17 },
  topCount: { fontSize: 17, fontWeight: '700' },
});
