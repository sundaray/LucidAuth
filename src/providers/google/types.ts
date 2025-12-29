import type { Result, ResultAsync } from 'neverthrow';
import type { LucidAuthError } from '../../core/errors.js';
import type { OAuthState } from '../../core/oauth/types.js';
import type { User } from '../../core/session/types.js';

export interface GoogleUserClaims {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  email: string;
  at_hash?: string;
  azp?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  profile?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  scope: string;
  token_type: string;
  refresh_token?: string;
}

export interface GoogleProviderConfig {
  /**
   * The OAuth client ID of your Google Cloud project.
   */
  clientId: string;
  /**
   * The OAuth client secret of your Google Cloud project.
   */
  clientSecret: string;
  prompt?: 'select_account' | 'consent' | 'none';
  onAuthentication: {
    /**
     * A user-provided callback that LucidAuth executes after a user successfully authenticates with Google.
     *
     * LucidAuth provides the user claims (profile information returned by Google) as the
     * callback parameter. Use these claims to find or create a user in your database,
     * then return the data you want stored in the user session.
     *
     *
     * @param userClaims - The profile information returned by Google.
     * @returns The object you return becomes the user session.
     */
    createGoogleUser(userClaims: GoogleUserClaims): Promise<User>;
    redirects: {
      /**
       * The URL LucidAuth should redirect the user to if an error occurs during OAuth authentication.
       *
       * LucidAuth will append an `error` query parameter to this URL describing the reason for the error.
       */
      error: `/${string}`;
    };
  };
}

export interface GoogleProvider {
  id: 'google';
  type: 'oauth';
  createAuthorizationUrl(params: {
    state: string;
    codeChallenge: string;
    baseUrl: string;
  }): Result<string, LucidAuthError>;
  completeSignin(
    request: Request,
    oauthStatePayload: OAuthState,
    baseUrl: string,
  ): ResultAsync<GoogleUserClaims, LucidAuthError>;
  onAuthentication(
    userClaims: GoogleUserClaims,
  ): ResultAsync<User, LucidAuthError>;
  getErrorRedirectPath(): `/${string}`;
}
