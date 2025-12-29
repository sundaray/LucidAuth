import { describe, it, expect, vi } from 'vitest';
import { createAuthorizationUrl } from './create-authorization-url.js';
import type { GoogleProviderConfig } from './types.js';

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

describe('createAuthorizationUrl', () => {
  it('builds valid Google OAuth URL', () => {
    const getAuthorizationUrl = createAuthorizationUrl(createMockConfig());

    const result = getAuthorizationUrl({
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
    const getAuthorizationUrl = createAuthorizationUrl(
      createMockConfig({ clientId: 'test-client-id' }),
    );

    const result = getAuthorizationUrl({
      state: 'test-state',
      codeChallenge: 'test-code-challenge',
      baseUrl: 'https://myapp.com',
    });

    const url = new URL(result._unsafeUnwrap());

    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('state')).toBe('test-state');
    expect(url.searchParams.get('code_challenge')).toBe('test-code-challenge');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toBe('openid email profile');
  });

  it('sets redirect_uri to redirect path', () => {
    const getAuthorizationUrl = createAuthorizationUrl(
      createMockConfig({ clientId: 'test-client-id' }),
    );

    const result = getAuthorizationUrl({
      state: 'test-state',
      codeChallenge: 'test-code-challenge',
      baseUrl: 'https://myapp.com',
    });

    const url = new URL(result._unsafeUnwrap());

    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://myapp.com/api/auth/callback/google',
    );
  });

  it('uses configured prompt value', () => {
    const getAuthorizationUrl = createAuthorizationUrl(
      createMockConfig({ prompt: 'consent' }),
    );

    const result = getAuthorizationUrl({
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
    const getAuthorizationUrl = createAuthorizationUrl(config);

    const result = getAuthorizationUrl({
      state: 'test-state',
      codeChallenge: 'test-code-challenge',
      baseUrl: 'https://myapp.com',
    });

    const url = new URL(result._unsafeUnwrap());

    expect(url.searchParams.get('prompt')).toBe('select_account');
  });
});
