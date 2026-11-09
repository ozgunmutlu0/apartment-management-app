import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SelectField } from '@/components/SelectField';
import { SectionLabel } from '@/components/SectionLabel';
import { TextField } from '@/components/AuthField';
import {
  useAnnouncement,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '@/features/announcements/api';
import {
  ANNOUNCEMENT_CATEGORIES,
  BODY_MAX,
  TITLE_MAX,
  isAnnouncementCategory,
  type Announcement,
  type AnnouncementCategory,
} from '@/features/announcements/types';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

export default function AnnouncementFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { role } = useAuth();
  const existing = useAnnouncement(id);

  if (role !== 'manager') return null;
  if (id && existing.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  return <AnnouncementForm id={id} initial={existing.data ?? null} />;
}

function AnnouncementForm({ id, initial }: { id?: string; initial: Announcement | null }) {
  const isEdit = !!id;
  const { t } = useTranslation('announcements');
  const colors = useColors();
  const router = useRouter();
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [category, setCategory] = useState<AnnouncementCategory>(initial?.category ?? 'general');
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = title.trim();
  const titleError = !trimmed
    ? t('validation.titleRequired')
    : title.length > TITLE_MAX
      ? t('validation.titleTooLong', { max: TITLE_MAX })
      : null;
  const bodyError = body.length > BODY_MAX ? t('validation.bodyTooLong', { max: BODY_MAX }) : null;
  const busy = create.isPending || update.isPending;

  const submit = () => {
    setSubmitted(true);
    setError(null);
    if (titleError || bodyError) return;
    const input = { title: trimmed, body, category, pinned };
    const options = {
      onSuccess: () => router.back(),
      onError: () => setError(t('errors.generic')),
    };
    if (isEdit && id) update.mutate({ id, ...input }, options);
    else create.mutate(input, options);
  };

  return (
    <>
      {isEdit ? <Stack.Screen options={{ title: t('form.editTitle') }} /> : null}
      <ScrollView
        {...scrollProps}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
      >
        <View>
          <SectionLabel>{t('form.title')}</SectionLabel>
          <GlassCard padding={space.md} style={styles.group}>
            <TextField
              value={title}
              onChangeText={setTitle}
              placeholder={t('form.title')}
              accessibilityLabel={t('form.title')}
              maxLength={TITLE_MAX + 20}
              returnKeyType="next"
            />
            {submitted && titleError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
                {titleError}
              </Text>
            ) : null}
          </GlassCard>
        </View>

        <View>
          <SectionLabel>{t('form.body')}</SectionLabel>
          <GlassCard padding={space.md} style={styles.group}>
            <TextField
              value={body}
              onChangeText={setBody}
              placeholder={t('form.body')}
              accessibilityLabel={t('form.body')}
              multiline
              textAlignVertical="top"
              style={styles.multiline}
            />
            {bodyError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
                {bodyError}
              </Text>
            ) : null}
          </GlassCard>
        </View>

        <View>
          <SectionLabel>{t('form.category')}</SectionLabel>
          <GlassCard padding={space.md} style={styles.group}>
            <SelectField
              value={category}
              onChange={(value) => {
                if (isAnnouncementCategory(value)) setCategory(value);
              }}
              options={ANNOUNCEMENT_CATEGORIES.map((c) => ({
                value: c,
                label: t(`categories.${c}`),
              }))}
            />
            <View style={[styles.switchRow, { borderTopColor: colors.separator }]}>
              <Text style={[styles.switchLabel, { color: colors.label }]}>{t('form.pinned')}</Text>
              <Switch
                value={pinned}
                onValueChange={setPinned}
                trackColor={{ false: colors.separator, true: colors.tint }}
                thumbColor={pinned ? colors.onTint : colors.tertiaryLabel}
                ios_backgroundColor={colors.separator}
              />
            </View>
          </GlassCard>
        </View>

        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
            {error}
          </Text>
        ) : null}
        <PrimaryButton
          title={isEdit ? t('form.save') : t('form.create')}
          loading={busy}
          onPress={submit}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.xl },
  group: { gap: space.sm },
  multiline: { minHeight: 140, paddingTop: space.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchLabel: { ...type.body },
  error: { ...type.caption },
});
