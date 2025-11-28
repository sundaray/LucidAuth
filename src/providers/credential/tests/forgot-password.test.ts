import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync, errAsync } from 'neverthrow';
import { CredentialProvider } from '../provider';
import {
  createMockCredentialProviderConfig,
  testSecret,
  testBaseUrl,
  mockHashedPassword,
  mockToken,
  mockPasswordResetUrl,
  type MockCredentialProviderConfig,
} from './setup';
import {
  CallbackError,
  SuperAuthError,
  UnknownError,
} from '../../../core/errors';
import type {
  PasswordResetToken,
  PasswordResetUrl,
} from '../../../core/password/types';

// ============================================
// MOCK CORE MODULES
// ============================================

vi.mock('../../../core/password', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../core/password')>();
  return {
    ...actual,
    generatePasswordResetToken: vi.fn(),
    buildPasswordResetUrl: vi.fn(),
  };
});

import {
  generatePasswordResetToken,
  buildPasswordResetUrl,
} from '../../../core/password';

describe('CredentialProvider.forgotPassword', () => {
  let provider: CredentialProvider;
  let mockConfig: MockCredentialProviderConfig;

  const testEmail = 'test@example.com';

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig = createMockCredentialProviderConfig();
    provider = new CredentialProvider(mockConfig);
  });

  test('should return redirectTo on successful forgot password request', async () => {
    mockConfig.onPasswordReset.checkUserExists.mockResolvedValue({
      exists: true,
      passwordHash: mockHashedPassword,
    });
    vi.mocked(generatePasswordResetToken).mockReturnValue(
      okAsync(mockToken as PasswordResetToken),
    );
    vi.mocked(buildPasswordResetUrl).mockReturnValue(
      ok(mockPasswordResetUrl as PasswordResetUrl),
    );
    mockConfig.onPasswordReset.sendPasswordResetEmail.mockResolvedValue(
      undefined,
    );

    const result = await provider.forgotPassword(
      { email: testEmail },
      testSecret,
      testBaseUrl,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: mockConfig.onPasswordReset.redirects.checkEmail,
    });
  });

  test('should silently succeed when user does not exist', async () => {
    mockConfig.onPasswordReset.checkUserExists.mockResolvedValue({
      exists: false,
    });

    const result = await provider.forgotPassword(
      { email: testEmail },
      testSecret,
      testBaseUrl,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: mockConfig.onPasswordReset.redirects.checkEmail,
    });
  });

  test('should not generate token or send email when user does not exist', async () => {
    mockConfig.onPasswordReset.checkUserExists.mockResolvedValue({
      exists: false,
    });

    await provider.forgotPassword(
      { email: testEmail },
      testSecret,
      testBaseUrl,
    );

    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    expect(buildPasswordResetUrl).not.toHaveBeenCalled();
    expect(
      mockConfig.onPasswordReset.sendPasswordResetEmail,
    ).not.toHaveBeenCalled();
  });

  test('should return CallbackError when checkUserExists throws', async () => {
    const callbackError = new Error('Database connection failed');
    mockConfig.onPasswordReset.checkUserExists.mockRejectedValue(callbackError);

    const result = await provider.forgotPassword(
      { email: testEmail },
      testSecret,
      testBaseUrl,
    );

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(CallbackError);
  });

  test('should return CallbackError when sendPasswordResetEmail throws', async () => {
    const callbackError = new Error('Email service unavailable');

    mockConfig.onPasswordReset.checkUserExists.mockResolvedValue({
      exists: true,
      passwordHash: mockHashedPassword,
    });
    vi.mocked(generatePasswordResetToken).mockReturnValue(
      okAsync(mockToken as PasswordResetToken),
    );
    vi.mocked(buildPasswordResetUrl).mockReturnValue(
      ok(mockPasswordResetUrl as PasswordResetUrl),
    );
    mockConfig.onPasswordReset.sendPasswordResetEmail.mockRejectedValue(
      callbackError,
    );

    const result = await provider.forgotPassword(
      { email: testEmail },
      testSecret,
      testBaseUrl,
    );

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(CallbackError);
  });
});
