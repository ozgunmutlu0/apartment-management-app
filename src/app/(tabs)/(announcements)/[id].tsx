import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { useAnnouncement } from '@/features/announcements/api';
import { AnnouncementActionsMenu } from '@/features/announcements/components/AnnouncementActionsMenu';
import { CategoryBadge } from '@/features/announcements/components/CategoryBadge';
import { useAnnouncementActions } from '@/features/announcements/components/useAnnouncementActions';
import { formatDateTime } from '@/features/announcements/format';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

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
      <View style={styles.center}>
        <ActivityIndicator />
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
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.badges}>
          <CategoryBadge category={data.category} />
          {data.pinned ? (
            <View style={styles.pinned}>
              <SymbolView
                name={{ ios: 'pin.fill', android: 'push_pin' }}
                size={14}
                tintColor={colors.secondaryLabel}
              />
              <Text style={[styles.meta, { color: colors.secondaryLabel }]}>{t('pinned')}</Text>
            </View>
          ) : null}
        </View>
        <Text selectable style={[styles.title, { color: colors.label }]}>
          {data.title}
        </Text>
        <Text style={[styles.meta, { color: colors.secondaryLabel }]}>
          {t('by')} {author} · {formatDateTime(data.created_at, i18n.language)}
        </Text>
        {data.body ? (
          <Text selectable style={[styles.body, { color: colors.label }]}>
            {data.body}
          </Text>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 12 },
  badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5 },
  meta: { fontSize: 13 },
  body: { fontSize: 17, lineHeight: 24, marginTop: 8 },
});
