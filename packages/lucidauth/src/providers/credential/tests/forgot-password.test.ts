import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync } from 'neverthrow';
import { forgotPassword } from '../forgot-password.js';
import {
  createMockCredentialProviderConfig,
  TEST_SECRET,
  TEST_BASE_URL,
} from './setup.js';
import { CallbackError } from '../../../core/errors.js';

// Mock dependencies
vi.mock('../../../core/password/index.js', () => ({
  generatePasswordResetToken: vi
    .fn()
    .mockReturnValue(okAsync('mock-reset-token')),
  buildPasswordResetUrl: vi
    .fn()
    .mockReturnValue(
      ok(
        'https://myapp.com/api/auth/verify-password-reset-token?token=mock-token',
      ),
    ),
}));

import {
  generatePasswordResetToken,
  buildPasswordResetUrl,
} from '../../../core/password/index.js';

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success redirect URL when user exists', async () => {
    const config = createMockCredentialProviderConfig();
    const handleForgotPassword = forgotPassword(config);

    const result = await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/forgot-password-success',
    });
  });

  it('checks if user exists', async () => {
    const config = createMockCredentialProviderConfig();
    const handleForgotPassword = forgotPassword(config);

    await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(
      config.onPasswordReset.checkCredentialUserExists,
    ).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('silently succeeds when user does not exist', async () => {
    const config = createMockCredentialProviderConfig({
      onPasswordReset: {
        checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: false }),
        sendPasswordResetEmail: vi.fn(),
        updatePassword: vi.fn(),
        sendPasswordUpdateEmail: vi.fn(),
        redirects: {
          forgotPasswordSuccess: '/auth/forgot-password-success',
          tokenVerificationSuccess: '/auth/reset-password',
          tokenVerificationError: '/auth/error',
          resetPasswordSuccess: '/auth/signin',
        },
      },
    });
    const handleForgotPassword = forgotPassword(config);

    const result = await handleForgotPassword(
      { email: 'nonexistent@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/forgot-password-success',
    });
    expect(generatePasswordResetToken).not.toHaveBeenCalled();
    expect(
      config.onPasswordReset.sendPasswordResetEmail,
    ).not.toHaveBeenCalled();
  });

  it('generates password reset token', async () => {
    const config = createMockCredentialProviderConfig();
    const handleForgotPassword = forgotPassword(config);

    await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(generatePasswordResetToken).toHaveBeenCalledWith({
      secret: TEST_SECRET,
      payload: { email: 'test@example.com' },
    });
  });

  it('builds password reset URL', async () => {
    const config = createMockCredentialProviderConfig();
    const handleForgotPassword = forgotPassword(config);

    await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(buildPasswordResetUrl).toHaveBeenCalledWith(
      TEST_BASE_URL,
      'mock-reset-token',
      '/api/auth/verify-password-reset-token',
    );
  });

  it('sends password reset email', async () => {
    const config = createMockCredentialProviderConfig();
    const handleForgotPassword = forgotPassword(config);

    await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(config.onPasswordReset.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      url: 'https://myapp.com/api/auth/verify-password-reset-token?token=mock-token',
    });
  });

  it('returns CallbackError when checkCredentialUserExists fails', async () => {
    const config = createMockCredentialProviderConfig({
      onPasswordReset: {
        checkCredentialUserExists: vi
          .fn()
          .mockRejectedValue(new Error('Database error')),
        sendPasswordResetEmail: vi.fn(),
        updatePassword: vi.fn(),
        sendPasswordUpdateEmail: vi.fn(),
        redirects: {
          forgotPasswordSuccess: '/auth/forgot-password-success',
          tokenVerificationSuccess: '/auth/reset-password',
          tokenVerificationError: '/auth/error',
          resetPasswordSuccess: '/auth/signin',
        },
      },
    });
    const handleForgotPassword = forgotPassword(config);

    const result = await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });

  it('returns CallbackError when sendPasswordResetEmail fails', async () => {
    const config = createMockCredentialProviderConfig({
      onPasswordReset: {
        checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: true }),
        sendPasswordResetEmail: vi
          .fn()
          .mockRejectedValue(new Error('Email service error')),
        updatePassword: vi.fn(),
        sendPasswordUpdateEmail: vi.fn(),
        redirects: {
          forgotPasswordSuccess: '/auth/forgot-password-success',
          tokenVerificationSuccess: '/auth/reset-password',
          tokenVerificationError: '/auth/error',
          resetPasswordSuccess: '/auth/signin',
        },
      },
    });
    const handleForgotPassword = forgotPassword(config);

    const result = await handleForgotPassword(
      { email: 'test@example.com' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });
});
