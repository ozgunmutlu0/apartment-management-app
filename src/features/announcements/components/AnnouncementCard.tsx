import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

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
    <PressableScale accessibilityRole="button" onPress={onPress}>
      <GlassCard style={styles.card}>
        <View style={styles.top}>
          <CategoryBadge category={announcement.category} />
          {announcement.pinned ? (
            <View
              style={[styles.pinned, { backgroundColor: colors.tintSoft }]}
              accessible
              accessibilityLabel={t('pinned')}
            >
              <SymbolView
                name={{ ios: 'pin.fill', android: 'push_pin' }}
                size={12}
                tintColor={colors.tint}
              />
              <Text style={[styles.pinnedText, { color: colors.tint }]}>{t('pinned')}</Text>
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
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pinnedText: { ...type.label },
  title: { ...type.headline },
  body: { ...type.small },
  meta: { ...type.caption, marginTop: space.xs },
});
