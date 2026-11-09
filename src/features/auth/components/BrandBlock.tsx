import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/IconTile';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

/** Brand mark, app name and slogan, shown at the top of the auth screens. */
export function BrandBlock({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { t } = useTranslation('common');
  const colors = useColors();
  return (
    <View style={styles.block}>
      <IconTile symbol={{ ios: 'building.2.fill', android: 'apartment' }} size={56} />
      <View style={styles.text}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.label }]}>
          {title ?? t('appName')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          {subtitle ?? t('slogan')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.lg, alignItems: 'flex-start' },
  text: { gap: space.xs },
  title: { ...type.display },
  subtitle: { ...type.body },
});
