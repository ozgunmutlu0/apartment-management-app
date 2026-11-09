import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';

import { TextField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useUpdateProfile } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

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
      {...scrollProps}
      style={{ backgroundColor: colors.systemGroupedBackground }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <GlassCard style={styles.card}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.secondaryLabel }]}>{t('name')}</Text>
          <TextField
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
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.secondaryLabel }]}>{t('phone')}</Text>
          <TextField
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
        </View>
      </GlassCard>
      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton title={tc('buttons.save')} loading={update.isPending} onPress={save} />
      <PrimaryButton variant="plain" title={tc('buttons.cancel')} onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  card: { gap: space.lg },
  field: { gap: space.sm },
  label: { ...type.label },
  error: { ...type.small },
});
