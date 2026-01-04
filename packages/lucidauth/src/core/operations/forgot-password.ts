import { ResultAsync, safeTry, ok } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { LucidAuthError } from '../errors.js';
import { getCredentialProvider } from '../../providers/get-credential-provider.js';

export function forgotPassword(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (
    email: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const provider = yield* getCredentialProvider(providers);
      const result = yield* provider.forgotPassword(
        { email },
        config.session.secret,
        config.baseUrl,
      );

      return ok(result);
    });
  };
}
