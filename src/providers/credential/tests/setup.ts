import { vi } from 'vitest';
import type { CredentialProviderConfig } from '../types.js';
import type { User } from '../../../core/session/types.js';

// ============================================
// MOCK USER
// ============================================

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

// ============================================
// MOCK CREDENTIAL PROVIDER CONFIG
// ============================================

export function createMockCredentialProviderConfig(
  overrides: Partial<CredentialProviderConfig> = {},
): CredentialProviderConfig {
  return {
    onSignUp: {
      checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: false }),
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
      createCredentialUser: vi.fn().mockResolvedValue(undefined),
      redirects: {
        signUpSuccess: '/auth/verify-email-sent',
        emailVerificationSuccess: '/auth/signin',
        emailVerificationError: '/auth/error',
      },
      ...overrides.onSignUp,
    },
    onSignIn: {
      getCredentialUser: vi.fn().mockResolvedValue({
        ...createMockUser(),
        hashedPassword: 'hashed-password-123',
      }),
      ...overrides.onSignIn,
    },
    onPasswordReset: {
      checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: true }),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      sendPasswordUpdateEmail: vi.fn().mockResolvedValue(undefined),
      redirects: {
        forgotPasswordSuccess: '/auth/forgot-password-success',
        tokenVerificationSuccess: '/auth/reset-password',
        tokenVerificationError: '/auth/error',
        resetPasswordSuccess: '/auth/signin',
      },
      ...overrides.onPasswordReset,
    },
    ...overrides,
  };
}

// ============================================
// MOCK REQUEST
// ============================================

export function createMockRequest(url: string): Request {
  return new Request(url);
}

// ============================================
// TEST CONSTANTS
// ============================================

export const TEST_SECRET = 'test-secret-key-at-least-32-characters-long';
export const TEST_BASE_URL = 'https://myapp.com';
