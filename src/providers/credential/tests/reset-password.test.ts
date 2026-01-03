import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { resetPassword } from '../reset-password.js';
import { createMockCredentialProviderConfig, TEST_SECRET } from './setup.js';
import { CallbackError, LucidAuthError } from '../../../core/errors.js';

// Mock dependencies
vi.mock('../../../core/password/index.js', () => ({
  verifyPasswordResetToken: vi
    .fn()
    .mockReturnValue(okAsync({ email: 'test@example.com' })),
}));

vi.mock('../../../core/password/hash.js', () => ({
  hashPassword: vi.fn().mockReturnValue(okAsync('new-hashed-password')),
}));

import { verifyPasswordResetToken } from '../../../core/password/index.js';
import { hashPassword } from '../../../core/password/hash.js';

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success redirect URL on successful password reset', async () => {
    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    const result = await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/signin',
    });
  });

  it('verifies password reset token', async () => {
    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(verifyPasswordResetToken).toHaveBeenCalledWith(
      'valid-token',
      TEST_SECRET,
    );
  });

  it('hashes the new password', async () => {
    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(hashPassword).toHaveBeenCalledWith('newPassword123');
  });

  it('calls updatePassword with email and hashed password', async () => {
    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(config.onPasswordReset.updatePassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      hashedPassword: 'new-hashed-password',
    });
  });

  it('sends password update email', async () => {
    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(config.onPasswordReset.sendPasswordUpdateEmail).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
      },
    );
  });

  it('returns error when token verification fails', async () => {
    class MockTokenError extends LucidAuthError {
      constructor() {
        super({ message: 'Token expired' });
        this.name = 'MockTokenError';
      }
    }

    vi.mocked(verifyPasswordResetToken).mockReturnValue(
      errAsync(new MockTokenError()),
    );

    const config = createMockCredentialProviderConfig();
    const handleResetPassword = resetPassword(config);

    const result = await handleResetPassword(
      'expired-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MockTokenError);
  });

  it('returns CallbackError when updatePassword fails', async () => {
    const config = createMockCredentialProviderConfig({
      onPasswordReset: {
        checkCredentialUserExists: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        updatePassword: vi.fn().mockRejectedValue(new Error('Database error')),
        sendPasswordUpdateEmail: vi.fn(),
        redirects: {
          forgotPasswordSuccess: '/auth/forgot-password-success',
          tokenVerificationSuccess: '/auth/reset-password',
          tokenVerificationError: '/auth/error',
          resetPasswordSuccess: '/auth/signin',
        },
      },
    });
    const handleResetPassword = resetPassword(config);

    const result = await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });

  it('returns CallbackError when sendPasswordUpdateEmail fails', async () => {
    const config = createMockCredentialProviderConfig({
      onPasswordReset: {
        checkCredentialUserExists: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        updatePassword: vi.fn().mockResolvedValue(undefined),
        sendPasswordUpdateEmail: vi
          .fn()
          .mockRejectedValue(new Error('Email error')),
        redirects: {
          forgotPasswordSuccess: '/auth/forgot-password-success',
          tokenVerificationSuccess: '/auth/reset-password',
          tokenVerificationError: '/auth/error',
          resetPasswordSuccess: '/auth/signin',
        },
      },
    });
    const handleResetPassword = resetPassword(config);

    const result = await handleResetPassword(
      'valid-token',
      { newPassword: 'newPassword123' },
      TEST_SECRET,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });
});
