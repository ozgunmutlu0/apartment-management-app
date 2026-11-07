import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useColors } from '@/theme/colors';

import type { AnnouncementCategory } from '../types';
import { CATEGORY_SYMBOLS, categoryColor } from './category';

export function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  const { t } = useTranslation('announcements');
  const colors = useColors();
  const color = categoryColor(category, colors, useColorScheme());
  return (
    <View style={styles.row}>
      <SymbolView name={CATEGORY_SYMBOLS[category]} size={16} tintColor={color} />
      <Text style={[styles.label, { color }]}>{t(`categories.${category}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
});
