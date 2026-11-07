import { StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useColors } from '@/theme/colors';

export type EmptyStateProps = { icon?: IconName; title: string; message?: string };

export function EmptyState({ icon = 'empty', title, message }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Icon name={icon} size={48} color={colors.secondaryLabel} />
      <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.secondaryLabel }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 15, textAlign: 'center' },
});
