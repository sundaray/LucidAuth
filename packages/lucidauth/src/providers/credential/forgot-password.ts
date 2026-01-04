import { ok, ResultAsync, safeTry } from 'neverthrow';
import { LucidAuthError, CallbackError } from '../../core/errors.js';
import {
  generatePasswordResetToken,
  buildPasswordResetUrl,
} from '../../core/password/index.js';
import type { CredentialProviderConfig } from './types.js';

const VERIFY_PASSWORD_RESET_TOKEN_PATH =
  '/api/auth/verify-password-reset-token';

export function forgotPassword(config: CredentialProviderConfig) {
  return function (
    data: { email: string },
    secret: string,
    baseUrl: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const { email } = data;

      // Call user's checkCredentialUserExists callback
      const result = yield* ResultAsync.fromPromise(
        config.onPasswordReset.checkCredentialUserExists({ email }),
        (error) =>
          new CallbackError({
            callback: 'onPasswordReset.checkCredentialUserExists',
            cause: error,
          }),
      );

      // If user with a credential account doesn't exist, silently succeed
      if (!result.exists) {
        return ok({
          redirectTo: config.onPasswordReset.redirects.forgotPasswordSuccess,
        });
      }

      // Generate password reset token
      const token = yield* generatePasswordResetToken({
        secret,
        payload: { email },
      });

      // Build password reset URL
      const url = yield* buildPasswordResetUrl(
        baseUrl,
        token,
        VERIFY_PASSWORD_RESET_TOKEN_PATH,
      );

      // Call user's sendPasswordResetEmail callback
      yield* ResultAsync.fromPromise(
        config.onPasswordReset.sendPasswordResetEmail({ email, url }),
        (error) =>
          new CallbackError({
            callback: 'onPasswordReset.sendPasswordResetEmail',
            cause: error,
          }),
      );

      return ok({
        redirectTo: config.onPasswordReset.redirects.forgotPasswordSuccess,
      });
    });
  };
}
