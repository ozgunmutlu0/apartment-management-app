import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { FilterChips } from '@/components/FilterChips';
import { SectionLabel } from '@/components/SectionLabel';
import { useRecordPayment } from '@/features/dues/api';
import { FormGroup, FormRow } from '@/features/dues/components/FormRow';
import { PAYMENT_METHODS } from '@/features/dues/types';
import { parseAmount, useDuesFormat } from '@/features/dues/utils';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

/** formSheet: record a payment for a due. Params: dueId, unitLabel, remaining. */
export default function RecordPaymentScreen() {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const router = useRouter();
  const fmt = useDuesFormat();
  const { dueId, unitLabel, remaining } = useLocalSearchParams<{
    dueId: string;
    unitLabel: string;
    remaining: string;
  }>();
  const record = useRecordPayment();
  const remainingValue = Number(remaining) || 0;
  const [amount, setAmount] = useState(remainingValue.toFixed(2));
  const [methodIndex, setMethodIndex] = useState(0);
  const [paidAt, setPaidAt] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const value = parseAmount(amount);
    if (!(value > 0)) {
      setError(t('manage.record.invalidAmount'));
      return;
    }
    setError(null);
    record.mutate(
      { dueId, amount: value, method: PAYMENT_METHODS[methodIndex], paidAt },
      {
        onSuccess: () => router.back(),
        onError: () => setError(t('manage.record.error')),
      },
    );
  };

  return (
    <ScrollView
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <FormGroup>
        <FormRow label={t('manage.record.unit')}>
          <Text style={[styles.value, { color: colors.secondaryLabel }]}>{unitLabel}</Text>
        </FormRow>
        <FormRow label={t('manage.record.remaining')}>
          <Text style={[styles.value, { color: colors.secondaryLabel }]}>
            {fmt.money(remainingValue)}
          </Text>
        </FormRow>
        <FormRow label={t('manage.record.amount')}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            accessibilityLabel={t('manage.record.amount')}
            style={[styles.input, { color: colors.label }]}
          />
        </FormRow>
        <FormRow label={t('manage.record.date')}>
          <DateField value={paidAt} onChange={setPaidAt} maximumDate={new Date()} />
        </FormRow>
      </FormGroup>

      <View>
        <SectionLabel>{t('manage.record.method')}</SectionLabel>
        <FilterChips
          options={PAYMENT_METHODS.map((m, i) => ({ key: String(i), label: t(`method.${m}`) }))}
          value={String(methodIndex)}
          onChange={(key) => setMethodIndex(Number(key))}
          inset={space.lg}
        />
      </View>

      {error ? <Text style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
      <PrimaryButton title={t('manage.record.save')} loading={record.isPending} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  value: { ...type.body, fontVariant: ['tabular-nums'] },
  input: { ...type.bodyStrong, minWidth: 100, textAlign: 'right', fontVariant: ['tabular-nums'] },
  error: { ...type.small, marginLeft: space.xs },
});
