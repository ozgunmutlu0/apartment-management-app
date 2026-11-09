import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActions, Reveal, TopBlock, type QuickAction } from '@/features/home/components/parts';
import {
  ManagerHero,
  ManagerSections,
  ResidentHero,
  ResidentSections,
  TechnicianHero,
  TechnicianSections,
} from '@/features/home/components/sections';
import { useUnreadCount } from '@/features/notifications/api';
import { useResidence } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space } from '@/theme/tokens';

function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { profile, role } = useAuth();
  const residence = useResidence(profile?.building_id ?? null, profile?.unit_id ?? null);
  const unread = useUnreadCount().data ?? 0;
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  const building = residence.data?.buildingName;
  const unit = residence.data?.number
    ? residence.data.block
      ? `${residence.data.block}-${residence.data.number}`
      : residence.data.number
    : null;
  const context = building
    ? unit
      ? t('subtitle', { building, unit })
      : t('subtitleBuilding', { building })
    : null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  };

  const actions: QuickAction[] =
    role === 'resident'
      ? [
          {
            key: 'ticket',
            label: t('actions.reportIssue'),
            icon: 'ticket',
            href: '/(tabs)/(tickets)/new',
          },
          {
            key: 'reserve',
            label: t('actions.reserve'),
            icon: 'reservation',
            href: '/(tabs)/(profile)/reservations',
          },
        ]
      : role === 'manager'
        ? [
            {
              key: 'announcement',
              label: t('actions.newAnnouncement'),
              icon: 'announcement',
              href: '/(tabs)/(announcements)/new',
            },
            {
              key: 'dues',
              label: t('actions.duesManagement'),
              icon: 'dues',
              href: '/(tabs)/(manage)/dues',
            },
            {
              key: 'reports',
              label: t('actions.reports'),
              icon: 'reports',
              href: '/(tabs)/(manage)/reports',
            },
          ]
        : [];

  const sectionsStart = actions.length > 0 ? 3 : 2;

  return (
    <View
      style={[styles.root, { backgroundColor: colors.systemGroupedBackground, paddingTop: insets.top }]}
    >
      <StatusBar style="auto" />
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        // The wrapper applies the top inset (no header here), so the system must not add it again.
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          { paddingTop: space.lg },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Reveal index={0}>
          <TopBlock
            fullName={profile?.full_name}
            greeting={t(`greeting.${greetingKey(new Date().getHours())}`)}
            displayName={firstName ?? t('greeting.fallback')}
            context={context}
            unread={unread}
            bellLabel={unread > 0 ? t('bellUnread', { count: unread }) : t('bell')}
            onBellPress={() => router.push('/(tabs)/(home)/notifications')}
          />
        </Reveal>
        <Reveal index={1}>
          {role === 'resident' ? (
            <ResidentHero />
          ) : role === 'manager' ? (
            <ManagerHero />
          ) : (
            <TechnicianHero />
          )}
        </Reveal>
        {actions.length > 0 ? (
          <Reveal index={2}>
            <QuickActions actions={actions} />
          </Reveal>
        ) : null}
        {role === 'resident' ? (
          <ResidentSections startIndex={sectionsStart} />
        ) : role === 'manager' ? (
          <ManagerSections startIndex={sectionsStart} />
        ) : (
          <TechnicianSections startIndex={sectionsStart} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.xl },
});
