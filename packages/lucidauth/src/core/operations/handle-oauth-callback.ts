import { ResultAsync, ok, err, errAsync, safeTry } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type { AuthProviderId } from '../../providers/types.js';
import { LucidAuthError } from '../errors.js';
import { OAuthStateCookieNotFoundError } from '../oauth/errors.js';
import { decryptOAuthStateJWE } from '../oauth/index.js';
import { getOAuthProvider } from '../../providers/get-oauth-provider.js';
import {
  encryptUserSessionPayload,
  createUserSessionPayload,
} from '../session/index.js';
import { appendErrorToPath } from '../utils/index.js';

export function handleOAuthCallback(ctx: AuthContext) {
  const { config, providers, session } = ctx;

  return function (
    request: Request,
    providerId: AuthProviderId,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
    const result = getOAuthProvider(providers, providerId);

    if (result.isErr()) {
      return errAsync(result.error);
    }

    const oauthProvider = result.value;

    return safeTry(async function* () {
      const JWE = yield* session.getOAuthState();

      if (!JWE) {
        return err(new OAuthStateCookieNotFoundError());
      }

      const oauthState = yield* decryptOAuthStateJWE({
        jwe: JWE,
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

      yield* session.setUserSession(sessionJWE);
      yield* session.deleteOAuthState();

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
