import { ResultAsync, okAsync } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { UserSession, UserSessionJWE } from '../session/types.js';
import type { LucidAuthError } from '../errors.js';
import { COOKIE_NAMES } from '../constants.js';
import { decryptUserSessionJWE } from '../session/index.js';

export function getUserSession(ctx: AuthContext) {
  const { config, cookies } = ctx;

  return function (): ResultAsync<UserSession | null, LucidAuthError> {
    return cookies.get(COOKIE_NAMES.USER_SESSION).andThen((jwe) => {
      if (!jwe) {
        return okAsync(null);
      }

      return decryptUserSessionJWE({
        JWE: jwe as UserSessionJWE,
        secret: config.session.secret,
      });
    });
  };
}
