import { ResultAsync, okAsync } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { UserSession, UserSessionJWE } from '../session/types.js';
import type { LucidAuthError } from '../errors.js';
import { decryptUserSessionJWE } from '../session/index.js';

export function getUserSession(ctx: AuthContext) {
  const { config, session } = ctx;

  return function (): ResultAsync<UserSession | null, LucidAuthError> {
    return session.getUserSession().andThen((JWE) => {
      if (!JWE) {
        return okAsync(null);
      }

      return decryptUserSessionJWE({
        JWE: JWE as UserSessionJWE,
        secret: config.session.secret,
      });
    });
  };
}
