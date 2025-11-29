import type { SuperAuthError } from '../core/errors';
import { Result, ResultAsync } from 'neverthrow';
import type { OAuthStatePayload } from '../core/oauth/types';
import type { UserSession } from '../core/session/types';
import type { CredentialProviderConfig } from './credential/types';

export type AuthProviderId = 'google' | 'credential';

export interface OAuthProvider {
  id: AuthProviderId;
  type: 'oauth';
  getAuthorizationUrl(params: {
    state: string;
    codeChallenge: string;
    prompt?: string;
    baseUrl: string;
  }): Result<string, SuperAuthError>;
  completeSignin(
    request: Request,
    oauthStatePayload: OAuthStatePayload,
    baseUrl: string,
  ): ResultAsync<Record<string, any>, SuperAuthError>;

  onAuthenticated(
    userClaims: Record<string, any>,
  ): ResultAsync<Record<string, unknown>, SuperAuthError>;
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
  ): ResultAsync<{ email: string; redirectTo: `/${string}` }, SuperAuthError>;
  signIn(data: {
    email: string;
    password: string;
  }): ResultAsync<UserSession, SuperAuthError>;
  verifyEmail(
    request: Request,
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, SuperAuthError>;
  forgotPassword(
    data: {
      email: string;
    },
    secret: string,
    baseUrl: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, SuperAuthError>;
  verifyPasswordResetToken(
    request: Request,
    secret: string,
  ): ResultAsync<
    { email: string; passwordHash: string; redirectTo: `/${string}` },
    SuperAuthError
  >;
  resetPassword(
    token: string,
    data: { newPassword: string },
    secret: string,
  ): ResultAsync<{ redirectTo: `/${string}` }, SuperAuthError>;
}

export type AnyAuthProvider = OAuthProvider | CredentialProvider;
