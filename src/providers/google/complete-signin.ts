import { ResultAsync, ok, err, safeTry } from 'neverthrow';
import { AUTH_ROUTES } from '../../core/constants.js';
import { LucidAuthError, UnknownError } from '../../core/errors.js';
import {
  StateMismatchError,
  StateNotFoundError,
  AuthorizationCodeNotFoundError,
} from '../../core/oauth/errors.js';
import type { GoogleProviderConfig, GoogleUserClaims } from './types.js';
import type { OAuthState } from '../../core/oauth/types.js';
import { decodeGoogleIdToken } from './decode-google-id-token.js';
import { exchangeAuthorizationCodeForTokens } from './exchange-authorization-code-for-tokens.js';

const REDIRECT_PATH = '/api/auth/callback/google';

export function completeSignin(config: GoogleProviderConfig) {
  return function (
    request: Request,
    oauthStatePayload: OAuthState,
    baseUrl: string,
  ): ResultAsync<GoogleUserClaims, LucidAuthError> {
    return safeTry(async function* () {
      const url = new URL(request.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code) {
        return err(new AuthorizationCodeNotFoundError());
      }

      if (!state) {
        return err(new StateNotFoundError());
      }

      // Compare the state stored in cookie with state stored in URL
      if (oauthStatePayload.state !== state) {
        return err(new StateMismatchError());
      }

      // Exchange authorization code for tokens
      const tokens = yield* exchangeAuthorizationCodeForTokens({
        code,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: `${baseUrl}${REDIRECT_PATH}`,
        codeVerifier: oauthStatePayload.codeVerifier,
      });

      // Decode the id_token for user claims
      const userClaims = yield* decodeGoogleIdToken(tokens.id_token);

      return ok(userClaims);
    }).mapErr((error) => {
      if (error instanceof LucidAuthError) {
        return error;
      }
      return new UnknownError({
        context: 'google-provider.completeSignin',
        cause: error,
      });
    });
  };
}
