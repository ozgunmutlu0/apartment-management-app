import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/theme/colors';

import type { TicketListItem } from '../api';
import { formatRelative, unitLabel } from '../format';
import { CategoryIcon } from './CategoryIcon';
import { StatusBadge } from './StatusBadge';

export type TicketRowProps = {
  ticket: TicketListItem;
  showUnit: boolean;
  onPress: () => void;
};

export function TicketRow({ ticket, showUnit, onPress }: TicketRowProps) {
  const { t } = useTranslation('tickets');
  const colors = useColors();
  const unit = showUnit ? unitLabel(ticket.unit) : null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.secondarySystemGroupedBackground },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <CategoryIcon category={ticket.category} />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.label }]}>
          {ticket.title}
        </Text>
        <View style={styles.meta}>
          <StatusBadge status={ticket.status} />
          <Text style={[styles.secondary, { color: colors.secondaryLabel }]}>
            {formatRelative(ticket.created_at)}
            {unit ? ` · ${t('unit', { label: unit })}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  pressed: { opacity: 0.6 },
  icon: { width: 32, alignItems: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontSize: 17, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 2 },
  secondary: { fontSize: 13 },
});
