import type { LucidAuthError } from '../core/errors';
import { Result, ResultAsync } from 'neverthrow';
import type { OAuthState } from '../core/oauth/types';
import type { User } from '../core/session/types';
import type { CredentialProviderConfig } from './credential/types';
import type { GoogleProviderConfig } from './google';

export type AuthProviderId = 'google' | 'credential';

export interface OAuthProvider {
  id: AuthProviderId;
  type: 'oauth';
  createAuthorizationUrl(
    config: GoogleProviderConfig,
  ): (params: {
    state: string;
    codeChallenge: string;
    prompt?: string;
    baseUrl: string;
  }) => Result<string, LucidAuthError>;
  completeSignin(
    request: Request,
    oauthStatePayload: OAuthState,
    baseUrl: string,
  ): ResultAsync<Record<string, any>, LucidAuthError>;

  onAuthentication(
    userClaims: Record<string, any>,
  ): ResultAsync<User, LucidAuthError>;

  getErrorRedirectPath(): `/${string}`;
}

export interface CredentialProvider {
  id: 'credential';
  type: 'credential';
  config: CredentialProviderConfig;
  signUp(
    data: {
      email: string;
      password: string;
      [key: string]: unknown;
    },
    secret: string,
    baseUrl: string,
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, LucidAuthError>;
  signIn(data: {
    email: string;
    password: string;
  }): ResultAsync<User & { hashedPassword: string }, LucidAuthError>;
  verifyEmail(
    request: Request,
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError>;
  forgotPassword(
    data: {
      email: string;
    },
    secret: string,
    baseUrl: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError>;
  verifyPasswordResetToken(
    request: Request,
    secret: string,
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, LucidAuthError>;
  resetPassword(
    token: string,
    data: { newPassword: string },
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, LucidAuthError>;
}

export type AnyAuthProvider = OAuthProvider | CredentialProvider;
