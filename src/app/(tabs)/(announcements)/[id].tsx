import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Skeleton } from '@/components/Skeleton';
import { useAnnouncement } from '@/features/announcements/api';
import { AnnouncementActionsMenu } from '@/features/announcements/components/AnnouncementActionsMenu';
import { AnnouncementTile } from '@/features/announcements/components/AnnouncementCard';
import { CategoryBadge } from '@/features/announcements/components/CategoryBadge';
import { useAnnouncementActions } from '@/features/announcements/components/useAnnouncementActions';
import { formatDateTime } from '@/features/announcements/format';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { radius, space, type } from '@/theme/tokens';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation('announcements');
  const colors = useColors();
  const router = useRouter();
  const { role } = useAuth();
  const { data, isPending, isError } = useAnnouncement(id);
  const { pin, confirmDelete } = useAnnouncementActions();
  const isManager = role === 'manager';

  if (isPending) {
    return (
      <View style={[styles.content, { backgroundColor: colors.systemGroupedBackground }]}>
        <View style={styles.header}>
          <Skeleton width={56} height={56} />
          <View style={styles.headerText}>
            <Skeleton width="85%" height={26} />
            <Skeleton width="50%" height={14} />
          </View>
        </View>
        <GlassCard style={styles.bodyCard}>
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton width="60%" height={16} />
        </GlassCard>
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={styles.center}>
        <EmptyState icon="error" title={isError ? t('errors.load') : t('notFound')} />
      </View>
    );
  }

  const author = data.author?.full_name ?? t('unknownAuthor');

  return (
    <>
      {isManager ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <AnnouncementActionsMenu
                announcement={data}
                onEdit={() =>
                  router.push({ pathname: '/(tabs)/(announcements)/new', params: { id: data.id } })
                }
                onTogglePin={() => pin(data)}
                onDelete={() => confirmDelete(data, () => router.back())}
              >
                <View accessible accessibilityRole="button" accessibilityLabel={t('actions.more')}>
                  <SymbolView
                    name={{ ios: 'ellipsis.circle', android: 'more_vert' }}
                    size={24}
                    tintColor={colors.tint}
                  />
                </View>
              </AnnouncementActionsMenu>
            ),
          }}
        />
      ) : null}
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <AnnouncementTile announcement={data} size={56} />
          <View style={styles.headerText}>
            <Text
              selectable
              accessibilityRole="header"
              style={[styles.title, { color: colors.label }]}
            >
              {data.title}
            </Text>
            <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
              {t('by')} {author} · {formatDateTime(data.created_at, i18n.language)}
            </Text>
          </View>
        </View>
        <View style={styles.badges}>
          <CategoryBadge category={data.category} />
          {data.pinned ? (
            <View style={[styles.pinned, { backgroundColor: colors.tintSoft }]}>
              <SymbolView
                name={{ ios: 'pin.fill', android: 'push_pin' }}
                size={12}
                tintColor={colors.tint}
              />
              <Text style={[styles.pinnedText, { color: colors.tint }]}>{t('pinned')}</Text>
            </View>
          ) : null}
        </View>
        {data.body ? (
          <GlassCard style={styles.bodyCard}>
            <Text selectable style={[styles.body, { color: colors.label }]}>
              {data.body}
            </Text>
          </GlassCard>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl + space.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  headerText: { flex: 1, flexShrink: 1, gap: space.xs },
  badges: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  pinnedText: { ...type.label },
  title: { ...type.title },
  meta: { ...type.small },
  bodyCard: { gap: space.sm },
  body: { ...type.body, lineHeight: 26 },
});
