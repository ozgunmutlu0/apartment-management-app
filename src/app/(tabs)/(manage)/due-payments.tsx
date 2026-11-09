import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useDeletePayment, useManagerDues } from '@/features/dues/api';
import { PressableScale } from '@/components/PressableScale';
import { FormGroup } from '@/features/dues/components/FormRow';
import { remainingOf, useDuesFormat } from '@/features/dues/utils';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

/** formSheet: payments of one due (view, delete, record another). Params: dueId, period. */
export default function DuePaymentsScreen() {
  const { t } = useTranslation('dues');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const fmt = useDuesFormat();
  const { dueId, period } = useLocalSearchParams<{ dueId: string; period: string }>();
  const { data } = useManagerDues(period);
  const del = useDeletePayment();
  const due = data?.find((d) => d.id === dueId);

  const confirmDelete = (paymentId: string, amount: number) => {
    Alert.alert(
      t('manage.payments.deleteTitle'),
      t('manage.payments.deleteMessage', { amount: fmt.money(amount) }),
      [
        { text: tc('buttons.cancel'), style: 'cancel' },
        {
          text: tc('buttons.delete'),
          style: 'destructive',
          onPress: () =>
            del.mutate(paymentId, {
              onError: () => Alert.alert(t('manage.payments.deleteError')),
            }),
        },
      ],
    );
  };

  if (!due) return <EmptyState icon="dues" title={t('manage.payments.empty')} />;
  const remaining = remainingOf(due);

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
    >
      {due.payments.length === 0 ? (
        <EmptyState icon="dues" title={t('manage.payments.empty')} />
      ) : (
        <FormGroup>
          {due.payments.map((p, i) => (
            <View key={p.id} style={styles.row}>
              <View style={styles.main}>
                <Text style={[styles.amount, { color: colors.label }]}>
                  {fmt.money(Number(p.amount))}
                </Text>
                <Text style={[styles.detail, { color: colors.secondaryLabel }]}>
                  {t('paidOn', {
                    date: fmt.date(p.paid_at),
                    method: t(`method.${p.method as 'cash'}`),
                  })}
                </Text>
              </View>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={tc('buttons.delete')}
                onPress={() => confirmDelete(p.id, Number(p.amount))}
                hitSlop={8}
              >
                <Text style={[styles.delete, { color: colors.red }]}>{tc('buttons.delete')}</Text>
              </PressableScale>
            </View>
          ))}
        </FormGroup>
      )}
      {remaining > 0 ? (
        <PrimaryButton
          title={t('manage.payments.record')}
          onPress={() =>
            router.replace({
              pathname: '/record-payment',
              params: { dueId: due.id, unitLabel: due.unitLabel, remaining: String(remaining) },
            })
          }
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  main: { flex: 1, gap: 2 },
  amount: { ...type.title, fontVariant: ['tabular-nums'] },
  detail: { ...type.small },
  delete: { ...type.bodyStrong },
});
