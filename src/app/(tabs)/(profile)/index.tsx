import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { HeroCard, HeroEyebrow } from '@/components/HeroCard';
import type { IconName } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableRow } from '@/components/PressableRow';
import { SectionLabel } from '@/components/SectionLabel';
import { Segmented } from '@/components/Segmented';
import { Enter } from '@/features/manage/components/Enter';
import { useUnreadCount } from '@/features/notifications/api';
import { clearPushToken } from '@/features/notifications/push';
import { useResidence, useUpdateProfile } from '@/features/profile/api';
import { setAppLanguage } from '@/i18n/locale';
import { supportedLanguages, type SupportedLanguage } from '@/i18n/resources';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View>
      {title ? <SectionLabel>{title}</SectionLabel> : null}
      <GlassCard padding={0}>{children}</GlassCard>
    </View>
  );
}

/** Stacked account row: small secondary label above, value in body. */
function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.row,
        !last && {
          borderBottomColor: colors.separator,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.secondaryLabel }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.label }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const language = useTranslation().i18n.language;
  const colors = useColors();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.fact}>
      <HeroEyebrow numberOfLines={1}>{label.toLocaleUpperCase(language)}</HeroEyebrow>
      <Text style={[styles.factValue, { color: colors.onHero }]} numberOfLines={2}>
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
  const unread = useUnreadCount();
  const unreadCount = unread.data ?? 0;
  const residence = useResidence(profile?.building_id ?? null, profile?.unit_id ?? null);
  const [refreshing, setRefreshing] = useState(false);

  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'tr';

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([unread.refetch(), residence.refetch()]);
    setRefreshing(false);
  };

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

  const roleLabel = t(`roles.${role}`);
  const block = residence.data?.block;
  const number = residence.data?.number;
  const unitShort = number ? (block ? `${block}-${number}` : number) : null;
  const memberSince = profile?.created_at
    ? new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' }).format(
        new Date(profile.created_at),
      )
    : null;

  const facts: { key: string; label: string; value: string }[] = [];
  if (residence.data?.buildingName)
    facts.push({ key: 'building', label: t('building'), value: residence.data.buildingName });
  if (unitShort) facts.push({ key: 'unit', label: t('unit'), value: unitShort });
  if (memberSince) facts.push({ key: 'since', label: t('memberSince'), value: memberSince });

  const shortcuts: {
    key: string;
    icon: IconName;
    title: string;
    href: '/reservations' | '/notifications';
    value?: string;
  }[] = [
    {
      key: 'reservations',
      icon: 'calendar',
      title: tTabs('screens.reservations'),
      href: '/reservations',
    },
    {
      key: 'notifications',
      icon: 'bell',
      title: tTabs('screens.notifications'),
      href: '/notifications',
      value: unreadCount > 0 ? String(unreadCount) : undefined,
    },
  ];

  return (
    <ScrollView
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <Enter index={0}>
        <HeroCard>
          <View style={styles.identity}>
            <Avatar name={profile?.full_name} size={72} inverted />
            {profile?.full_name ? (
              <Text
                accessibilityRole="header"
                style={[styles.name, { color: colors.onHero }]}
                numberOfLines={2}
              >
                {profile.full_name}
              </Text>
            ) : null}
            {user?.email ? (
              <Text style={[styles.email, { color: colors.onHero }]} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
            <Badge label={roleLabel} tone="tint" style={styles.roleBadge} />
          </View>
          {facts.length > 0 ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.onHero }]} />
              <View style={styles.facts}>
                {facts.map((f) => (
                  <Fact key={f.key} label={f.label} value={f.value} />
                ))}
              </View>
            </>
          ) : null}
        </HeroCard>
      </Enter>

      <Enter index={1}>
        <Group title={t('account')}>
          <Row label={t('name')} value={profile?.full_name || '-'} />
          <Row label={t('email')} value={user?.email ?? '-'} />
          <Row label={t('phone')} value={profile?.phone || t('phonePlaceholder')} />
          <Row label={t('role')} value={roleLabel} />
          <PressableRow
            title={t('edit.title')}
            tone="accent"
            chevron
            onPress={() => router.push('/edit')}
            last
          />
        </Group>
      </Enter>

      <Enter index={2}>
        <View>
          <SectionLabel>{t('language.title')}</SectionLabel>
          <GlassCard padding={space.sm}>
            <Segmented
              values={supportedLanguages.map((l) => t(`language.${l}`))}
              selectedIndex={supportedLanguages.indexOf(language)}
              onChange={(index) => {
                const next = supportedLanguages[index];
                if (next) changeLanguage(next);
              }}
            />
          </GlassCard>
        </View>
      </Enter>

      <Enter index={3}>
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
      </Enter>

      <Enter index={4}>
        <GlassCard padding={0}>
          <PressableRow title={t('signOut.button')} destructive onPress={confirmSignOut} last />
        </GlassCard>
      </Enter>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl + space.xl },
  identity: { alignItems: 'center', gap: space.xs },
  roleBadge: { alignSelf: 'center', marginTop: space.sm },
  name: { ...type.stat, textAlign: 'center', marginTop: space.sm, alignSelf: 'stretch' },
  email: { ...type.small, textAlign: 'center', opacity: 0.85, marginBottom: space.sm },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.3, marginTop: space.xl },
  facts: { flexDirection: 'row', marginTop: space.lg },
  fact: { flex: 1, gap: space.xs, paddingHorizontal: space.sm, alignItems: 'center' },
  factValue: { ...type.bodyStrong, textAlign: 'center' },
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
  label: { ...type.caption },
  value: { ...type.body },
});
