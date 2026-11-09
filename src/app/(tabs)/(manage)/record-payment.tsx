import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { useRecordPayment } from '@/features/dues/api';
import { FormGroup, FormRow } from '@/features/dues/components/FormRow';
import { PAYMENT_METHODS } from '@/features/dues/types';
import { parseAmount, useDuesFormat } from '@/features/dues/utils';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

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
          <DateTimePicker
            value={paidAt}
            mode="date"
            display="compact"
            presentation="inline"
            maximumDate={new Date()}
            onValueChange={(_e, date) => setPaidAt(date)}
          />
        </FormRow>
      </FormGroup>

      <View>
        <SectionLabel>{t('manage.record.method')}</SectionLabel>
        <SegmentedControl
        values={PAYMENT_METHODS.map((m) => t(`method.${m}`))}
        selectedIndex={methodIndex}
        onChange={(e) => setMethodIndex(e.nativeEvent.selectedSegmentIndex)}
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
