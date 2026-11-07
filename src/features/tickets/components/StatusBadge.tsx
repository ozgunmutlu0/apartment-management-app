import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useStatusColors } from '@/theme/colors';

import type { TicketStatus } from '../types';

/** Capsule with a colored dot and the localized status name. */
export function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation('tickets');
  const colors = useStatusColors();
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: colors[status] }]} />
      <Text style={[styles.label, { color: colors[status] }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 13, fontWeight: '500' },
});
