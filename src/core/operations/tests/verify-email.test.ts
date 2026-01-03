import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { verifyEmail } from '../verify-email.js';
import {
  createMockAuthContext,
  createMockCredentialProvider,
  createMockRequest,
} from './setup.js';
import { CredentialProviderNotFoundError } from '../../../providers/errors.js';

describe('verifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls provider verifyEmail with request and secret', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyEmail = verifyEmail(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=abc123',
    );
    await handleVerifyEmail(request);

    expect(mockCredentialProvider.verifyEmail).toHaveBeenCalledWith(
      request,
      ctx.config.session.secret,
    );
  });

  it('returns redirect URL on success', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyEmail = verifyEmail(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=abc123',
    );
    const result = await handleVerifyEmail(request);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/signin',
    });
  });

  it('returns error when credential provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleVerifyEmail = verifyEmail(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=abc123',
    );
    const result = await handleVerifyEmail(request);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('propagates provider errors', async () => {
    const mockCredentialProvider = createMockCredentialProvider({
      verifyEmail: vi
        .fn()
        .mockReturnValue(errAsync(new Error('Invalid token'))),
    });
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleVerifyEmail = verifyEmail(ctx);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=invalid',
    );
    const result = await handleVerifyEmail(request);

    expect(result.isErr()).toBe(true);
  });
});
