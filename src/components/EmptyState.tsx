import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/theme/colors';
import { radius, type } from '@/theme/tokens';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  message?: string;
  /** Rendered as a tonal button under the message. */
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon = 'empty', title, message, action }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: colors.secondarySystemBackground }]}>
        <Icon name={icon} size={32} color={colors.secondaryLabel} />
      </View>
      <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.secondaryLabel }]}>{message}</Text>
      ) : null}
      {action ? (
        <View style={styles.action}>
          <PrimaryButton variant="tonal" title={action.title} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { ...type.title, textAlign: 'center' },
  message: { ...type.body, textAlign: 'center' },
  action: { marginTop: 12 },
});
