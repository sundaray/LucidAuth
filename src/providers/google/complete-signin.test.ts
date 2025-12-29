import { describe, it, expect, vi, beforeEach } from 'vitest';
import { completeSignin } from './complete-signin.js';
import type { GoogleProviderConfig, GoogleUserClaims } from './types.js';
import type { OAuthState } from '../../core/oauth/types.js';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import { TokenFetchError, DecodeGoogleIdTokenError } from './errors.js';

vi.mock('./exchange-authorization-code-for-tokens.js', () => ({
  exchangeAuthorizationCodeForTokens: vi.fn(),
}));

vi.mock('./decode-google-id-token.js', () => ({
  decodeGoogleIdToken: vi.fn(),
}));

import { exchangeAuthorizationCodeForTokens } from './exchange-authorization-code-for-tokens.js';
import { decodeGoogleIdToken } from './decode-google-id-token.js';

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
  overrides: Partial<GoogleUserClaims> = {},
): GoogleUserClaims {
  return {
    aud: 'test-client-id',
    iat: 1234567890,
    exp: 1234567890 + 3600,
    iss: 'https://accounts.google.com',
    sub: '123456789',
    email: 'user@example.com',
    ...overrides,
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

function createMockTokenResponse() {
  return {
    id_token: 'test-id-token',
    access_token: 'test-access-token',
    expires_in: 3600,
    scope: 'openid email profile',
    token_type: 'Bearer',
  };
}

describe('completeSignin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges authorization code for tokens and decodes google_id_token to return user claims', async () => {
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      code: 'test-code',
      state: 'test-state',
    });

    const oauthState = createMockOAuthState({ state: 'test-state' });
    const expectedClaims = createMockUserClaims();

    vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
      okAsync(createMockTokenResponse()),
    );
    vi.mocked(decodeGoogleIdToken).mockReturnValue(ok(expectedClaims));

    const result = await handleCompleteSignin(
      request,
      oauthState,
      'https://myapp.com',
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(expectedClaims);
  });

  it('passes correct parameters to the exchangeAuthorizationCodeForTokens function', async () => {
    const handleCompleteSignin = completeSignin(
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
      okAsync(createMockTokenResponse()),
    );
    vi.mocked(decodeGoogleIdToken).mockReturnValue(ok(expectedClaims));

    await handleCompleteSignin(request, oauthState, 'https://myapp.com');

    expect(exchangeAuthorizationCodeForTokens).toHaveBeenCalledWith({
      code: 'test-code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://myapp.com/api/auth/callback/google',
      codeVerifier: 'test-code-verifier',
    });
  });

  it('returns error when code is missing from URL', async () => {
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      state: 'test-state',
    });

    const oauthState = createMockOAuthState({ state: 'test-state' });

    const result = await handleCompleteSignin(
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
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      code: 'test-code',
    });

    const oauthState = createMockOAuthState({ state: 'test-state' });

    const result = await handleCompleteSignin(
      request,
      oauthState,
      'https://myapp.com',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('StateNotFoundError');
  });

  it('returns error when states do not match', async () => {
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      code: 'test-code',
      state: 'test-state',
    });

    const oauthState = createMockOAuthState({ state: 'wrong-test-state' });

    const result = await handleCompleteSignin(
      request,
      oauthState,
      'https://myapp.com',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('StateMismatchError');
  });

  it('returns error when token exchange fails', async () => {
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      code: 'test-code',
      state: 'test-state',
    });

    const oauthState = createMockOAuthState();

    vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
      errAsync(new TokenFetchError()),
    );

    const result = await handleCompleteSignin(
      request,
      oauthState,
      'https://myapp.com',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('TokenFetchError');
  });

  it('returns error when ID token decoding fails', async () => {
    const handleCompleteSignin = completeSignin(createMockConfig());

    const request = createCallbackRequest({
      code: 'test-code',
      state: 'test-state',
    });

    const oauthState = createMockOAuthState();

    vi.mocked(exchangeAuthorizationCodeForTokens).mockReturnValue(
      okAsync({
        id_token: 'invalid-token',
        access_token: 'test-access-token',
        expires_in: 3600,
        scope: 'openid email profile',
        token_type: 'Bearer',
      }),
    );

    vi.mocked(decodeGoogleIdToken).mockReturnValue(
      err(new DecodeGoogleIdTokenError()),
    );

    const result = await handleCompleteSignin(
      request,
      oauthState,
      'https://myapp.com',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('DecodeGoogleIdTokenError');
  });
});
