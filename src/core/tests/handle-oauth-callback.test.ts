import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ok, err, okAsync, errAsync } from 'neverthrow';
import { createAuthHelpers } from '../auth';
import {
  mockConfig,
  testContext,
  type TestContext,
  createMockOAuthProvider,
  createMockCredentialProvider,
  createMockProviderRegistry,
  createMockOAuthService,
  createMockCredentialService,
  createMockSessionService,
  createMockSessionStorage,
  mockUserSessionData,
} from './setup';
import { SuperAuthError, UnknownError } from '../errors';
import {
  ProviderNotFoundError,
  InvalidProviderTypeError,
} from '../oauth/errors';

// ============================================
// MOCK SERVICE MODULES
// ============================================
const mockProviderRegistry = createMockProviderRegistry();
const mockOAuthService = createMockOAuthService();
const mockCredentialService = createMockCredentialService();
const mockSessionService = createMockSessionService();

vi.mock('../services', () => ({
  ProviderRegistry: vi.fn(function () {
    return mockProviderRegistry;
  }),
  OAuthService: vi.fn(function () {
    return mockOAuthService;
  }),
  CredentialService: vi.fn(function () {
    return mockCredentialService;
  }),
  SessionService: vi.fn(function () {
    return mockSessionService;
  }),
}));

describe('handleResetPassword', () => {
  let authHelpers: ReturnType<typeof createAuthHelpers<TestContext>>;

  const mockRequest = new Request(
    'https://myapp.com/api/auth/callback?code=auth_code',
  );

  const mockUserSessionStorage = createMockSessionStorage<undefined>();
  const mockOAuthStateStorage = createMockSessionStorage<undefined>();
  const mockOAuthProvider = createMockOAuthProvider();
  const mockCredentialProvider = createMockCredentialProvider();

  beforeEach(() => {
    vi.resetAllMocks();
    authHelpers = createAuthHelpers(
      mockConfig,
      mockUserSessionStorage,
      mockOAuthStateStorage,
      [mockOAuthProvider, mockCredentialProvider],
    );
  });

  test('should return redirectTo on successful OAuth callback', async () => {
    const expectedRedirect = '/dashboard';

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: expectedRedirect,
      }),
    );
    mockSessionService.createSession.mockReturnValue(
      okAsync('encrypted-session-jwe'),
    );
    mockUserSessionStorage.saveSession.mockReturnValue(okAsync(undefined));
    mockOAuthStateStorage.deleteSession.mockReturnValue(okAsync(undefined));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({ redirectTo: expectedRedirect });
  });

  test('should call oauthService.completeSignIn with request, context, and provider', async () => {
    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(okAsync('session-jwe'));
    mockUserSessionStorage.saveSession.mockReturnValue(okAsync(undefined));
    mockOAuthStateStorage.deleteSession.mockReturnValue(okAsync(undefined));

    await authHelpers.handleOAuthCallback(mockRequest, testContext, 'google');

    expect(mockOAuthService.completeSignIn).toHaveBeenCalledWith(
      mockRequest,
      testContext,
      mockOAuthProvider,
    );
  });

  test('should create session with sessionData and provider id', async () => {
    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(okAsync('session-jwe'));
    mockUserSessionStorage.saveSession.mockReturnValue(okAsync(undefined));
    mockOAuthStateStorage.deleteSession.mockReturnValue(okAsync(undefined));

    await authHelpers.handleOAuthCallback(mockRequest, testContext, 'google');

    expect(mockSessionService.createSession).toHaveBeenCalledWith(
      mockUserSessionData,
      'google',
    );
  });

  test('should save session to userSessionStorage', async () => {
    const sessionJWE = 'encrypted-session-jwe';

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(okAsync(sessionJWE));
    mockUserSessionStorage.saveSession.mockReturnValue(okAsync(undefined));
    mockOAuthStateStorage.deleteSession.mockReturnValue(okAsync(undefined));

    await authHelpers.handleOAuthCallback(mockRequest, testContext, 'google');

    expect(mockUserSessionStorage.saveSession).toHaveBeenCalledWith(
      testContext,
      sessionJWE,
    );
  });
  test('should pass through SuperAuthError from oauthService.completeSignIn', async () => {
    const oauthError = new SuperAuthError({
      message: 'Failed to complete OAuth',
    });

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(errAsync(oauthError));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(oauthError);
  });

  test('should wrap unknown error from oauthService.completeSignIn in UnknownError', async () => {
    const unknownError = new Error('Unknown error');

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(errAsync(unknownError));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(UnknownError);
    expect(error.cause).toBe(unknownError);
  });

  test('should pass through SuperAuthError from sessionService.createSession', async () => {
    const sessionError = new SuperAuthError({
      message: 'Failed to create session',
    });

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(errAsync(sessionError));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(sessionError);
  });

  test('should pass through SuperAuthError from userSessionStorage.saveSession', async () => {
    const storageError = new SuperAuthError({
      message: 'Failed to save user session',
    });

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(okAsync('session-jwe'));
    mockUserSessionStorage.saveSession.mockReturnValue(errAsync(storageError));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(storageError);
  });

  test('should pass through SuperAuthError from oauthSessionStorage.deleteSession', async () => {
    const deleteError = new SuperAuthError({
      message: 'Failed to delete OAuth state',
    });

    mockProviderRegistry.get.mockReturnValue(ok(mockOAuthProvider));
    mockOAuthService.completeSignIn.mockReturnValue(
      okAsync({
        sessionData: mockUserSessionData,
        redirectTo: '/dashboard',
      }),
    );
    mockSessionService.createSession.mockReturnValue(okAsync('session-jwe'));
    mockUserSessionStorage.saveSession.mockReturnValue(okAsync(undefined));
    mockOAuthStateStorage.deleteSession.mockReturnValue(errAsync(deleteError));

    const result = await authHelpers.handleOAuthCallback(
      mockRequest,
      testContext,
      'google',
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(deleteError);
  });
});
