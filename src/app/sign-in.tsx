import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';

import { AuthField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { BrandBlock } from '@/features/auth/components/BrandBlock';
import { useAuth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/authErrors';
import { useColors } from '@/theme/colors';
import { hitTarget, space, type } from '@/theme/tokens';

const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  'manager@fixmybuilding.app',
  'resident@fixmybuilding.app',
  'resident2@fixmybuilding.app',
  'tech@fixmybuilding.app',
] as const;

export default function SignInScreen() {
  const { t } = useTranslation('auth');
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('errors.required'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      // On success the root gate swaps screens; nothing else to do here.
    } catch (e) {
      setError(authErrorMessage(e, t));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <BrandBlock />

        <GlassCard style={styles.form}>
          <AuthField
            value={email}
            onChangeText={setEmail}
            placeholder={t('signIn.email')}
            accessibilityLabel={t('signIn.email')}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <AuthField
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            placeholder={t('signIn.password')}
            accessibilityLabel={t('signIn.password')}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton title={t('signIn.submit')} loading={busy} onPress={submit} />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>
            {t('signIn.noAccount')}
          </Text>
          <PrimaryButton
            variant="tonal"
            title={t('signIn.createAccount')}
            onPress={() => router.push('/sign-up')}
          />
        </View>

        {__DEV__ ? (
          <View>
            <SectionLabel>{t('signIn.demoAccounts')}</SectionLabel>
            <GlassCard variant="quiet" padding={0}>
              {DEMO_ACCOUNTS.map((demo, index) => (
                <PressableScale
                  key={demo}
                  accessibilityRole="button"
                  style={[
                    styles.demoItem,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.separator,
                    },
                  ]}
                  onPress={() => {
                    setEmail(demo);
                    setPassword(DEMO_PASSWORD);
                    setError(null);
                  }}
                >
                  <Text style={[styles.demoText, { color: colors.tint }]}>{demo}</Text>
                </PressableScale>
              ))}
            </GlassCard>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xl },
  form: { gap: space.md },
  error: { ...type.small },
  footer: { alignItems: 'stretch', gap: space.md },
  footerText: { ...type.body, textAlign: 'center' },
  demoItem: { minHeight: hitTarget, justifyContent: 'center', paddingHorizontal: space.lg },
  demoText: { ...type.small },
});
