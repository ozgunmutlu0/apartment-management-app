import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { DateField } from '@/components/DateField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useGenerateDues } from '@/features/dues/api';
import { FormGroup, FormRow } from '@/features/dues/components/FormRow';
import {
  parseAmount,
  parseDateString,
  periodOf,
  toDateString,
  useDuesFormat,
} from '@/features/dues/utils';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

/** formSheet: generate one due per unit for a period. Optional param: period (YYYY-MM-01). */
export default function GenerateDuesScreen() {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const router = useRouter();
  const fmt = useDuesFormat();
  const { period: periodParam } = useLocalSearchParams<{ period?: string }>();
  const generate = useGenerateDues();
  const initial = periodParam ? parseDateString(periodParam) : new Date();
  const [month, setMonth] = useState(initial);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 15),
  );
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const submit = () => {
    const value = parseAmount(amount);
    if (!(value >= 0) || Number.isNaN(value)) {
      setMessage({ text: t('manage.generateSheet.invalidAmount'), error: true });
      return;
    }
    setMessage(null);
    generate.mutate(
      { period: periodOf(month), amount: value, dueDate: toDateString(dueDate) },
      {
        onSuccess: (res) => {
          if (res.created === 0 && res.skipped === 0) {
            setMessage({ text: t('manage.generateSheet.noUnits'), error: true });
            return;
          }
          setMessage({ text: t('manage.generateSheet.result', res), error: false });
          router.back();
        },
        onError: () => setMessage({ text: t('manage.generateSheet.error'), error: true }),
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
        <FormRow label={t('manage.generateSheet.period')}>
          <DateField value={month} onChange={setMonth} />
        </FormRow>
        <FormRow label={t('manage.generateSheet.amount')}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder={fmt.money(0)}
            placeholderTextColor={colors.secondaryLabel}
            keyboardType="decimal-pad"
            accessibilityLabel={t('manage.generateSheet.amount')}
            style={[styles.input, { color: colors.label }]}
          />
        </FormRow>
        <FormRow label={t('manage.generateSheet.dueDate')}>
          <DateField value={dueDate} onChange={setDueDate} />
        </FormRow>
      </FormGroup>
      <Text style={[styles.caption, { color: colors.secondaryLabel }]}>
        {fmt.month(periodOf(month))}
      </Text>
      {message ? (
        <Text
          style={[styles.message, { color: message.error ? colors.red : colors.secondaryLabel }]}
        >
          {message.text}
        </Text>
      ) : null}
      <PrimaryButton
        title={t('manage.generateSheet.submit')}
        loading={generate.isPending}
        onPress={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  input: { ...type.body, minWidth: 120, textAlign: 'right', fontVariant: ['tabular-nums'] },
  caption: { ...type.small, marginLeft: space.xs },
  message: { ...type.small, marginLeft: space.xs },
});
