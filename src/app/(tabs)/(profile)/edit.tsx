import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, type TextInputInstance } from 'react-native';

import { AuthField } from '@/components/AuthField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUpdateProfile } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

/** Presented as a formSheet (see (profile)/_layout.tsx). */
export default function EditProfileScreen() {
  const { t } = useTranslation('profile');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
  const router = useRouter();
  const { profile } = useAuth();
  const update = useUpdateProfile();
  const phoneRef = useRef<TextInputInstance>(null);
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) {
      setError(t('edit.nameRequired'));
      return;
    }
    setError(null);
    update.mutate(
      { full_name: name.trim(), phone: phone.trim() || null },
      {
        onSuccess: () => router.back(),
        onError: () => setError(t('edit.error')),
      },
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AuthField
        value={name}
        onChangeText={setName}
        placeholder={t('edit.namePlaceholder')}
        accessibilityLabel={t('name')}
        textContentType="name"
        autoComplete="name"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <AuthField
        ref={phoneRef}
        value={phone}
        onChangeText={setPhone}
        placeholder={t('edit.phonePlaceholder')}
        accessibilityLabel={t('phone')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        returnKeyType="done"
        onSubmitEditing={save}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.red }}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton title={tc('buttons.save')} loading={update.isPending} onPress={save} />
      <PrimaryButton variant="plain" title={tc('buttons.cancel')} onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
});
