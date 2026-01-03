import { ResultAsync } from 'neverthrow';
import type { AuthContext } from '../types';
import type { SignOutOptions } from '../../types';
import type { LucidAuthError } from '../errors';
import { COOKIE_NAMES } from '../constants';

export function signOut(ctx: AuthContext) {
  const { cookies } = ctx;

  return function (
    options: SignOutOptions,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return cookies
      .delete(COOKIE_NAMES.USER_SESSION)
      .map(() => ({ redirectTo: options.redirectTo }));
  };
}
