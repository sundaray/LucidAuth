import { ResultAsync } from 'neverthrow';
import type { User } from '../../core/types.js';
import { CallbackError } from '../../core/errors.js';
import type { LucidAuthError } from '../../core/errors.js';
import type { GoogleProviderConfig, GoogleUserClaims } from './types.js';

export function onAuthentication(config: GoogleProviderConfig) {
  return function (
    userClaims: GoogleUserClaims,
  ): ResultAsync<User, LucidAuthError> {
    return ResultAsync.fromPromise(
      config.onAuthentication.createGoogleUser(userClaims),
      (error) =>
        new CallbackError({
          callback: 'onAuthentication',
          cause: error,
        }),
    );
  };
}
