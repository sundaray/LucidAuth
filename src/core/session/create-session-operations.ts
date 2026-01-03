import type { CookieOperations, SessionOperations } from '../types.js';
import { COOKIE_NAMES, OAUTH_STATE_MAX_AGE } from '../constants.js';

export function createSessionOperations(
  cookies: CookieOperations,
  userSessionMaxAge: number,
): SessionOperations {
  return {
    setUserSession(jwe) {
      return cookies.set(COOKIE_NAMES.USER_SESSION, jwe, userSessionMaxAge);
    },

    getUserSession() {
      return cookies.get(COOKIE_NAMES.USER_SESSION);
    },

    deleteUserSession() {
      return cookies.delete(COOKIE_NAMES.USER_SESSION);
    },

    setOAuthState(jwe) {
      return cookies.set(COOKIE_NAMES.OAUTH_STATE, jwe, OAUTH_STATE_MAX_AGE);
    },

    getOAuthState() {
      return cookies.get(COOKIE_NAMES.OAUTH_STATE);
    },

    deleteOAuthState() {
      return cookies.delete(COOKIE_NAMES.OAUTH_STATE);
    },
  };
}
