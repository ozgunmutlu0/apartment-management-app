import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { Icon, type IconName } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableRow } from '@/components/PressableRow';
import { SectionLabel } from '@/components/SectionLabel';
import { useUnreadCount } from '@/features/notifications/api';
import { clearPushToken } from '@/features/notifications/push';
import { useResidence, useUpdateProfile } from '@/features/profile/api';
import { setAppLanguage } from '@/i18n/locale';
import { supportedLanguages, type SupportedLanguage } from '@/i18n/resources';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type } from '@/theme/tokens';

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <GlassCard padding={0}>{children}</GlassCard>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.label }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/** First letter of the first and last word, upper-cased with the active language (Turkish i/İ). */
function initialsOf(name: string | null | undefined, locale: string): string | null {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  const first = Array.from(words[0] ?? '')[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1] ?? '')[0] ?? '') : '';
  return (first + last).toLocaleUpperCase(locale);
}

function IdentityHeader({
  name,
  email,
  role,
  locale,
}: {
  name?: string | null;
  email?: string | null;
  role: string;
  locale: string;
}) {
  const colors = useColors();
  const initials = initialsOf(name, locale);
  return (
    <View style={styles.identity}>
      <View style={[styles.avatar, { backgroundColor: colors.tintSoft }]}>
        {initials ? (
          <Text style={[styles.initials, { color: colors.tint }]}>{initials}</Text>
        ) : (
          <Icon name="profile" size={36} color={colors.tint} />
        )}
      </View>
      {name ? <Text style={[styles.name, { color: colors.label }]}>{name}</Text> : null}
      {email ? <Text style={[styles.email, { color: colors.secondaryLabel }]}>{email}</Text> : null}
      <Badge label={role} tone="tint" />
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
  const unreadCount = useUnreadCount().data ?? 0;
  const residence = useResidence(profile?.building_id ?? null, profile?.unit_id ?? null);

  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'tr';

  const changeLanguage = (lang: SupportedLanguage) => {
    if (lang === language) return;
    void setAppLanguage(lang); // immediate UI switch + local persistence
    updateProfile.mutate({ locale: lang }); // best-effort sync to profiles.locale
  };

  const doSignOut = async () => {
    try {
      await clearPushToken(); // best effort, never blocks sign-out
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

  const shortcuts: {
    key: string;
    icon: IconName;
    title: string;
    href: '/reservations' | '/notifications';
    value?: string;
  }[] = [
    {
      key: 'reservations',
      icon: 'reservation',
      title: tTabs('screens.reservations'),
      href: '/reservations',
    },
    {
      key: 'notifications',
      icon: 'notification',
      title: tTabs('screens.notifications'),
      href: '/notifications',
      value: unreadCount > 0 ? String(unreadCount) : undefined,
    },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <IdentityHeader
        name={profile?.full_name}
        email={user?.email}
        role={t(`roles.${role}`)}
        locale={i18n.language}
      />

      <Group title={t('account')}>
        <Row label={t('name')} value={profile?.full_name ?? '-'} />
        <Row label={t('email')} value={user?.email ?? '-'} />
        <Row label={t('phone')} value={profile?.phone || t('phonePlaceholder')} />
        <Row label={t('role')} value={t(`roles.${role}`)} />
        <PressableRow
          title={t('edit.title')}
          tone="accent"
          chevron
          onPress={() => router.push('/edit')}
          last
        />
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
            icon={<IconTile name={item.icon} size={36} />}
            tone="default"
            chevron
            value={item.value}
            onPress={() => router.push(item.href)}
            last={index === shortcuts.length - 1}
          />
        ))}
      </Group>

      <GlassCard padding={0}>
        <PressableRow title={t('signOut.button')} destructive onPress={confirmSignOut} last />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl },
  identity: { alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...type.title },
  name: { ...type.title, textAlign: 'center' },
  email: { ...type.small, textAlign: 'center', marginBottom: space.xs },
  row: {
    minHeight: 48,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  label: { ...type.body },
  value: { ...type.body, flexShrink: 1, textAlign: 'right' },
  segment: { padding: space.sm },
});
