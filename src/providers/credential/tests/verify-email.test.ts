import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync, errAsync } from 'neverthrow';
import { verifyEmail } from '../verify-email.js';
import {
  createMockCredentialProviderConfig,
  createMockRequest,
  TEST_SECRET,
} from './setup.js';
import { CallbackError, LucidAuthError } from '../../../core/errors.js';
import { EmailVerificationTokenNotFoundError } from '../../../core/verification/errors.js';

// Mock dependencies
vi.mock('../../../core/utils', () => ({
  parseUrl: vi
    .fn()
    .mockReturnValue(
      ok(new URL('https://myapp.com/api/auth/verify-email?token=valid-token')),
    ),
  appendErrorToPath: vi
    .fn()
    .mockImplementation((path, errorName) => `${path}?error=${errorName}`),
}));

vi.mock('../../../core/verification/index.js', () => ({
  verifyEmailVerificationToken: vi.fn().mockReturnValue(
    okAsync({
      email: 'test@example.com',
      hashedPassword: 'hashed-password-123',
    }),
  ),
}));

import { parseUrl, appendErrorToPath } from '../../../core/utils';
import { verifyEmailVerificationToken } from '../../../core/verification/index.js';

describe('verifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseUrl).mockReturnValue(
      ok(new URL('https://myapp.com/api/auth/verify-email?token=valid-token')),
    );
  });

  it('returns success redirect URL on successful verification', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=valid-token',
    );

    const result = await handleVerifyEmail(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/signin',
    });
  });

  it('parses URL from request', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=valid-token',
    );

    await handleVerifyEmail(request, TEST_SECRET);

    expect(parseUrl).toHaveBeenCalledWith(request.url);
  });

  it('returns error when token is missing', async () => {
    vi.mocked(parseUrl).mockReturnValue(
      ok(new URL('https://myapp.com/api/auth/verify-email')),
    );

    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email',
    );

    const result = await handleVerifyEmail(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().redirectTo).toContain('/auth/error');
  });

  it('verifies token with secret', async () => {
    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=valid-token',
    );

    await handleVerifyEmail(request, TEST_SECRET);

    expect(verifyEmailVerificationToken).toHaveBeenCalledWith(
      'valid-token',
      TEST_SECRET,
    );
  });

  it('calls createCredentialUser with token payload', async () => {
    vi.mocked(verifyEmailVerificationToken).mockReturnValue(
      okAsync({
        email: 'test@example.com',
        hashedPassword: 'hashed-password-123',
        name: 'Test User',
      }),
    );

    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=valid-token',
    );

    await handleVerifyEmail(request, TEST_SECRET);

    expect(config.onSignUp.createCredentialUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      hashedPassword: 'hashed-password-123',
      name: 'Test User',
    });
  });

  it('redirects to error path on LucidAuthError', async () => {
    class MockVerificationError extends LucidAuthError {
      constructor() {
        super({ message: 'Token expired' });
        this.name = 'MockVerificationError';
      }
    }

    vi.mocked(verifyEmailVerificationToken).mockReturnValue(
      errAsync(new MockVerificationError()),
    );

    const config = createMockCredentialProviderConfig();
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=expired-token',
    );

    const result = await handleVerifyEmail(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(appendErrorToPath).toHaveBeenCalledWith(
      '/auth/error',
      'MockVerificationError',
    );
  });

  it('returns CallbackError when createCredentialUser fails', async () => {
    const config = createMockCredentialProviderConfig({
      onSignUp: {
        checkCredentialUserExists: vi.fn(),
        sendVerificationEmail: vi.fn(),
        createCredentialUser: vi
          .fn()
          .mockRejectedValue(new Error('Database error')),
        redirects: {
          signUpSuccess: '/auth/verify-email-sent',
          emailVerificationSuccess: '/auth/signin',
          emailVerificationError: '/auth/error',
        },
      },
    });
    const handleVerifyEmail = verifyEmail(config);
    const request = createMockRequest(
      'https://myapp.com/api/auth/verify-email?token=valid-token',
    );

    const result = await handleVerifyEmail(request, TEST_SECRET);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().redirectTo).toContain('/auth/error');
  });
});
