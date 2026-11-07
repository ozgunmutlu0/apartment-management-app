import { Picker } from '@expo/ui/community/picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
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

  const inputStyle = [
    styles.input,
    { color: colors.label, backgroundColor: colors.secondarySystemBackground },
  ];

  return (
    <>
      {isEdit ? <Stack.Screen options={{ title: t('form.editTitle') }} /> : null}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.label, { color: colors.secondaryLabel }]}>{t('form.title')}</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('form.title')}
          placeholderTextColor={colors.secondaryLabel}
          maxLength={TITLE_MAX + 20}
          returnKeyType="next"
          style={inputStyle}
        />
        {submitted && titleError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
            {titleError}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.secondaryLabel }]}>{t('form.body')}</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={t('form.body')}
          placeholderTextColor={colors.secondaryLabel}
          multiline
          textAlignVertical="top"
          style={[inputStyle, styles.multiline]}
        />
        {bodyError ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
            {bodyError}
          </Text>
        ) : null}

        <Text style={[styles.label, { color: colors.secondaryLabel }]}>{t('form.category')}</Text>
        <Picker
          selectedValue={category}
          onValueChange={(value) => {
            if (isAnnouncementCategory(value)) setCategory(value);
          }}
        >
          {ANNOUNCEMENT_CATEGORIES.map((c) => (
            <Picker.Item key={c} value={c} label={t(`categories.${c}`)} />
          ))}
        </Picker>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.label }]}>{t('form.pinned')}</Text>
          <Switch value={pinned} onValueChange={setPinned} />
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
  content: { padding: 16, gap: 8 },
  label: { fontSize: 13, marginTop: 8 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    fontSize: 17,
  },
  multiline: { minHeight: 140 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  switchLabel: { fontSize: 17 },
  error: { fontSize: 13 },
});
