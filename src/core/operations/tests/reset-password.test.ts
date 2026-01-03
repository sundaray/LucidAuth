import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { resetPassword } from '../reset-password.js';
import {
  createMockAuthContext,
  createMockCredentialProvider,
} from './setup.js';
import { CredentialProviderNotFoundError } from '../../../providers/errors.js';

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls provider resetPassword with correct parameters', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleResetPassword = resetPassword(ctx);
    await handleResetPassword('reset-token', 'newPassword123');

    expect(mockCredentialProvider.resetPassword).toHaveBeenCalledWith(
      'reset-token',
      { newPassword: 'newPassword123' },
      ctx.config.session.secret,
    );
  });

  it('returns redirect URL on success', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleResetPassword = resetPassword(ctx);
    const result = await handleResetPassword('reset-token', 'newPassword123');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/signin',
    });
  });

  it('returns error when credential provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleResetPassword = resetPassword(ctx);
    const result = await handleResetPassword('reset-token', 'newPassword123');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('propagates provider errors', async () => {
    const mockCredentialProvider = createMockCredentialProvider({
      resetPassword: vi
        .fn()
        .mockReturnValue(errAsync(new Error('Invalid token'))),
    });
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleResetPassword = resetPassword(ctx);
    const result = await handleResetPassword('invalid-token', 'newPassword123');

    expect(result.isErr()).toBe(true);
  });
});
