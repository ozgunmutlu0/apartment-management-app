import type { TFunction } from 'i18next';

type ErrorLike = { code?: unknown; message?: unknown; name?: unknown; status?: unknown };

/** Maps Supabase / network errors to a localized message from the `auth` namespace. */
export function authErrorMessage(error: unknown, t: TFunction<'auth'>): string {
  const e = (typeof error === 'object' && error !== null ? error : {}) as ErrorLike;
  const code = typeof e.code === 'string' ? e.code : '';
  const message = typeof e.message === 'string' ? e.message : '';

  if (
    e.name === 'AuthRetryableFetchError' ||
    /network request failed|failed to fetch|network error/i.test(message)
  ) {
    return t('errors.network');
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return t('errors.invalidCredentials');
  }
  if (code === 'email_not_confirmed') return t('errors.emailNotConfirmed');
  if (code === 'user_already_exists' || /already registered/i.test(message)) {
    return t('errors.emailTaken');
  }
  if (code === 'weak_password') return t('errors.passwordShort');
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    e.status === 429
  ) {
    return t('errors.rateLimit');
  }
  if (/invalid invite code/i.test(message)) return t('errors.invalidCode');
  if (/already a member/i.test(message)) return t('errors.alreadyMember');
  return t('errors.generic');
}
