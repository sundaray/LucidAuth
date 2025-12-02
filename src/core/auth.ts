import type { AuthConfig } from '../types/index.js';
import type { SessionStorage, UserSession } from './session/types';
import type { AnyAuthProvider, AuthProviderId } from '../providers/types';
import { ok, ResultAsync, errAsync, safeTry } from 'neverthrow';

import {
  OAuthService,
  CredentialService,
  SessionService,
  ProviderRegistry,
} from './services';

import { InvalidProviderTypeError } from './oauth/errors';
import { LucidAuthError, UnknownError } from './errors';

export function createAuthHelpers<TContext>(
  config: AuthConfig,
  userSessionStorage: SessionStorage<TContext>,
  oauthSessionStorage: SessionStorage<TContext>,
  providers: AnyAuthProvider[],
) {
  const providerRegistry = new ProviderRegistry(providers);
  const oauthService = new OAuthService<TContext>(config, oauthSessionStorage);
  const credentialService = new CredentialService(config);
  const sessionService = new SessionService<TContext>(
    config,
    userSessionStorage,
  );

  return {
    // --------------------------------------------
    // Sign in
    // --------------------------------------------
    signIn: (
      providerId: AuthProviderId,
      context: TContext,
      options:
        | { redirectTo: `/${string}` }
        | { email: string; password: string; redirectTo: `/${string}` },
    ): ResultAsync<
      { authorizationUrl: string } | { redirectTo: `/${string}` },
      LucidAuthError
    > => {
      const providerResult = providerRegistry.get(providerId);

      if (providerResult.isErr()) {
        return errAsync(providerResult.error);
      }
      const provider = providerResult.value;

      // ----------------
      // OAuth Sign In
      // ----------------
      if (provider.type === 'oauth') {
        return oauthService
          .initiateSignIn(provider, options as { redirectTo: `/${string}` })
          .andThen(({ authorizationUrl, oauthStateJWE }) => {
            return oauthSessionStorage
              .saveSession(context, oauthStateJWE)
              .map(() => ({ authorizationUrl }));
          })
          .mapErr((error) => {
            if (error instanceof LucidAuthError) {
              return error;
            }
            return new UnknownError({
              context: 'auth.signIn.oauth',
              cause: error,
            });
          });
      }

      // -------------------
      // Credential Sign In
      // -------------------
      if (provider.type === 'credential') {
        const data = options as { email: string; password: string };

        return safeTry(async function* () {
          const credentialProvider =
            yield* providerRegistry.getCredentialProvider();

          // Sign in
          const { user, redirectTo } = yield* credentialService.signIn(
            credentialProvider,
            {
              email: data.email,
              password: data.password,
            },
          );

          // 3. Create user session
          const sessionJWE = yield* sessionService.createSession(
            user,
            'credential',
          );

          // 4. Save user session
          yield* userSessionStorage.saveSession(context, sessionJWE);

          return ok({ redirectTo });
        }).mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.signUp',
            cause: error,
          });
        });
      }

      return errAsync(
        new UnknownError({
          context: 'auth.signIn',
        }),
      );
    },

    // --------------------------------------------
    // Sign Up (Credential)
    // --------------------------------------------
    signUp: (data: {
      email: string;
      password: string;
      [key: string]: unknown;
    }): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> => {
      return providerRegistry
        .getCredentialProvider()
        .asyncAndThen((provider) => {
          return credentialService.signUp(provider, data);
        })
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.signOut',
            cause: error,
          });
        });
    },
    // --------------------------------------------
    // Sign out
    // --------------------------------------------
    signOut: (
      context: TContext,
    ): ResultAsync<{ redirectTo: string }, LucidAuthError> => {
      return sessionService
        .deleteSession(context)
        .map(() => ({ redirectTo: '/' }))
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.signOut',
            cause: error,
          });
        });
    },
    // --------------------------------------------
    // Get user session
    // --------------------------------------------
    getUserSession: (
      context: TContext,
    ): ResultAsync<UserSession | null, LucidAuthError> => {
      return sessionService.getSession(context).mapErr((error) => {
        if (error instanceof LucidAuthError) {
          return error;
        }
        return new UnknownError({
          context: 'auth.getUserSession',
          cause: error,
        });
      });
    },
    // --------------------------------------------
    // Handle OAuth Callback
    // --------------------------------------------
    handleOAuthCallback: (
      request: Request,
      context: TContext,
      providerId: AuthProviderId,
    ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> => {
      const providerResult = providerRegistry.get(providerId);

      if (providerResult.isErr()) {
        return errAsync(providerResult.error);
      }

      const provider = providerResult.value;

      if (provider.type !== 'oauth') {
        return errAsync(new InvalidProviderTypeError({ providerId }));
      }

      return safeTry(async function* () {
        // Complete OAuth sign-in
        const { user, redirectTo } = yield* oauthService.completeSignIn(
          request,
          context,
          provider,
        );

        // Create session
        const session = yield* sessionService.createSession(user, provider.id);

        // Save session cookie
        yield* userSessionStorage.saveSession(context, session);

        // Delete OAuth state cookie
        yield* oauthSessionStorage.deleteSession(context);

        return ok({ redirectTo });
      }).mapErr((error) => {
        if (error instanceof LucidAuthError) {
          return error;
        }
        return new UnknownError({
          context: 'auth.handleOAuthCallback',
          cause: error,
        });
      });
    },
    // --------------------------------------------
    // Handle email verification
    // --------------------------------------------
    handleVerifyEmail: (
      request: Request,
    ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> => {
      return providerRegistry
        .getCredentialProvider()
        .asyncAndThen((provider) => {
          return credentialService.verifyEmail(request, provider);
        })
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.handleVerifyEmail',
            cause: error,
          });
        });
    },

    // --------------------------------------------
    // Forgot Password
    // --------------------------------------------
    forgotPassword(
      email: string,
    ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> {
      return providerRegistry
        .getCredentialProvider()
        .asyncAndThen((provider) => {
          return credentialService.forgotPassword(provider, { email });
        })
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.forgotPassword',
            cause: error,
          });
        });
    },

    // --------------------------------------------
    // Handle Verify Password Reset Token
    // --------------------------------------------
    handleVerifyPasswordResetToken(
      request: Request,
    ): ResultAsync<
      { email: string; passwordHash: string; redirectTo: `/${string}` },
      LucidAuthError
    > {
      return providerRegistry
        .getCredentialProvider()
        .asyncAndThen((provider) => {
          return credentialService.verifyPasswordResetToken(request, provider);
        })
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.handleVerifyPasswordResetToken',
            cause: error,
          });
        });
    },
    // --------------------------------------------
    // Handle Reset Password
    // --------------------------------------------
    handleResetPassword: (
      token: string,
      newPassword: string,
    ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError> => {
      return providerRegistry
        .getCredentialProvider()
        .asyncAndThen((provider) => {
          return credentialService.resetPassword(provider, token, {
            newPassword,
          });
        })
        .mapErr((error) => {
          if (error instanceof LucidAuthError) {
            return error;
          }
          return new UnknownError({
            context: 'auth.handleResetPassword',
            cause: error,
          });
        });
    },
  };
}

export type AuthHelpers = typeof createAuthHelpers;
