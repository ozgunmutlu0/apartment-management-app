import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
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
import { PrimaryButton } from '@/components/PrimaryButton';
import { BrandBlock } from '@/features/auth/components/BrandBlock';
import { useAuth } from '@/lib/auth';
import { authErrorMessage } from '@/lib/authErrors';
import { useColors } from '@/theme/colors';
import { space, type, scrollProps } from '@/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const { t } = useTranslation('auth');
  const colors = useColors();
  const router = useRouter();
  const { signUp } = useAuth();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError(t('errors.required'));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('errors.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.passwordShort'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUp(email, password, fullName);
      if (needsEmailConfirmation) {
        setBusy(false);
        Alert.alert(t('signUp.confirmEmailTitle'), t('signUp.confirmEmailMessage'));
      }
      // Otherwise a session exists and the root gate moves on to join-building.
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
        {...scrollProps}
        style={{ backgroundColor: colors.systemGroupedBackground }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <BrandBlock title={t('signUp.title')} />

        <GlassCard style={styles.form}>
          <AuthField
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('signUp.fullName')}
            accessibilityLabel={t('signUp.fullName')}
            textContentType="name"
            autoComplete="name"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <AuthField
            ref={emailRef}
            value={email}
            onChangeText={setEmail}
            placeholder={t('signUp.email')}
            accessibilityLabel={t('signUp.email')}
            keyboardType="email-address"
            textContentType="emailAddress"
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
            placeholder={t('signUp.password')}
            accessibilityLabel={t('signUp.password')}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <Text style={[styles.hint, { color: colors.secondaryLabel }]}>
            {t('signUp.passwordHint')}
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.red }]}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton title={t('signUp.submit')} loading={busy} onPress={submit} />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>
            {t('signUp.haveAccount')}
          </Text>
          <PrimaryButton
            variant="tonal"
            title={t('signUp.signIn')}
            onPress={() => router.replace('/sign-in')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: space.xl, gap: space.xl },
  form: { gap: space.md },
  hint: { ...type.caption },
  error: { ...type.small },
  footer: { alignItems: 'stretch', gap: space.md },
  footerText: { ...type.body, textAlign: 'center' },
});
