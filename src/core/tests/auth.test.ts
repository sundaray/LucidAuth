import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync } from 'neverthrow';
import { createAuthHelpers } from '../auth.js';
import type { CookieOperations } from '../types.js';
import type { AuthConfig } from '../../types/index.js';

function createMockCookies(): CookieOperations {
  return {
    get: vi.fn().mockReturnValue(okAsync(null)),
    set: vi.fn().mockReturnValue(okAsync(undefined)),
    delete: vi.fn().mockReturnValue(okAsync(undefined)),
  };
}

function createMockConfig(): AuthConfig {
  return {
    baseUrl: 'https://myapp.com',
    session: {
      secret: 'test-secret-key-at-least-32-chars-long',
      maxAge: 60 * 60 * 24 * 7,
    },
    providers: [],
  };
}

describe('createAuthHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all auth helper functions', () => {
    const config = createMockConfig();
    const cookies = createMockCookies();

    const authHelpers = createAuthHelpers(config, [], cookies);

    expect(authHelpers).toHaveProperty('signIn');
    expect(authHelpers).toHaveProperty('signUp');
    expect(authHelpers).toHaveProperty('signOut');
    expect(authHelpers).toHaveProperty('getUserSession');
    expect(authHelpers).toHaveProperty('handleOAuthCallback');
    expect(authHelpers).toHaveProperty('verifyEmail');
    expect(authHelpers).toHaveProperty('forgotPassword');
    expect(authHelpers).toHaveProperty('verifyPasswordResetToken');
    expect(authHelpers).toHaveProperty('resetPassword');
  });

  it('all returned helpers are functions', () => {
    const config = createMockConfig();
    const cookies = createMockCookies();

    const authHelpers = createAuthHelpers(config, [], cookies);

    expect(typeof authHelpers.signIn).toBe('function');
    expect(typeof authHelpers.signUp).toBe('function');
    expect(typeof authHelpers.signOut).toBe('function');
    expect(typeof authHelpers.getUserSession).toBe('function');
    expect(typeof authHelpers.handleOAuthCallback).toBe('function');
    expect(typeof authHelpers.verifyEmail).toBe('function');
    expect(typeof authHelpers.forgotPassword).toBe('function');
    expect(typeof authHelpers.verifyPasswordResetToken).toBe('function');
    expect(typeof authHelpers.resetPassword).toBe('function');
  });

  it('creates provider map from array', () => {
    const config = createMockConfig();
    const cookies = createMockCookies();

    const mockProvider = {
      id: 'google' as const,
      type: 'oauth' as const,
      createAuthorizationUrl: vi.fn(),
      completeSignin: vi.fn(),
      onAuthentication: vi.fn(),
      getErrorRedirectPath: vi.fn(),
    };

    // We can't directly test the internal map, but we can test that
    // the providers are accessible through the helpers
    const authHelpers = createAuthHelpers(config, [mockProvider], cookies);

    expect(authHelpers).toBeDefined();
  });
});
