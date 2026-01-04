import type { AuthProviderId } from '../../providers/types.js';

export type OAuthStateJWE = string & { __brand: OAuthStateJWE };

export type UserClaims = Record<string, any>;

export interface OAuthState {
  state: string;
  codeVerifier: string;
  redirectTo?: `/${string}`;
  provider: AuthProviderId;
}

export interface OAuthSignInResult {
  userClaims: Record<string, any>;
  oauthState: OAuthState;
  tokens: Record<string, any>;
}
