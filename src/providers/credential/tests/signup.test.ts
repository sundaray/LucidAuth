import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync, errAsync } from 'neverthrow';
import { signUp } from '../sign-up.js';
import {
  createMockCredentialProviderConfig,
  TEST_SECRET,
  TEST_BASE_URL,
} from './setup.js';
import { AccountAlreadyExistsError } from '../errors.js';
import { CallbackError } from '../../../core/errors.js';

// Mock dependencies
vi.mock('../../../core/password/hash.js', () => ({
  hashPassword: vi.fn().mockReturnValue(okAsync('hashed-password-123')),
}));

vi.mock('../../../core/verification/index.js', () => ({
  generateEmailVerificationToken: vi
    .fn()
    .mockReturnValue(okAsync('mock-verification-token')),
  buildEmailVerificationUrl: vi
    .fn()
    .mockReturnValue(
      ok('https://myapp.com/api/auth/verify-email?token=mock-token'),
    ),
}));

import { hashPassword } from '../../../core/password/hash.js';
import {
  generateEmailVerificationToken,
  buildEmailVerificationUrl,
} from '../../../core/verification/index.js';

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns redirect URL on successful sign up', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    const result = await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      email: 'test@example.com',
      redirectTo: '/auth/verify-email-sent',
    });
  });

  it('checks if user already exists', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(config.onSignUp.checkCredentialUserExists).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('returns error when user already exists', async () => {
    const config = createMockCredentialProviderConfig({
      onSignUp: {
        checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: true }),
        sendVerificationEmail: vi.fn(),
        createCredentialUser: vi.fn(),
        redirects: {
          signUpSuccess: '/auth/verify-email-sent',
          emailVerificationSuccess: '/auth/signin',
          emailVerificationError: '/auth/error',
        },
      },
    });
    const handleSignUp = signUp(config);

    const result = await handleSignUp(
      { email: 'existing@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(AccountAlreadyExistsError);
  });

  it('hashes the password', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(hashPassword).toHaveBeenCalledWith('password123');
  });

  it('generates email verification token with correct payload', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(generateEmailVerificationToken).toHaveBeenCalledWith({
      secret: TEST_SECRET,
      payload: {
        email: 'test@example.com',
        hashedPassword: 'hashed-password-123',
      },
    });
  });

  it('includes additional fields in token payload', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        age: 25,
      },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(generateEmailVerificationToken).toHaveBeenCalledWith({
      secret: TEST_SECRET,
      payload: {
        email: 'test@example.com',
        hashedPassword: 'hashed-password-123',
        name: 'Test User',
        age: 25,
      },
    });
  });

  it('builds email verification URL', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(buildEmailVerificationUrl).toHaveBeenCalledWith(
      TEST_BASE_URL,
      'mock-verification-token',
      '/api/auth/verify-email',
    );
  });

  it('sends verification email with correct parameters', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignUp = signUp(config);

    await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(config.onSignUp.sendVerificationEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      url: 'https://myapp.com/api/auth/verify-email?token=mock-token',
    });
  });

  it('returns CallbackError when checkCredentialUserExists fails', async () => {
    const config = createMockCredentialProviderConfig({
      onSignUp: {
        checkCredentialUserExists: vi
          .fn()
          .mockRejectedValue(new Error('Database error')),
        sendVerificationEmail: vi.fn(),
        createCredentialUser: vi.fn(),
        redirects: {
          signUpSuccess: '/auth/verify-email-sent',
          emailVerificationSuccess: '/auth/signin',
          emailVerificationError: '/auth/error',
        },
      },
    });
    const handleSignUp = signUp(config);

    const result = await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });

  it('returns CallbackError when sendVerificationEmail fails', async () => {
    const config = createMockCredentialProviderConfig({
      onSignUp: {
        checkCredentialUserExists: vi.fn().mockResolvedValue({ exists: false }),
        sendVerificationEmail: vi
          .fn()
          .mockRejectedValue(new Error('Email service error')),
        createCredentialUser: vi.fn(),
        redirects: {
          signUpSuccess: '/auth/verify-email-sent',
          emailVerificationSuccess: '/auth/signin',
          emailVerificationError: '/auth/error',
        },
      },
    });
    const handleSignUp = signUp(config);

    const result = await handleSignUp(
      { email: 'test@example.com', password: 'password123' },
      TEST_SECRET,
      TEST_BASE_URL,
    );

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });
});
