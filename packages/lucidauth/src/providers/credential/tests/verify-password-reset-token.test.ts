import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync, errAsync } from 'neverthrow';
import { verifyPasswordResetToken } from '../verify-password-reset-token.js';
import {
  createMockCredentialProviderConfig,
  createMockRequest,
  TEST_SECRET,
} from './setup.js';
import { LucidAuthError } from '../../../core/errors.js';

// Mock dependencies
vi.mock('../../../core/utils', () => ({
  parseUrl: vi
    .fn()
    .mockReturnValue(
      ok(
        new URL(
          'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
        ),
      ),
    ),
  appendErrorToPath: vi
    .fn()
    .mockImplementation((path, errorName) => `${path}?error=${errorName}`),
}));

vi.mock('../../../core/password/index.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../../core/password/index.js')>();
  return {
    ...actual,
    verifyPasswordResetToken: vi.fn(),
  };
});

import { parseUrl, appendErrorToPath } from '../../../core/utils';
import { verifyPasswordResetToken as verifyToken } from '../../../core/password/index.js';

describe('verifyPasswordResetToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseUrl).mockReturnValue(
      ok(
        new URL(
          'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
        ),
      ),
    );

    vi.mocked(verifyToken).mockReturnValue(
      okAsync({ email: 'test@example.com' }),
    );
  });

  it('returns email and redirect URL on successful verification', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
    );

    const result = await handleVerifyToken(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      email: 'test@example.com',
      redirectTo: '/auth/reset-password?token=valid-token',
    });
  });

  it('parses URL from request', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
    );

    await handleVerifyToken(request, TEST_SECRET);

    expect(parseUrl).toHaveBeenCalledWith(request.url);
  });

  it('redirects to error path when token is missing', async () => {
    vi.mocked(parseUrl).mockReturnValue(
      ok(new URL('https://myapp.com/api/auth/verify-password-reset-token')),
    );

    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token',
    );

    const result = await handleVerifyToken(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().email).toBe('');
    expect(result._unsafeUnwrap().redirectTo).toContain('/auth/error');
  });

  it('verifies token with secret', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
    );

    await handleVerifyToken(request, TEST_SECRET);

    expect(verifyToken).toHaveBeenCalledWith('valid-token', TEST_SECRET);
  });

  it('appends token to redirect URL', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=valid-token',
    );

    const result = await handleVerifyToken(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().redirectTo).toBe(
      '/auth/reset-password?token=valid-token',
    );
  });

  it('redirects to error path on LucidAuthError', async () => {
    class MockTokenError extends LucidAuthError {
      constructor() {
        super({ message: 'Token expired' });
        this.name = 'MockTokenError';
      }
    }

    vi.mocked(verifyToken).mockReturnValue(errAsync(new MockTokenError()));

    const config = createMockCredentialProviderConfig();
    const handleVerifyToken = verifyPasswordResetToken(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-password-reset-token?token=expired-token',
    );

    const result = await handleVerifyToken(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().email).toBe('');
    expect(appendErrorToPath).toHaveBeenCalledWith(
      '/auth/error',
      'MockTokenError',
    );
  });
});
