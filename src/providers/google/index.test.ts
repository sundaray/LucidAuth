import { Google } from './index.js';
import type { GoogleProviderConfig } from './types.js';
import { describe, it, expect, vi } from 'vitest';

// ============================================
// MOCK FACTORY
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

// ============================================
// TESTS
// ============================================

describe('Google provider', () => {
  // ============ Provider Shape ============
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
