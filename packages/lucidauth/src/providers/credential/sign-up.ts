import { ok, err, ResultAsync, safeTry } from 'neverthrow';
import { LucidAuthError, CallbackError } from '../../core/errors.js';
import { hashPassword } from '../../core/password/hash.js';
import {
  generateEmailVerificationToken,
  buildEmailVerificationUrl,
} from '../../core/verification/index.js';
import { AccountAlreadyExistsError } from './errors.js';
import type { CredentialProviderConfig } from './types.js';

const VERIFY_EMAIL_PATH = '/api/auth/verify-email';

export function signUp(config: CredentialProviderConfig) {
  return function (
    data: {
      email: string;
      password: string;
      [key: string]: unknown;
    },
    secret: string,
    baseUrl: string,
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, LucidAuthError> {
    return safeTry(async function* () {
      const { email, password, ...additionalFields } = data;

      // Execute user's checkCredentialUserExists callback
      const result = yield* ResultAsync.fromPromise(
        config.onSignUp.checkCredentialUserExists({ email }),
        (error) =>
          new CallbackError({
            callback: 'onSignUp.checkCredentialUserExists',
            cause: error,
          }),
      );

      if (result.exists) {
        return err(new AccountAlreadyExistsError());
      }

      // Hash password
      const hashedPassword = yield* hashPassword(password);

      // Generate email verification token
      const token = yield* generateEmailVerificationToken({
        secret,
        payload: {
          email,
          hashedPassword,
          ...additionalFields,
        },
      });

      // Build email verification URL
      const url = yield* buildEmailVerificationUrl(
        baseUrl,
        token,
        VERIFY_EMAIL_PATH,
      );

      // Call user's sendVerificationEmail callback
      yield* ResultAsync.fromPromise(
        config.onSignUp.sendVerificationEmail({
          email,
          url,
        }),
        (error) =>
          new CallbackError({
            callback: 'onSignUp.sendVerificationEmail',
            cause: error,
          }),
      );

      return ok({ email, redirectTo: config.onSignUp.redirects.signUpSuccess });
    });
  };
}
