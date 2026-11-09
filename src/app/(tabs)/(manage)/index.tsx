import { useRouter, type Href } from 'expo-router';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { Icon } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

type MenuItem = {
  href: Href;
  title: string;
  subtitle: string;
  symbol: { ios: SFSymbol; android: AndroidSymbol };
};

export default function ManageScreen() {
  const { t } = useTranslation('manage');
  const colors = useColors();
  const router = useRouter();

  const items: MenuItem[] = [
    {
      href: '/(tabs)/(manage)/dues',
      title: t('dues'),
      subtitle: t('duesSubtitle'),
      symbol: { ios: 'creditcard.fill', android: 'payments' },
    },
    {
      href: '/(tabs)/(manage)/reports',
      title: t('reports'),
      subtitle: t('reportsSubtitle'),
      symbol: { ios: 'chart.bar.fill', android: 'bar_chart' },
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      {items.map((item) => (
        <PressableScale
          key={item.title}
          accessibilityRole="button"
          onPress={() => router.push(item.href)}
        >
          <GlassCard style={styles.card}>
            <IconTile symbol={item.symbol} size={56} />
            <View style={styles.text}>
              <Text style={[styles.title, { color: colors.label }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
                {item.subtitle}
              </Text>
            </View>
            <Icon name="chevron" size={14} color={colors.tertiaryLabel} />
          </GlassCard>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  text: { flex: 1, gap: space.xs },
  title: { ...type.headline },
  subtitle: { ...type.small },
});
