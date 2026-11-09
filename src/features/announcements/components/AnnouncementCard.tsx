import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

import { formatRelative } from '../format';
import type { Announcement } from '../types';
import { CategoryBadge } from './CategoryBadge';

/** Leading tile of an announcement: pin glyph when pinned, megaphone otherwise (red if urgent). */
export function AnnouncementTile({
  announcement,
  size = 44,
}: {
  announcement: Pick<Announcement, 'pinned' | 'category'>;
  size?: 28 | 36 | 44 | 56;
}) {
  if (announcement.pinned)
    return (
      <IconTile symbol={{ ios: 'pin.fill', android: 'push_pin' }} size={size} tone="tint" solid />
    );
  return (
    <IconTile
      name="announcement"
      size={size}
      tone={announcement.category === 'urgent' ? 'red' : 'tint'}
    />
  );
}

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
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={announcement.pinned ? `${t('pinned')}, ${announcement.title}` : undefined}
      onPress={onPress}
    >
      <GlassCard
        flat={Platform.OS === 'android'}
        style={[styles.card, announcement.pinned && { backgroundColor: colors.tintSoft }]}>
        <AnnouncementTile announcement={announcement} />
        <View style={styles.main}>
          <Text style={[styles.title, { color: colors.label }]} numberOfLines={2}>
            {announcement.title}
          </Text>
          {announcement.body ? (
            <Text numberOfLines={2} style={[styles.body, { color: colors.secondaryLabel }]}>
              {announcement.body}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <CategoryBadge category={announcement.category} />
            <Text style={[styles.meta, { color: colors.secondaryLabel }]} numberOfLines={1}>
              {author} · {formatRelative(announcement.created_at, i18n.language)}
            </Text>
          </View>
        </View>
      </GlassCard>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  main: { flex: 1, flexShrink: 1, gap: space.xs },
  title: { ...type.headline },
  body: { ...type.small },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  meta: { ...type.caption, flexShrink: 1 },
});
