import { ResultAsync, ok, errAsync, safeTry } from 'neverthrow';
import type { AuthContext } from '../types.js';
import type {
  AuthProviderId,
  OAuthProvider,
  CredentialProvider,
} from '../../providers/types.js';
import type { LucidAuthError } from '../errors.js';
import { ProviderNotFoundError } from '../oauth/errors.js';
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
} from '../pkce/index.js';
import { encryptOAuthStatePayload } from '../oauth/index.js';
import {
  encryptUserSessionPayload,
  createUserSessionPayload,
} from '../session/index.js';
import { OAUTH_STATE_MAX_AGE } from '../constants.js';

type SignInOptions =
  | { redirectTo: string }
  | { email: string; password: string; redirectTo: string };

type SignInResult = { authorizationUrl: string } | { redirectTo: string };

export function signIn(ctx: AuthContext) {
  const { config, providers, session } = ctx;

  return function (
    providerId: AuthProviderId,
    options: SignInOptions,
  ): ResultAsync<SignInResult, LucidAuthError> {
    const provider = providers.get(providerId);

    if (!provider) {
      return errAsync(new ProviderNotFoundError({ providerId }));
    }

    switch (provider.type) {
      case 'oauth':
        return handleOAuthSignIn(
          provider as OAuthProvider,
          options as { redirectTo: `/${string}` },
        );

      case 'credential':
        return handleCredentialSignIn(
          provider as CredentialProvider,
          options as {
            email: string;
            password: string;
            redirectTo: `/${string}`;
          },
        );

      default:
        return errAsync(new ProviderNotFoundError({ providerId }));
    }
  };

  function handleOAuthSignIn(
    provider: OAuthProvider,
    options: { redirectTo: string },
  ): ResultAsync<{ authorizationUrl: string }, LucidAuthError> {
    return safeTry(async function* () {
      const state = yield* generateState();
      const codeVerifier = yield* generateCodeVerifier();
      const codeChallenge = yield* generateCodeChallenge(codeVerifier);

      const oauthStateJWE = yield* encryptOAuthStatePayload({
        oauthState: {
          state,
          codeVerifier,
          redirectTo: options.redirectTo || '/',
          provider: provider.id,
        },
        secret: config.session.secret,
        maxAge: OAUTH_STATE_MAX_AGE,
      });

      yield* session.setOAuthState(oauthStateJWE);

      const authorizationUrl = yield* provider.createAuthorizationUrl({
        state,
        codeChallenge,
        baseUrl: config.baseUrl,
      });

      return ok({ authorizationUrl });
    });
  }

  function handleCredentialSignIn(
    provider: CredentialProvider,
    options: { email: string; password: string; redirectTo: string },
  ): ResultAsync<{ redirectTo: string }, LucidAuthError> {
    return safeTry(async function* () {
      const userWithPassword = yield* provider.signIn({
        email: options.email,
        password: options.password,
      });

      const { hashedPassword, ...user } = userWithPassword;

      const sessionPayload = yield* createUserSessionPayload({
        user,
        provider: 'credential',
      });

      const JWE = yield* encryptUserSessionPayload({
        payload: sessionPayload,
        secret: config.session.secret,
        maxAge: config.session.maxAge,
      });

      yield* session.setUserSession(JWE);

      return ok({ redirectTo: options.redirectTo });
    });
  }
}
