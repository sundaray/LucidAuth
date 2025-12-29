import { parseUrl, appendErrorToPath } from '../../core/utils';
import { ok, err, ResultAsync, safeTry } from 'neverthrow';
import type { CredentialProviderConfig } from './types.js';
import { LucidAuthError, CallbackError } from '../../core/errors.js';
import { verifyEmailVerificationToken } from '../../core/verification/index.js';
import { EmailVerificationTokenNotFoundError } from '../../core/verification/errors.js';

export function verifyEmail(config: CredentialProviderConfig) {
  return function (
    request: Request,
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const url = yield* parseUrl(request.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return err(new EmailVerificationTokenNotFoundError());
      }

      const tokenPayload = yield* verifyEmailVerificationToken(token, secret);

      // Decrypt token to get email + hashedPassword + additionalFields
      const { email, hashedPassword, ...additionalFields } = tokenPayload;

      // Call user's createCredentialUser callback
      yield* ResultAsync.fromPromise(
        config.onSignUp.createCredentialUser({
          email,
          hashedPassword,
          ...additionalFields,
        }),
        (error) =>
          new CallbackError({
            callback: 'onSignUp.createCredentialUser',
            cause: error,
          }),
      );

      return ok({
        redirectTo: config.onSignUp.redirects.emailVerificationSuccess,
      });
    }).orElse((error) => {
      if (error instanceof LucidAuthError) {
        const errorPath = config.onSignUp.redirects.emailVerificationError;
        const redirectUrl = appendErrorToPath(
          errorPath,
          error.name,
        ) as `/${string}`;
        return ok({ redirectTo: redirectUrl });
      }
      return err(error);
    });
  };
}
