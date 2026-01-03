import { ResultAsync, errAsync } from 'neverthrow';
import type { AuthContext } from '../types';
import type { LucidAuthError } from '../errors';
import { ProviderNotFoundError } from '../oauth/errors';

export function signUp(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (data: {
    email: string;
    password: string;
    [key: string]: unknown;
  }): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    const provider = providers.get('credential');

    if (!provider || provider.type !== 'credential') {
      return errAsync(new ProviderNotFoundError({ providerId: 'credential' }));
    }

    return provider.signUp(data, config.session.secret, config.baseUrl);
  };
}
