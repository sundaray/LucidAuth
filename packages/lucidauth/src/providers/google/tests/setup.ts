import {
  GoogleProviderConfig,
  GoogleTokenResponse,
  GoogleUserClaims,
} from '../types';
import { vi } from 'vitest';

export function createMockConfig(
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

export function createMockTokenResponse(): GoogleTokenResponse {
  return {
    access_token: 'test-access-token',
    expires_in: 3600,
    id_token: 'test-id-token',
    scope: 'openid email profile',
    token_type: 'Bearer',
  };
}

export function createMockUserClaims(
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
