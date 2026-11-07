import { useRouter, type Href } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View, type ColorValue } from 'react-native';

import { useColors } from '@/theme/colors';

type MenuItem = {
  href: Href;
  title: string;
  subtitle: string;
  symbol: { ios: SFSymbol; android: AndroidSymbol };
  color: ColorValue;
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
      color: colors.green,
    },
    {
      href: '/(tabs)/(manage)/reports',
      title: t('reports'),
      subtitle: t('reportsSubtitle'),
      symbol: { ios: 'chart.bar.fill', android: 'bar_chart' },
      color: colors.orange,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <View style={[styles.group, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        {items.map((item, i) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            android_ripple={{ color: colors.separator }}
            style={({ pressed }) => [
              styles.row,
              i > 0 && {
                borderTopColor: colors.separator,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <SymbolView name={item.symbol} size={18} tintColor="#FFFFFF" />
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, { color: colors.label }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
                {item.subtitle}
              </Text>
            </View>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right' }}
              size={14}
              tintColor={colors.secondaryLabel}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  group: { borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
  row: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: { opacity: 0.6 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 17 },
  subtitle: { fontSize: 13 },
});
