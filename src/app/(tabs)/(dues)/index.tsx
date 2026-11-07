import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useResidentDues, useResidentSummary } from '@/features/dues/api';
import { DueStatusBadge } from '@/features/dues/components/DueStatusBadge';
import type { DueWithPayments } from '@/features/dues/types';
import { effectiveStatus, remainingOf, useDuesFormat } from '@/features/dues/utils';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

function SummaryCard() {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const fmt = useDuesFormat();
  const { data } = useResidentSummary();
  if (!data) return null;
  return (
    <GlassCard style={styles.summary}>
      <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
        {t('summary.outstanding')}
      </Text>
      <Text style={[styles.total, { color: colors.label }]} accessibilityRole="header">
        {fmt.money(data.outstanding)}
      </Text>
      {data.overdueCount > 0 ? (
        <Text style={[styles.overdue, { color: colors.red }]}>
          {t('summary.overdue', { count: data.overdueCount })}
        </Text>
      ) : null}
      <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
        {data.nextDueDate
          ? t('summary.nextDue', { date: fmt.date(data.nextDueDate) })
          : data.outstanding === 0
            ? t('summary.allPaid')
            : ''}
      </Text>
    </GlassCard>
  );
}

function DueRow({ due }: { due: DueWithPayments }) {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const fmt = useDuesFormat();
  const status = effectiveStatus(due);
  const lastPayment = due.payments[0];
  const remaining = remainingOf(due);
  const partial = status !== 'paid' && due.payments.length > 0 && remaining > 0;
  return (
    <View style={[styles.row, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
      <View style={styles.rowMain}>
        <Text style={[styles.month, { color: colors.label }]}>{fmt.month(due.period)}</Text>
        <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
          {t('dueOn', { date: fmt.date(due.due_date) })}
        </Text>
        {status === 'paid' && lastPayment ? (
          <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
            {t('paidOn', {
              date: fmt.date(lastPayment.paid_at),
              method: t(`method.${lastPayment.method as 'cash'}`),
            })}
          </Text>
        ) : null}
        {partial ? (
          <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
            {t('remaining', { amount: fmt.money(remaining) })}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.amount, { color: colors.label }]}>
          {fmt.money(Number(due.amount))}
        </Text>
        <DueStatusBadge status={status} />
      </View>
    </View>
  );
}

export default function DuesScreen() {
  const { t } = useTranslation('dues');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const { profile } = useAuth();
  const { data, isLoading, isError, isRefetching, refetch } = useResidentDues();

  const sections = useMemo(() => {
    const byYear = new Map<string, DueWithPayments[]>();
    for (const due of data ?? []) {
      const year = due.period.slice(0, 4);
      byYear.set(year, [...(byYear.get(year) ?? []), due]);
    }
    return [...byYear].map(([title, items]) => ({ title, data: items }));
  }, [data]);

  if (!profile?.unit_id) {
    return (
      <View style={styles.center}>
        <EmptyState icon="dues" title={t('noUnit.title')} message={t('noUnit.message')} />
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={styles.center}>
        <EmptyState icon="error" title={t('error')} />
        <PrimaryButton variant="plain" title={tc('buttons.retry')} onPress={() => void refetch()} />
      </View>
    );
  }

  return (
    <SectionList
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<SummaryCard />}
      ListFooterComponent={
        <Text style={[styles.info, { color: colors.secondaryLabel }]}>{t('info')}</Text>
      }
      ListEmptyComponent={
        isLoading ? undefined : (
          <EmptyState icon="dues" title={t('empty.title')} message={t('empty.message')} />
        )
      }
      renderSectionHeader={({ section }) => (
        <Text style={[styles.section, { color: colors.secondaryLabel }]}>{section.title}</Text>
      )}
      renderItem={({ item }) => <DueRow due={item} />}
      ItemSeparatorComponent={() => (
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  summary: { gap: 4, marginTop: 8, marginBottom: 8 },
  caption: { fontSize: 15 },
  total: { fontSize: 34, fontWeight: '700' },
  overdue: { fontSize: 15, fontWeight: '600' },
  section: { fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 6, marginLeft: 4 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    justifyContent: 'space-between',
  },
  rowMain: { flex: 1, gap: 2 },
  rowEnd: { alignItems: 'flex-end', gap: 6 },
  month: { fontSize: 17, fontWeight: '500' },
  detail: { fontSize: 14 },
  amount: { fontSize: 17, fontWeight: '600' },
  info: { fontSize: 13, textAlign: 'center', marginTop: 24, paddingHorizontal: 8 },
});
