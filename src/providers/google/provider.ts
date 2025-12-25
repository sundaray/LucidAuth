import { Result, ok, err, ResultAsync, safeTry } from 'neverthrow';
import type { OAuthProvider } from '../../providers/types.js';
import type { GoogleUserClaims, GoogleProviderConfig } from './types.js';
import type { OAuthState } from '../../core/oauth/types.js';

import { decodeGoogleIdToken } from './decode-google-id-token.js';
import { exchangeAuthorizationCodeForTokens } from './exchange-authorization-code-for-tokens.js';

import {
  AuthorizationCodeNotFoundError,
  StateNotFoundError,
  StateMismatchError,
} from '../../core/oauth/errors.js';

import {
  LucidAuthError,
  UnknownError,
  CallbackError,
} from '../../core/errors.js';
import { CreateAuthorizationUrlError } from '../../core/oauth/errors.js';

import { AUTH_ROUTES } from '../../core/constants';
import type { User } from '../../core/session/types.js';

// --------------------------------------------
//
// Google provider
//
// --------------------------------------------
export function createGoogleProvider(
  config: GoogleProviderConfig,
): OAuthProvider {
  return {
    id: 'google',
    type: 'oauth',

    // --------------------------------------------
    // Create Authorization URL
    // --------------------------------------------
    createAuthorizationUrl(params: {
      state: string;
      codeChallenge: string;
      baseUrl: string;
    }): Result<string, LucidAuthError> {
      const { state, codeChallenge, baseUrl } = params;
      const prompt = config.prompt || 'select_account';

      return Result.fromThrowable(
        () => {
          const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

          url.searchParams.set('response_type', 'code');
          url.searchParams.set('client_id', config.clientId);
          url.searchParams.set(
            'redirect_uri',
            `${baseUrl}${AUTH_ROUTES.CALLBACK}/google`,
          );
          url.searchParams.set('state', state);
          url.searchParams.set('code_challenge', codeChallenge);
          url.searchParams.set('code_challenge_method', 'S256');
          url.searchParams.set('scope', 'openid email profile');
          url.searchParams.set('prompt', prompt);

          return url.toString();
        },
        (error) => new CreateAuthorizationUrlError({ cause: error }),
      )();
    },

    // --------------------------------------------
    // Complete sign-in
    // --------------------------------------------
    completeSignin(
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
          redirectUri: `${baseUrl}${AUTH_ROUTES.CALLBACK}/google`,
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
    },

    // --------------------------------------------
    // Execute user's onAuthentication callback
    // --------------------------------------------
    onAuthentication(
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
    },

    // --------------------------------------------
    // Get error redirect path
    // --------------------------------------------
    getErrorRedirectPath(): `/${string}` {
      return config.onAuthentication.redirects.error;
    },
  };
}
