import { describe, it, expect, vi } from 'vitest';
import { getErrorRedirectPath } from './get-error-redirect-path.js';
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

describe('getErrorRedirectPath', () => {
  it('returns configured error redirect path', () => {
    const config = createMockConfig();
    config.onAuthentication.redirects.error = '/custom/error/page';

    const getPath = getErrorRedirectPath(config);

    expect(getPath()).toBe('/custom/error/page');
  });

  it('returns default error path from config', () => {
    const config = createMockConfig();

    const getPath = getErrorRedirectPath(config);

    expect(getPath()).toBe('/auth/error');
  });
});
