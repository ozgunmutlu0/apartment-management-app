import { useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

import { QuickActions, type QuickAction } from '@/features/home/components/parts';
import {
  ManagerSections,
  ResidentSections,
  TechnicianSections,
} from '@/features/home/components/sections';
import { useResidence } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const colors = useColors();
  const queryClient = useQueryClient();
  const { profile, role } = useAuth();
  const residence = useResidence(profile?.building_id ?? null, profile?.unit_id ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const title = firstName ? t('greeting', { name: firstName }) : t('greetingNoName');

  const building = residence.data?.buildingName;
  const unit = residence.data?.number
    ? residence.data.block
      ? `${residence.data.block}-${residence.data.number}`
      : residence.data.number
    : null;
  const subtitle = building
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

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>{subtitle}</Text>
        ) : null}
        {actions.length > 0 ? <QuickActions actions={actions} /> : null}
        {role === 'resident' ? (
          <ResidentSections />
        ) : role === 'manager' ? (
          <ManagerSections />
        ) : (
          <TechnicianSections />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 22 },
  subtitle: { fontSize: 15, marginTop: -8 },
});
