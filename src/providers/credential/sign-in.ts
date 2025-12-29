import { ok, err, ResultAsync, safeTry } from 'neverthrow';
import { LucidAuthError, CallbackError } from '../../core/errors.js';
import { verifyPassword } from '../../core/password/verify.js';
import { AccountNotFoundError, InvalidCredentialsError } from './errors.js';
import type { CredentialProviderConfig } from './types.js';
import type { User } from '../../core/session/types.js';

export function signIn(config: CredentialProviderConfig) {
  return function (data: {
    email: string;
    password: string;
  }): ResultAsync<User & { hashedPassword: string }, LucidAuthError> {
    return safeTry(async function* () {
      const { email, password } = data;

      // Execure user's getCredentialUser callback
      const user = yield* ResultAsync.fromPromise(
        config.onSignIn.getCredentialUser({ email }),
        (error) =>
          new CallbackError({
            callback: 'onSignIn.getCredentialUser',
            cause: error,
          }),
      );

      // User not found
      if (!user) {
        return err(new AccountNotFoundError());
      }

      // Verify password
      const isPasswordValid = yield* verifyPassword(
        password,
        user.hashedPassword,
      );

      // Password is invalid
      if (!isPasswordValid) {
        return err(new InvalidCredentialsError());
      }

      return ok(user);
    });
  };
}
