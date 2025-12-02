import { describe, test, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { CredentialProvider } from '../provider';
import {
  createMockCredentialProviderConfig,
  testSecret,
  mockToken,
  createMockRequest,
  type MockCredentialProviderConfig,
} from './setup';
import { UnknownError } from '../../../core/errors';

// ============================================
// MOCK CORE MODULES
// ============================================

vi.mock('../../../core/password', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../core/password')>();
  return {
    ...actual,
    verifyPasswordResetToken: vi.fn(),
  };
});

import {
  verifyPasswordResetToken,
  InvalidPasswordResetTokenError,
} from '../../../core/password';

describe('CredentialProvider.verifyPasswordResetToken', () => {
  let provider: CredentialProvider;
  let mockConfig: MockCredentialProviderConfig;

  const testEmail = 'test@example.com';

  const mockTokenPayload = {
    email: testEmail,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig = createMockCredentialProviderConfig();
    provider = new CredentialProvider(mockConfig);
  });

  test('should return email and redirectTo on successful verification', async () => {
    const request = createMockRequest(
      `https://myapp.com/api/auth/verify-password-reset-token?token=${mockToken}`,
    );

    vi.mocked(verifyPasswordResetToken).mockReturnValue(
      okAsync(mockTokenPayload),
    );

    const result = await provider.verifyPasswordResetToken(request, testSecret);

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.email).toBe(testEmail);
    expect(value.redirectTo).toContain(
      mockConfig.onPasswordReset.redirects.tokenVerificationSuccess,
    );
    expect(value.redirectTo).toContain(`token=${mockToken}`);
  });

  test('should append error to redirect URL when token is missing', async () => {
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token',
    );

    const result = await provider.verifyPasswordResetToken(request, testSecret);

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.email).toBe('');
    expect(value.redirectTo).toBe(
      `${mockConfig.onPasswordReset.redirects.tokenVerificationError}?error=password_reset_token_not_found_error`,
    );
  });

  test('should append error to redirect URL when token is empty', async () => {
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=',
    );

    const result = await provider.verifyPasswordResetToken(request, testSecret);

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.email).toBe('');
    expect(value.redirectTo).toBe(
      `${mockConfig.onPasswordReset.redirects.tokenVerificationError}?error=password_reset_token_not_found_error`,
    );
  });

  test('should append error to redirect URL when token verification fails', async () => {
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=invalid-token',
    );

    const verificationError = new InvalidPasswordResetTokenError();
    vi.mocked(verifyPasswordResetToken).mockReturnValue(
      errAsync(verificationError),
    );

    const result = await provider.verifyPasswordResetToken(request, testSecret);

    expect(result.isOk()).toBe(true);

    const value = result._unsafeUnwrap();
    expect(value.email).toBe('');
    expect(value.redirectTo).toBe(
      `${mockConfig.onPasswordReset.redirects.tokenVerificationError}?error=invalid_password_reset_token_error`,
    );
  });

  test('should wrap non-SuperAuthError in UnknownError', async () => {
    const request = createMockRequest(
      `https://myapp.com/api/auth/verify-password-reset-token?token=${mockToken}`,
    );

    const unknownError = { weird: 'error object' };
    vi.mocked(verifyPasswordResetToken).mockReturnValue(
      errAsync(unknownError as any),
    );

    const result = await provider.verifyPasswordResetToken(request, testSecret);

    expect(result.isErr()).toBe(true);

    const error = result._unsafeUnwrapErr();
    expect(error).toBeInstanceOf(UnknownError);
  });
});
