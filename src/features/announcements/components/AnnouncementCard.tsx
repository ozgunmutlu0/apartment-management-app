import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useColors } from '@/theme/colors';

import { formatRelative } from '../format';
import type { Announcement } from '../types';
import { CategoryBadge } from './CategoryBadge';

export function AnnouncementCard({
  announcement,
  onPress,
}: {
  announcement: Announcement;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation('announcements');
  const colors = useColors();
  const author = announcement.author?.full_name ?? t('unknownAuthor');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard style={styles.card}>
        <View style={styles.top}>
          <CategoryBadge category={announcement.category} />
          {announcement.pinned ? (
            <View style={styles.pinned} accessible accessibilityLabel={t('pinned')}>
              <SymbolView
                name={{ ios: 'pin.fill', android: 'push_pin' }}
                size={14}
                tintColor={colors.secondaryLabel}
              />
              <Text style={[styles.pinnedText, { color: colors.secondaryLabel }]}>
                {t('pinned')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.title, { color: colors.label }]}>{announcement.title}</Text>
        {announcement.body ? (
          <Text numberOfLines={2} style={[styles.body, { color: colors.secondaryLabel }]}>
            {announcement.body}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
          {author} · {formatRelative(announcement.created_at, i18n.language)}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinnedText: { fontSize: 12 },
  title: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15 },
  meta: { fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.7 },
});
