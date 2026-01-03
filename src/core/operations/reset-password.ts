import { ResultAsync, errAsync } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { LucidAuthError } from '../errors.js';
import { ProviderNotFoundError } from '../oauth/errors.js';

export function resetPassword(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (
    token: string,
    newPassword: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    const provider = providers.get('credential');

    if (!provider || provider.type !== 'credential') {
      return errAsync(new ProviderNotFoundError({ providerId: 'credential' }));
    }

    return provider.resetPassword(
      token,
      { newPassword },
      config.session.secret,
    );
  };
}
