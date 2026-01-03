import { ResultAsync, ok, err, errAsync, safeTry } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { AuthProviderId, OAuthProvider } from '../../providers/types.js';
import { LucidAuthError } from '../errors.js';
import {
  ProviderNotFoundError,
  InvalidProviderTypeError,
  OAuthStateCookieNotFoundError,
} from '../oauth/errors.js';
import { decryptOAuthStateJWE } from '../oauth/index.js';
import {
  encryptUserSessionPayload,
  createUserSessionPayload,
} from '../session/index.js';
import { COOKIE_NAMES } from '../constants.js';
import { appendErrorToPath } from '../utils/index.js';

export function handleOAuthCallback(ctx: AuthContext) {
  const { config, providers, cookies } = ctx;

  return function (
    request: Request,
    providerId: AuthProviderId,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    const provider = providers.get(providerId);

    if (!provider) {
      return errAsync(new ProviderNotFoundError({ providerId }));
    }

    if (provider.type !== 'oauth') {
      return errAsync(new InvalidProviderTypeError({ providerId }));
    }

    const oauthProvider = provider;

    return safeTry(async function* () {
      const oauthStateJWE = yield* cookies.get(COOKIE_NAMES.OAUTH_STATE);

      if (!oauthStateJWE) {
        return err(new OAuthStateCookieNotFoundError());
      }

      const oauthState = yield* decryptOAuthStateJWE({
        jwe: oauthStateJWE,
        secret: config.session.secret,
      });

      const userClaims = yield* oauthProvider.completeSignin(
        request,
        oauthState,
        config.baseUrl,
      );

      const user = yield* oauthProvider.onAuthentication(userClaims);

      const sessionPayload = yield* createUserSessionPayload({
        user,
        provider: oauthProvider.id,
      });

      const sessionJWE = yield* encryptUserSessionPayload({
        payload: sessionPayload,
        secret: config.session.secret,
        maxAge: config.session.maxAge,
      });

      yield* cookies.set(
        COOKIE_NAMES.USER_SESSION,
        sessionJWE,
        config.session.maxAge,
      );

      yield* cookies.delete(COOKIE_NAMES.OAUTH_STATE);

      return ok({ redirectTo: oauthState.redirectTo || '/' });
    }).orElse((error) => {
      if (error instanceof LucidAuthError) {
        const errorPath = oauthProvider.getErrorRedirectPath();
        const redirectUrl = appendErrorToPath(
          errorPath,
          error.name,
        ) as `/${string}`;
        return ok({ redirectTo: redirectUrl });
      }
      return err(error);
    });
  };
}
