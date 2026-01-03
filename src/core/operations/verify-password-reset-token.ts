import { ResultAsync, errAsync } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { LucidAuthError } from '../errors.js';
import { ProviderNotFoundError } from '../oauth/errors.js';

export function verifyPasswordResetToken(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (
    request: Request,
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, LucidAuthError> {
    const provider = providers.get('credential');

    if (!provider || provider.type !== 'credential') {
      return errAsync(new ProviderNotFoundError({ providerId: 'credential' }));
    }

    return provider.verifyPasswordResetToken(request, config.session.secret);
  };
}
