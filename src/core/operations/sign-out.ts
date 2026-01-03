import { ResultAsync } from 'neverthrow';
import type { AuthContext } from '../types';
import type { SignOutOptions } from '../../types';
import type { LucidAuthError } from '../errors';

export function signOut(ctx: AuthContext) {
  const { session } = ctx;

  return function (
    options: SignOutOptions,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    return session
      .deleteUserSession()
      .map(() => ({ redirectTo: options.redirectTo }));
  };
}
