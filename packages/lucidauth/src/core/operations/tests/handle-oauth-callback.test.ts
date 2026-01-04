import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync, errAsync } from 'neverthrow';
import { handleOAuthCallback } from '../handle-oauth-callback.js';
import {
  createMockAuthContext,
  createMockOAuthProvider,
  createMockRequest,
} from './setup.js';
import { OAuthStateCookieNotFoundError } from '../../oauth/errors.js';
import { OAuthProviderNotFoundError } from '../../../providers/errors.js';
import { LucidAuthError } from '../../errors.js';

vi.mock('../../oauth/index.js', () => ({
  decryptOAuthStateJWE: vi.fn(),
}));

vi.mock('../../session/index.js', () => ({
  createUserSessionPayload: vi
    .fn()
    .mockReturnValue(ok({ user: {}, provider: 'google' })),
  encryptUserSessionPayload: vi
    .fn()
    .mockReturnValue(okAsync('mock-session-jwe')),
}));

import { decryptOAuthStateJWE } from '../../oauth/index.js';
import {
  createUserSessionPayload,
  encryptUserSessionPayload,
} from '../../session/index.js';

describe('handleOAuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(decryptOAuthStateJWE).mockReturnValue(
      okAsync({
        state: 'mock-state',
        codeVerifier: 'mock-code-verifier',
        redirectTo: '/dashboard',
        provider: 'google',
      }),
    );
  });

  it('completes OAuth flow and returns redirect URL', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    const result = await handleCallback(request, 'google');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/dashboard',
    });
  });

  it('retrieves and decrypts OAuth state from session', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    await handleCallback(request, 'google');

    expect(ctx.session.getOAuthState).toHaveBeenCalled();
    expect(decryptOAuthStateJWE).toHaveBeenCalledWith({
      jwe: 'mock-oauth-state-jwe',
      secret: ctx.config.session.secret,
    });
  });

  it('calls provider completeSignin with request and OAuth state', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    await handleCallback(request, 'google');

    expect(mockOAuthProvider.completeSignin).toHaveBeenCalledWith(
      request,
      {
        state: 'mock-state',
        codeVerifier: 'mock-code-verifier',
        redirectTo: '/dashboard',
        provider: 'google',
      },
      'https://myapp.com',
    );
  });

  it('calls provider onAuthentication with user claims', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    await handleCallback(request, 'google');

    expect(mockOAuthProvider.onAuthentication).toHaveBeenCalledWith({
      sub: '123456789',
      email: 'test@example.com',
      name: 'Test User',
    });
  });

  it('creates user session after authentication', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    await handleCallback(request, 'google');

    expect(createUserSessionPayload).toHaveBeenCalled();
    expect(encryptUserSessionPayload).toHaveBeenCalled();
    expect(ctx.session.setUserSession).toHaveBeenCalledWith('mock-session-jwe');
  });

  it('deletes OAuth state after successful callback', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    await handleCallback(request, 'google');

    expect(ctx.session.deleteOAuthState).toHaveBeenCalled();
  });

  it('returns error when OAuth provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    const result = await handleCallback(request, 'google');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      OAuthProviderNotFoundError,
    );
  });

  it('returns error when OAuth state cookie not found', async () => {
    const mockOAuthProvider = createMockOAuthProvider();
    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync(null)),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    const result = await handleCallback(request, 'google');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().redirectTo).toContain('/auth/error');
    expect(result._unsafeUnwrap().redirectTo).toContain(
      'o_auth_state_cookie_not_found_error',
    );
  });

  it('redirects to error path on LucidAuthError', async () => {
    class MockOAuthError extends LucidAuthError {
      constructor() {
        super({ message: 'OAuth failed' });
        this.name = 'MockOAuthError';
      }
    }

    const mockOAuthProvider = createMockOAuthProvider({
      completeSignin: vi.fn().mockReturnValue(errAsync(new MockOAuthError())),
      getErrorRedirectPath: vi.fn().mockReturnValue('/auth/error'),
    });

    const ctx = createMockAuthContext({
      providers: [mockOAuthProvider],
      session: {
        getOAuthState: vi.fn().mockReturnValue(okAsync('mock-oauth-state-jwe')),
      },
    });

    const handleCallback = handleOAuthCallback(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/callback/google?code=auth-code&state=mock-state',
    );
    const result = await handleCallback(request, 'google');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().redirectTo).toContain('/auth/error');
    expect(result._unsafeUnwrap().redirectTo).toContain('mock_o_auth_error');
  });
});
