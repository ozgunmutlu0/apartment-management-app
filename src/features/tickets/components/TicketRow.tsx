import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

import type { TicketListItem } from '../api';
import { formatRelative, unitLabel } from '../format';
import { CATEGORY_ICONS } from './CategoryIcon';
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
    <PressableScale accessibilityRole="button" onPress={onPress}>
      <GlassCard style={styles.row}>
        <IconTile symbol={CATEGORY_ICONS[ticket.category]} size={44} />
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
        <Icon name="chevron" size={14} color={colors.tertiaryLabel} />
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  body: { flex: 1, gap: space.sm },
  title: { ...type.headline },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: space.sm,
    rowGap: space.xs,
  },
  secondary: { ...type.caption },
});
