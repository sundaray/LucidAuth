import { vi } from 'vitest';
import { ok, okAsync } from 'neverthrow';
import type { AuthContext, SessionOperations } from '../../types.js';
import type { AuthConfig } from '../../../types/index.js';
import type {
  OAuthProvider,
  CredentialProvider,
  AnyAuthProvider,
} from '../../../providers/types.js';
import type { CredentialProviderConfig } from '../../../providers/credential/types.js';
import type { User } from '../../session/types.js';

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
    providers: [],
    ...overrides,
  };
}

// ============================================
// MOCK SESSION OPERATIONS
// ============================================

export function createMockSessionOperations(
  overrides: Partial<SessionOperations> = {},
): SessionOperations {
  return {
    setUserSession: vi.fn().mockReturnValue(okAsync(undefined)),
    getUserSession: vi.fn().mockReturnValue(okAsync(null)),
    deleteUserSession: vi.fn().mockReturnValue(okAsync(undefined)),
    setOAuthState: vi.fn().mockReturnValue(okAsync(undefined)),
    getOAuthState: vi.fn().mockReturnValue(okAsync(null)),
    deleteOAuthState: vi.fn().mockReturnValue(okAsync(undefined)),
    ...overrides,
  };
}

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
// MOCK OAUTH PROVIDER
// ============================================

export function createMockOAuthProvider(
  overrides: Partial<OAuthProvider> = {},
): OAuthProvider {
  return {
    id: 'google',
    type: 'oauth',
    createAuthorizationUrl: vi
      .fn()
      .mockReturnValue(
        ok('https://accounts.google.com/o/oauth2/v2/auth?client_id=test'),
      ),
    completeSignin: vi.fn().mockReturnValue(
      okAsync({
        sub: '123456789',
        email: 'test@example.com',
        name: 'Test User',
      }),
    ),
    onAuthentication: vi.fn().mockReturnValue(okAsync(createMockUser())),
    getErrorRedirectPath: vi.fn().mockReturnValue('/auth/error'),
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
        signUpSuccess: '/auth/verify-email',
        emailVerificationSuccess: '/auth/signin',
        emailVerificationError: '/auth/error',
      },
      ...overrides.onSignUp,
    },
    onSignIn: {
      getCredentialUser: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
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
  };
}

// ============================================
// MOCK CREDENTIAL PROVIDER
// ============================================

export function createMockCredentialProvider(
  overrides: Partial<CredentialProvider> = {},
): CredentialProvider {
  return {
    id: 'credential',
    type: 'credential',
    config: createMockCredentialProviderConfig(),
    signUp: vi
      .fn()
      .mockReturnValue(okAsync({ redirectTo: '/auth/verify-email' as const })),
    signIn: vi.fn().mockReturnValue(
      okAsync({
        ...createMockUser(),
        hashedPassword: 'hashed-password-123',
      }),
    ),
    verifyEmail: vi
      .fn()
      .mockReturnValue(okAsync({ redirectTo: '/auth/signin' as const })),
    forgotPassword: vi
      .fn()
      .mockReturnValue(
        okAsync({ redirectTo: '/auth/forgot-password-success' as const }),
      ),
    verifyPasswordResetToken: vi.fn().mockReturnValue(
      okAsync({
        email: 'test@example.com',
        redirectTo: '/auth/reset-password' as const,
      }),
    ),
    resetPassword: vi
      .fn()
      .mockReturnValue(okAsync({ redirectTo: '/auth/signin' as const })),
    ...overrides,
  };
}

// ============================================
// MOCK AUTH CONTEXT
// ============================================

export function createMockAuthContext(
  overrides: {
    config?: Partial<AuthConfig>;
    session?: Partial<SessionOperations>;
    providers?: AnyAuthProvider[];
  } = {},
): AuthContext {
  const config = createMockConfig(overrides.config);
  const session = createMockSessionOperations(overrides.session);

  const defaultProviders: AnyAuthProvider[] = [
    createMockOAuthProvider(),
    createMockCredentialProvider(),
  ];

  const providers = overrides.providers ?? defaultProviders;

  return {
    config,
    providers: new Map(providers.map((p) => [p.id, p])),
    session,
  };
}

// ============================================
// MOCK REQUEST
// ============================================

export function createMockRequest(url: string): Request {
  return new Request(url);
}
