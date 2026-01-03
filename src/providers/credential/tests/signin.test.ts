import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync } from 'neverthrow';
import { signIn } from '../sign-in.js';
import { createMockCredentialProviderConfig, createMockUser } from './setup.js';
import { AccountNotFoundError, InvalidCredentialsError } from '../errors.js';
import { CallbackError } from '../../../core/errors.js';

// Mock dependencies
vi.mock('../../../core/password/verify.js', () => ({
  verifyPassword: vi.fn().mockReturnValue(okAsync(true)),
}));

import { verifyPassword } from '../../../core/password/verify.js';

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user with hashed password on successful sign in', async () => {
    const mockUser = {
      ...createMockUser(),
      hashedPassword: 'hashed-password-123',
    };
    const config = createMockCredentialProviderConfig({
      onSignIn: {
        getCredentialUser: vi.fn().mockResolvedValue(mockUser),
      },
    });
    const handleSignIn = signIn(config);

    const result = await handleSignIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockUser);
  });

  it('calls getCredentialUser with email', async () => {
    const config = createMockCredentialProviderConfig();
    const handleSignIn = signIn(config);

    await handleSignIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(config.onSignIn.getCredentialUser).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('returns AccountNotFoundError when user not found', async () => {
    const config = createMockCredentialProviderConfig({
      onSignIn: {
        getCredentialUser: vi.fn().mockResolvedValue(null),
      },
    });
    const handleSignIn = signIn(config);

    const result = await handleSignIn({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(AccountNotFoundError);
  });

  it('verifies password against hashed password', async () => {
    const config = createMockCredentialProviderConfig({
      onSignIn: {
        getCredentialUser: vi.fn().mockResolvedValue({
          ...createMockUser(),
          hashedPassword: 'stored-hashed-password',
        }),
      },
    });
    const handleSignIn = signIn(config);

    await handleSignIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(verifyPassword).toHaveBeenCalledWith(
      'password123',
      'stored-hashed-password',
    );
  });

  it('returns InvalidCredentialsError when password is invalid', async () => {
    vi.mocked(verifyPassword).mockReturnValue(okAsync(false));

    const config = createMockCredentialProviderConfig();
    const handleSignIn = signIn(config);

    const result = await handleSignIn({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidCredentialsError);
  });

  it('returns CallbackError when getCredentialUser fails', async () => {
    const config = createMockCredentialProviderConfig({
      onSignIn: {
        getCredentialUser: vi
          .fn()
          .mockRejectedValue(new Error('Database error')),
      },
    });
    const handleSignIn = signIn(config);

    const result = await handleSignIn({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(CallbackError);
  });
});
