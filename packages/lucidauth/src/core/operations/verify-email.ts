import { ResultAsync, safeTry, ok } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { LucidAuthError } from '../errors.js';
import { getCredentialProvider } from '../../providers/get-credential-provider.js';

export function verifyEmail(ctx: AuthContext) {
  const { config, providers } = ctx;

  return function (
    request: Request,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const provider = yield* getCredentialProvider(providers);
      const result = yield* provider.verifyEmail(
        request,
        config.session.secret,
      );
      return ok(result);
    });
  };
}
