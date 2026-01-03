import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { verifyPasswordResetToken } from '../verify-password-reset-token.js';
import {
  createMockAuthContext,
  createMockCredentialProvider,
  createMockRequest,
} from './setup.js';
import { CredentialProviderNotFoundError } from '../../../providers/errors.js';

describe('verifyPasswordResetToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls provider verifyPasswordResetToken with request and secret', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyToken = verifyPasswordResetToken(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=abc123',
    );
    await handleVerifyToken(request);

    expect(
      mockCredentialProvider.verifyPasswordResetToken,
    ).toHaveBeenCalledWith(request, ctx.config.session.secret);
  });

  it('returns email and redirect URL on success', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyToken = verifyPasswordResetToken(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=abc123',
    );
    const result = await handleVerifyToken(request);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      email: 'test@example.com',
      redirectTo: '/auth/reset-password',
    });
  });

  it('returns error when credential provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleVerifyToken = verifyPasswordResetToken(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=abc123',
    );
    const result = await handleVerifyToken(request);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('propagates provider errors', async () => {
    const mockCredentialProvider = createMockCredentialProvider({
      verifyPasswordResetToken: vi
        .fn()
        .mockReturnValue(errAsync(new Error('Token expired'))),
    });
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyToken = verifyPasswordResetToken(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=expired',
    );
    const result = await handleVerifyToken(request);

    expect(result.isErr()).toBe(true);
  });
});
