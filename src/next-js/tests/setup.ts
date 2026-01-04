import { vi } from 'vitest';
import type { AuthConfig } from '../../types/index.js';
import type { User, UserSession } from '../../core/session/types.js';

// ============================================
// MOCK CONFIG
// ============================================

export function createMockConfig(
  overrides: Partial<AuthConfig> = {},
): AuthConfig {
  return {
    baseUrl: 'https://myapp.com',
    session: {
      secret: 'test-secret-key-at-least-32-chars-long',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    },
    providers: [],
    ...overrides,
  };
}

// ============================================
// MOCK USER & SESSION
// ============================================

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

export function createMockUserSession(
  overrides: Partial<UserSession> = {},
): UserSession {
  return {
    user: createMockUser(),
    provider: 'google',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 1 day from now
    ...overrides,
  };
}

// ============================================
// MOCK COOKIE STORE
// ============================================

export function createMockCookieStore(cookies: Record<string, string> = {}) {
  return {
    get: vi.fn((name: string) => {
      const value = cookies[name];
      return value ? { name, value } : undefined;
    }),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

// ============================================
// MOCK NEXT REQUEST
// ============================================

export function createMockNextRequest(
  url: string,
  options: {
    method?: string;
    cookies?: Record<string, string>;
  } = {},
) {
  const { method = 'GET', cookies = {} } = options;

  return {
    url,
    method,
    cookies: {
      get: vi.fn((name: string) => {
        const value = cookies[name];
        return value ? { name, value } : undefined;
      }),
    },
  };
}

// ============================================
// TEST CONSTANTS
// ============================================

export const TEST_SECRET = 'test-secret-key-at-least-32-chars-long';
export const TEST_BASE_URL = 'https://myapp.com';
export const TEST_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
