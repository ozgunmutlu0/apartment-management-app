import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { PressableRow } from '@/components/PressableRow';
import { clearPushToken } from '@/features/notifications/push';
import { useResidence, useUpdateProfile } from '@/features/profile/api';
import { setAppLanguage } from '@/i18n/locale';
import { supportedLanguages, type SupportedLanguage } from '@/i18n/resources';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

function Group({ title, children }: { title?: string; children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.group}>
      {title ? (
        <Text style={[styles.groupTitle, { color: colors.secondaryLabel }]}>
          {title.toLocaleUpperCase()}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.secondarySystemGroupedBackground }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <Text style={[styles.label, { color: colors.label }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.secondaryLabel }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation('profile');
  const { t: tTabs } = useTranslation('tabs');
  const { t: tCommon } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const { profile, user, role, signOut } = useAuth();
  const updateProfile = useUpdateProfile();
  const residence = useResidence(profile?.building_id ?? null, profile?.unit_id ?? null);

  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'tr';

  const changeLanguage = (lang: SupportedLanguage) => {
    if (lang === language) return;
    void setAppLanguage(lang); // immediate UI switch + local persistence
    updateProfile.mutate({ locale: lang }); // best-effort sync to profiles.locale
  };

  const doSignOut = async () => {
    try {
      await clearPushToken(user?.id); // best effort, never blocks sign-out
      await signOut();
    } catch {
      Alert.alert(t('signOut.error'));
    }
  };

  const confirmSignOut = () => {
    Alert.alert(t('signOut.title'), t('signOut.message'), [
      { text: t('signOut.button'), style: 'destructive', onPress: () => void doSignOut() },
      { text: tCommon('buttons.cancel'), style: 'cancel' },
    ]);
  };

  const unitValue =
    residence.data?.block && residence.data.number
      ? t('unitValue', { block: residence.data.block, number: residence.data.number })
      : '-';

  const shortcuts: { key: string; icon: IconName; title: string; href: '/reservations' | '/notifications' }[] = [
    { key: 'reservations', icon: 'reservation', title: tTabs('screens.reservations'), href: '/reservations' },
    { key: 'notifications', icon: 'notification', title: tTabs('screens.notifications'), href: '/notifications' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Group title={t('account')}>
        <Row label={t('name')} value={profile?.full_name ?? '-'} />
        <Row label={t('email')} value={user?.email ?? '-'} />
        <Row label={t('phone')} value={profile?.phone || t('phonePlaceholder')} />
        <Row label={t('role')} value={t(`roles.${role}`)} last />
      </Group>
      <Group>
        <PressableRow title={t('edit.title')} onPress={() => router.push('/edit')} last />
      </Group>

      <Group title={t('residence')}>
        <Row label={t('building')} value={residence.data?.buildingName ?? '-'} />
        <Row label={t('unit')} value={unitValue} last />
      </Group>

      <Group title={t('language.title')}>
        <View style={styles.segment}>
          <SegmentedControl
            values={supportedLanguages.map((l) => t(`language.${l}`))}
            selectedIndex={supportedLanguages.indexOf(language)}
            onChange={(e) => {
              const next = supportedLanguages[e.nativeEvent.selectedSegmentIndex];
              if (next) changeLanguage(next);
            }}
          />
        </View>
      </Group>

      <Group title={t('shortcuts')}>
        {shortcuts.map((item, index) => (
          <PressableRow
            key={item.key}
            title={item.title}
            icon={<Icon name={item.icon} size={22} />}
            onPress={() => router.push(item.href)}
            last={index === shortcuts.length - 1}
          />
        ))}
      </Group>

      <Group>
        <PressableRow title={t('signOut.button')} destructive onPress={confirmSignOut} last />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  group: { gap: 6 },
  groupTitle: { fontSize: 13, marginLeft: 16 },
  card: { borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: { fontSize: 17 },
  value: { fontSize: 17, flexShrink: 1, textAlign: 'right' },
  segment: { padding: 8 },
});
