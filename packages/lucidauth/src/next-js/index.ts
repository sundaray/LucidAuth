import { createAuthHelpers } from '../core/auth.js';
import { createExtendUserSessionMiddleware } from './middleware.js';
import type { AuthConfig, SignOutOptions } from '../types/index.js';
import { redirect as nextRedirect } from 'next/navigation';
import type { ResultAsync } from 'neverthrow';
import type { LucidAuthError } from '../core/errors.js';
import type { UserSession } from '../core/session/types.js';
import type {
  CredentialSignInOptions,
  CredentialSignInResult,
} from './types.js';
import { nextJsCookies } from './cookies.js';

async function unwrap<T>(
  resultAsync: ResultAsync<T, LucidAuthError>,
): Promise<T> {
  const result = await resultAsync;
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
}

interface AuthInstance {
  signIn(
    providerId: 'google',
    options: { redirectTo: `/${string}` },
  ): Promise<{
    authorizationUrl: string;
  }>;

  signIn(
    providerId: 'credential',
    options: CredentialSignInOptions,
  ): Promise<CredentialSignInResult>;
  signUp: (data: {
    email: string;
    password: string;
    [key: string]: unknown;
  }) => Promise<void>;
  signOut: (options: SignOutOptions) => Promise<void>;
  getUserSession: () => Promise<UserSession | null>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  handler: (request: Request) => Promise<void>;
  extendUserSessionMiddleware: ReturnType<
    typeof createExtendUserSessionMiddleware
  >;
}

// ============================================
// SINGLETON INSTANCE
// ============================================
let instance: AuthInstance | null = null;

export function lucidAuth(config: AuthConfig) {
  if (!instance) {
    instance = createAuthInstance(config);
  }
  return instance;
}

// ============================================
// INSTANCE FACTORY
// ============================================
export function createAuthInstance(config: AuthConfig): AuthInstance {
  const { providers } = config;

  const authHelpers = createAuthHelpers(config, providers, nextJsCookies);

  const extendUserSessionMiddleware = createExtendUserSessionMiddleware(config);

  // Build and return the auth instance
  return {
    signIn: (async (providerId, options) => {
      const result = await unwrap(authHelpers.signIn(providerId, options));

      // Google sign-in
      if ('authorizationUrl' in result) {
        nextRedirect(result.authorizationUrl as string);
      }

      // Credential sign-in
      if ('redirectTo' in result) {
        nextRedirect(result.redirectTo);
      }

      return result;
    }) as AuthInstance['signIn'],

    signUp: async (data) => {
      const { redirectTo } = await unwrap(authHelpers.signUp(data));
      nextRedirect(redirectTo);
    },

    signOut: async (options: SignOutOptions) => {
      const { redirectTo } = await unwrap(authHelpers.signOut(options));
      nextRedirect(redirectTo);
    },

    getUserSession: async () => {
      return unwrap(authHelpers.getUserSession());
    },

    forgotPassword: async (email: string) => {
      const { redirectTo } = await unwrap(authHelpers.forgotPassword(email));
      nextRedirect(redirectTo);
    },

    resetPassword: async (token: string, newPassword: string) => {
      const { redirectTo } = await unwrap(
        authHelpers.resetPassword(token, newPassword),
      );
      nextRedirect(redirectTo);
    },

    handler: async (request: Request) => {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // Extract route after /api/auth/
      // Examples:
      //   /api/auth/verify-email → verify-email
      //   /api/auth/callback/google → callback/google
      //   /api/auth/verify-password-reset-token → verify-password-reset-token
      const route = pathname.replace(/^\/api\/auth\//, '').replace(/\/$/, '');

      // ----------------
      // Email Verification
      // ----------------
      if (route === 'verify-email') {
        const { redirectTo } = await unwrap(authHelpers.verifyEmail(request));

        nextRedirect(redirectTo);
      }

      // ---------------------------------
      // Password Reset Token Verification
      // ---------------------------------
      if (route === 'verify-password-reset-token') {
        const { redirectTo } = await unwrap(
          authHelpers.verifyPasswordResetToken(request),
        );
        nextRedirect(redirectTo);
      }

      // ----------------
      // OAuth Callbacks
      // ----------------
      if (route.startsWith('callback/')) {
        const providerId = route.replace('callback/', '') as 'google';
        const { redirectTo } = await unwrap(
          authHelpers.handleOAuthCallback(request, providerId),
        );

        nextRedirect(redirectTo);
      }
    },
    extendUserSessionMiddleware,
  };
}
