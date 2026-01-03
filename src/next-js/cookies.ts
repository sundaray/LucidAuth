import { ResultAsync } from 'neverthrow';
import { cookies } from 'next/headers';
import type { CookieOperations } from '../core/types.js';
import {
  NextJsGetCookieError,
  NextJsSetCookieError,
  NextJsDeleteCookieError,
} from './errors.js';
import { isNextJsDynamicError } from '../core/utils/index.js';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export const nextJsCookies: CookieOperations = {
  get(name) {
    return ResultAsync.fromPromise(
      (async () => {
        try {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value ?? null;
        } catch (error) {
          if (isNextJsDynamicError(error)) {
            return null;
          }
          throw error;
        }
      })(),
      (error) => new NextJsGetCookieError({ cause: error }),
    );
  },

  set(name, value, maxAge) {
    return ResultAsync.fromPromise(
      (async () => {
        const cookieStore = await cookies();
        cookieStore.set(name, value, {
          ...COOKIE_OPTIONS,
          maxAge,
        });
      })(),
      (error) => new NextJsSetCookieError({ cause: error }),
    );
  },

  delete(name) {
    return ResultAsync.fromPromise(
      (async () => {
        const cookieStore = await cookies();
        cookieStore.delete({
          name,
          path: COOKIE_OPTIONS.path,
          secure: COOKIE_OPTIONS.secure,
          sameSite: COOKIE_OPTIONS.sameSite,
        });
      })(),
      (error) => new NextJsDeleteCookieError({ cause: error }),
    );
  },
};
