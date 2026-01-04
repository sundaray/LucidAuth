import { ok, ResultAsync, safeTry } from 'neverthrow';
import { LucidAuthError, CallbackError } from '../../core/errors.js';
import { hashPassword } from '../../core/password/hash.js';
import { verifyPasswordResetToken } from '../../core/password/index.js';
import type { CredentialProviderConfig } from './types.js';

export function resetPassword(config: CredentialProviderConfig) {
  return function (
    token: string,
    data: { newPassword: string },
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const { newPassword } = data;

      // Decrypt and verify password reset token
      const tokenPayload = yield* verifyPasswordResetToken(token, secret);
      const { email } = tokenPayload;

      // Hash the new password
      const hashedPassword = yield* hashPassword(newPassword);

      // Call user's updatePassword callback
      yield* ResultAsync.fromPromise(
        config.onPasswordReset.updatePassword({ email, hashedPassword }),
        (error) =>
          new CallbackError({
            callback: 'onPasswordReset.updatePassword',
            cause: error,
          }),
      );

      // Call user's sendPasswordUpdateEmail callback
      yield* ResultAsync.fromPromise(
        config.onPasswordReset.sendPasswordUpdateEmail({ email }),
        (error) =>
          new CallbackError({
            callback: 'onPasswordReset.sendPasswordUpdateEmail',
            cause: error,
          }),
      );

      return ok({
        redirectTo: config.onPasswordReset.redirects.resetPasswordSuccess,
      });
    });
  };
}
