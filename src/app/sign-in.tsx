import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';

import { AuthField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/authErrors';
import { useColors } from '@/theme/colors';
import { type } from '@/theme/tokens';

const DEMO_PASSWORD = 'Demo1234!';
const DEMO_ACCOUNTS = [
  'manager@fixmybuilding.app',
  'resident@fixmybuilding.app',
  'resident2@fixmybuilding.app',
  'tech@fixmybuilding.app',
] as const;

export default function SignInScreen() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const colors = useColors();
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
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.label }]}>{tc('appName')}</Text>
          <Text style={[styles.slogan, { color: colors.secondaryLabel }]}>{tc('slogan')}</Text>
        </View>

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
          <Text style={{ color: colors.secondaryLabel }}>{t('signIn.noAccount')}</Text>
          <Link href="/sign-up" style={{ color: colors.tint, fontWeight: '600' }}>
            {t('signIn.createAccount')}
          </Link>
        </View>

        {__DEV__ ? (
          <View style={styles.demo}>
            <Text style={[styles.demoTitle, { color: colors.secondaryLabel }]}>
              {t('signIn.demoAccounts')}
            </Text>
            {DEMO_ACCOUNTS.map((demo) => (
              <Pressable
                key={demo}
                onPress={() => {
                  setEmail(demo);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
              >
                <Text style={{ color: colors.tint, fontSize: 15 }}>{demo}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header: { gap: 8, marginBottom: 8 },
  appName: { ...type.display },
  slogan: { ...type.body },
  form: { gap: 12 },
  error: { ...type.small },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  demo: { alignItems: 'center', gap: 8, marginTop: 8 },
  demoTitle: { fontSize: 13 },
});
