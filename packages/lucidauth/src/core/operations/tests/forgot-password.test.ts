import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { forgotPassword } from '../forgot-password.js';
import {
  createMockAuthContext,
  createMockCredentialProvider,
} from './setup.js';
import { CredentialProviderNotFoundError } from '../../../providers/errors.js';

describe('forgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls provider forgotPassword with correct parameters', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleForgotPassword = forgotPassword(ctx);
    await handleForgotPassword('test@example.com');

    expect(mockCredentialProvider.forgotPassword).toHaveBeenCalledWith(
      { email: 'test@example.com' },
      ctx.config.session.secret,
      ctx.config.baseUrl,
    );
  });

  it('returns redirect URL on success', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleForgotPassword = forgotPassword(ctx);
    const result = await handleForgotPassword('test@example.com');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/forgot-password-success',
    });
  });

  it('returns error when credential provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleForgotPassword = forgotPassword(ctx);
    const result = await handleForgotPassword('test@example.com');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('propagates provider errors', async () => {
    const mockCredentialProvider = createMockCredentialProvider({
      forgotPassword: vi
        .fn()
        .mockReturnValue(errAsync(new Error('Email service unavailable'))),
    });
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleForgotPassword = forgotPassword(ctx);
    const result = await handleForgotPassword('test@example.com');

    expect(result.isErr()).toBe(true);
  });
});
