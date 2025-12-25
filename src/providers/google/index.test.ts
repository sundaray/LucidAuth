import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Google } from './index.js';
import type { GoogleProviderConfig, GoogleUserClaims } from './types.js';
import type { OAuthState } from '../../core/oauth/types.js';

vi.mock('./exchange-authorization-code-for-tokens.js', () => ({
  exchangeAuthorizationCodeForTokens: vi.fn(),
}));

vi.mock('./decode-google-id-token.js', () => ({
  decodeGoogleIdToken: vi.fn(),
}));

import { exchangeAuthorizationCodeForTokens } from './exchange-authorization-code-for-tokens.js';
import { decodeGoogleIdToken } from './decode-google-id-token.js';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import { TokenFetchError, DecodeGoogleIdTokenError } from './errors.js';

// ============================================
// MOCK FACTORIES
// ============================================

function createMockConfig(
  overrides: Partial<GoogleProviderConfig> = {},
): GoogleProviderConfig {
  return {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    prompt: 'select_account',
    onAuthentication: {
      createGoogleUser: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }),
      redirects: {
        error: '/auth/error',
      },
    },
    ...overrides,
  };
}

function createMockOAuthState(overrides: Partial<OAuthState> = {}): OAuthState {
  return {
    state: 'test-state',
    codeVerifier: 'test-code-verifier',
    redirectTo: '/dashboard',
    provider: 'google',
    ...overrides,
  };
}

function createMockUserClaims(
  overrides: Partial<GoogleProviderConfig> = {},
): GoogleUserClaims {
  return {
    aud: 'test-client-id',
    iat: 1234567890,
    exp: 1234567890 + 3600,
    iss: 'https://accounts.google.com',
    sub: '123456789',
    email: 'user@example.com',
  };
}

function createCallbackRequest(
  params: {
    code?: string;
    state?: string;
  } = {},
): Request {
  const url = new URL('https://myapp.com/api/auth/callback/google');

  if (params.code) url.searchParams.set('code', params.code);
  if (params.state) url.searchParams.set('state', params.state);

  return new Request(url.toString());
}

// ============================================
// TESTS
// ============================================

describe('Google provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ Provider Shape ============
  describe('provider shape', () => {
    it('returns provider with correct id and type', () => {
      const provider = Google(createMockConfig());

      expect(provider.id).toBe('google');
      expect(provider.type).toBe('oauth');
    });

    it('exposes all required interface methods', () => {
      const provider = Google(createMockConfig());

      expect(typeof provider.createAuthorizationUrl).toBe('function');
      expect(typeof provider.completeSignin).toBe('function');
      expect(typeof provider.onAuthentication).toBe('function');
      expect(typeof provider.getErrorRedirectPath).toBe('function');
    });
  });

  // ============ createAuthorizationUrl ============
  describe('createAuthorizationUrl', () => {
    it('builds valid Google OAuth URL', () => {
      const provider = Google(createMockConfig());

      const result = provider.createAuthorizationUrl({
        state: 'test-state',
        codeChallenge: 'test-code-challenge',
        baseUrl: 'https://myapp.com',
      });

      expect(result.isOk()).toBe(true);

      const url = new URL(result._unsafeUnwrap());

      expect(url.origin).toBe('https://accounts.google.com');
      expect(url.pathname).toBe('/o/oauth2/v2/auth');
    });

    it('includes all required OAuth parameters', () => {
      const provider = Google(createMockConfig({ clientId: 'test-client-id' }));

      const result = provider.createAuthorizationUrl({
        state: 'test-state',
        codeChallenge: 'test-code-challenge',
        baseUrl: 'https://myapp.com',
      });

      const url = new URL(result._unsafeUnwrap());

      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe('test-client-id');
      expect(url.searchParams.get('state')).toBe('test-state');
      expect(url.searchParams.get('code_challenge')).toBe(
        'test-code-challenge',
      );
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('scope')).toBe('openid email profile');
    });

    it('sets redirect_uri to callback endpoint', () => {
      const provider = Google(createMockConfig({ clientId: 'test-client-id' }));

      const result = provider.createAuthorizationUrl({
        state: 'test-state',
        codeChallenge: 'test-code-challenge',
        baseUrl: 'https://myapp.com',
      });

      const url = new URL(result._unsafeUnwrap());

      expect(url.searchParams.get('redirect_uri')).toBe(
        'https://myapp.com/api/auth/callback/google',
      );
    });
  });

  it('uses configured prompt value', () => {
    const provider = Google(createMockConfig({ prompt: 'consent' }));

    const result = provider.createAuthorizationUrl({
      state: 'test-state',
      codeChallenge: 'test-code-challenge',
      baseUrl: 'https://myapp.com',
    });

    const url = new URL(result._unsafeUnwrap());

    expect(url.searchParams.get('prompt')).toBe('consent');
  });

  it('defaults to select_account prompt when not configured', () => {
    const config = createMockConfig();
    delete config.prompt;
    const provider = Google(config);

    const result = provider.createAuthorizationUrl({
      state: 'test-state',
      codeChallenge: 'test-code-challenge',
      baseUrl: 'https://myapp.com',
    });

    const url = new URL(result._unsafeUnwrap());

    expect(url.searchParams.get('prompt')).toBe('select_account');
  });

  // ============ completeSignin ============
  describe('completeSignIn', () => {
    it('exchanges authorization code for tokens and decodes google_id_token to return user cliams', async () => {
      const provider = Google(createMockConfig());

      const request = createCallbackRequest({
        code: 'test-code',
        state: 'test-state',
      });

      const oauthState = createMockOAuthState({ state: 'test-state' });
      const expectedClaims = createMockUserClaims();

      vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
        okAsync({
          id_token: 'test-id-token',
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'openid email profile',
          token_type: 'Bearer',
        }),
      );
      vi.mocked(decodeGoogleIdToken).mockReturnValue(ok(expectedClaims));

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedClaims);
    });
    it('passes correct parameters to the exchangeAuthorizationCodeForTokens function', async () => {
      const provider = Google(
        createMockConfig({
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        }),
      );

      const request = createCallbackRequest({
        code: 'test-code',
        state: 'test-state',
      });

      const oauthState = createMockOAuthState({ state: 'test-state' });
      const expectedClaims = createMockUserClaims();

      vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
        okAsync({
          id_token: 'test-id-token',
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'openid email profile',
          token_type: 'Bearer',
        }),
      );
      vi.mocked(decodeGoogleIdToken).mockReturnValue(ok(expectedClaims));

      await provider.completeSignin(request, oauthState, 'https://myapp.com');

      expect(exchangeAuthorizationCodeForTokens).toHaveBeenCalledWith({
        code: 'test-code',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'https://myapp.com/api/auth/callback/google',
        codeVerifier: 'test-code-verifier',
      });
    });

    it('returns error when code is missing from URL', async () => {
      const provider = Google(createMockConfig());

      const request = createCallbackRequest({
        state: 'test-state',
      }); // no code

      const oauthState = createMockOAuthState({ state: 'test-state' });

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe(
        'AuthorizationCodeNotFoundError',
      );
    });

    it('returns error when state is missing from URL', async () => {
      const provider = Google(createMockConfig());

      const request = createCallbackRequest({
        code: 'test-code',
      }); // no state

      const oauthState = createMockOAuthState({ state: 'test-state' });

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('StateNotFoundError');
    });

    it('returns error when states do not match', async () => {
      const provider = Google(createMockConfig());

      const request = createCallbackRequest({
        code: 'test-code',
        state: 'test-state',
      });

      const oauthState = createMockOAuthState({ state: 'wrong-test-state' });

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('StateMismatchError');
    });

    it('returns error when token exchange fails', async () => {
      const provider = Google(createMockConfig());
      const request = createCallbackRequest({
        code: 'test-code',
        state: 'test-state',
      });
      const oauthState = createMockOAuthState();

      vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
        errAsync(new TokenFetchError()),
      );

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('TokenFetchError');
    });

    it('returns error when ID token decoding fails', async () => {
      const provider = Google(createMockConfig());
      const request = createCallbackRequest({
        code: 'test-code',
        state: 'test-state',
      });
      const oauthState = createMockOAuthState();

      vi.mocked(decodeGoogleIdToken).mockReturnValue(
        err(new DecodeGoogleIdTokenError()),
      );

      const result = await provider.completeSignin(
        request,
        oauthState,
        'https://myapp.com',
      );

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('TokenFetchError');
    });
  });

  // ============ onAuthentication ============
  describe('onAuthentication', () => {
    it('calls user callback with claims and returns user', async () => {
      const mockCreateGoogleUser = vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      const config = createMockConfig();
      config.onAuthentication.createGoogleUser = mockCreateGoogleUser;

      const provider = Google(config);

      const claims = createMockUserClaims();

      const result = await provider.onAuthentication(claims);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
      expect(mockCreateGoogleUser).toHaveBeenCalledWith(claims);
      expect(mockCreateGoogleUser).toHaveBeenCalledTimes(1);
    });

    it('wraps onAuthentication callback error in CallbackError', async () => {
      const mockCreateGoogleUser = vi
        .fn()
        .mockRejectedValue(new Error('Datbase connection failed.'));

      const config = createMockConfig();
      config.onAuthentication.createGoogleUser = mockCreateGoogleUser;

      const claims = createMockUserClaims();

      const provider = Google(config);

      const result = await provider.onAuthentication(claims);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe(
        'OnAuthenticationCallbackError',
      );
    });

    // ============ getErrorRedirectPath ============
    describe('getErrorRedirectPath', () => {
      it('returns configured error redirect path', () => {
        const config = createMockConfig();
        config.onAuthentication.redirects.error = '/custom/error/page';

        const provider = Google(config);

        expect(provider.getErrorRedirectPath()).toBe('/custom/error/page');
      });
    });
  });
});
