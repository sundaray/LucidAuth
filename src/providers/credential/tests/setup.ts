import { vi, type Mock } from 'vitest';
import type { CredentialProviderConfig } from '../types';

// ============================================
// MOCK CONFIG FACTORY
// ============================================

export interface MockCredentialProviderConfig extends CredentialProviderConfig {
  onSignUp: {
    checkUserExists: Mock;
    sendVerificationEmail: Mock;
    createUser: Mock;
    redirects: {
      checkEmail: `/${string}`;
      emailVerificationSuccess: `/${string}`;
      emailVerificationError: `/${string}`;
    };
  };
  onSignIn: Mock;
  onPasswordReset: {
    checkUserExists: Mock;
    sendPasswordResetEmail: Mock;
    updatePassword: Mock;
    sendPasswordUpdatedEmail: Mock;
    redirects: {
      checkEmail: `/${string}`;
      resetForm: `/${string}`;
      resetPasswordSuccess: `/${string}`;
      resetPasswordError: `/${string}`;
    };
  };
}

export function createMockCredentialProviderConfig(): MockCredentialProviderConfig {
  return {
    onSignUp: {
      checkUserExists: vi.fn(),
      sendVerificationEmail: vi.fn(),
      createUser: vi.fn(),
      redirects: {
        checkEmail: '/check-email',
        emailVerificationSuccess: '/sign-in',
        emailVerificationError: '/sign-up/error',
      },
    },
    onSignIn: vi.fn(),
    onPasswordReset: {
      checkUserExists: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      updatePassword: vi.fn(),
      sendPasswordUpdatedEmail: vi.fn(),
      redirects: {
        checkEmail: '/check-email',
        resetForm: '/reset-password',
        resetPasswordSuccess: '/sign-in',
        resetPasswordError: '/forgot-password/error',
      },
    },
  };
}

// ============================================
// COMMON TEST DATA
// ============================================

export const testSecret = 'test-secret-base64-encoded';
export const testBaseUrl = 'https://myapp.com';

export const testUserData = {
  email: 'test@example.com',
  password: 'securePassword123',
};

export const testUserDataWithAdditionalFields = {
  email: 'test@example.com',
  password: 'securePassword123',
  name: 'Test User',
  company: 'Acme Corp',
};

export const mockHashedPassword = 'hashed-password-value';

export const mockUserSession = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  hashedPassword: mockHashedPassword,
};

export const mockToken = 'mock-jwt-token-value';

export const mockVerificationUrl =
  'https://myapp.com/api/auth/verify-email?token=mock-jwt-token-value';

export const mockPasswordResetUrl =
  'https://myapp.com/api/auth/verify-password-reset-token?token=mock-jwt-token-value';

// ============================================
// HELPER TO CREATE MOCK REQUEST
// ============================================

export function createMockRequest(url: string): Request {
  return new Request(url);
}
