import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/colors';

import type { DueStatus } from '../types';

/** Small capsule: paid green, unpaid secondary, overdue red. */
export function DueStatusBadge({ status }: { status: DueStatus }) {
  const { t } = useTranslation('dues');
  const colors = useColors();
  const color =
    status === 'paid' ? colors.green : status === 'overdue' ? colors.red : colors.secondaryLabel;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 13, fontWeight: '600' },
});
