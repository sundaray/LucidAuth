import { ok, err, ResultAsync, safeTry } from 'neverthrow';
import { LucidAuthError } from '../../core/errors.js';
import {
  verifyPasswordResetToken as verifyToken,
  PasswordResetTokenNotFoundError,
} from '../../core/password/index.js';
import { parseUrl } from '../../core/utils';
import { appendErrorToPath } from '../../core/utils/index.js';
import type { CredentialProviderConfig } from './types.js';

export function verifyPasswordResetToken(config: CredentialProviderConfig) {
  return function (
    request: Request,
    secret: string,
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const url = yield* parseUrl(request.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return err(new PasswordResetTokenNotFoundError());
      }

      // Decrypt and verify token - get email from payload
      const tokenPayload = yield* verifyToken(token, secret);
      const { email } = tokenPayload;

      // Token is valid - append token to redirect URL
      const redirectUrl = `${config.onPasswordReset.redirects.tokenVerificationSuccess}?token=${token}`;

      return ok({
        email,
        redirectTo: redirectUrl as `/${string}`,
      });
    }).orElse((error) => {
      if (error instanceof LucidAuthError) {
        const errorPath =
          config.onPasswordReset.redirects.tokenVerificationError;
        const redirectUrl = appendErrorToPath(
          errorPath,
          error.name,
        ) as `/${string}`;

        return ok({
          email: '',
          redirectTo: redirectUrl,
        });
      }

      return err(error);
    });
  };
}
