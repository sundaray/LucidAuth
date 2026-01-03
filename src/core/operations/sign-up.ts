import { ResultAsync, safeTry } from 'neverthrow';
import type { AuthContext } from '../types';
import type { LucidAuthError } from '../errors';
import { getCredentialProvider } from '../../providers';

export function signUp(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (data: {
    email: string;
    password: string;
    [key: string]: unknown;
  }): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const provider = yield* getCredentialProvider(providers);
      return provider.signUp(data, config.session.secret, config.baseUrl);
    });
  };
}
