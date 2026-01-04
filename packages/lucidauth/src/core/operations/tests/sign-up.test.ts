import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errAsync } from 'neverthrow';
import { signUp } from '../sign-up.js';
import {
  createMockAuthContext,
  createMockCredentialProvider,
} from './setup.js';
import { CredentialProviderNotFoundError } from '../../../providers/errors.js';

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls provider signUp with correct parameters', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleSignUp = signUp(ctx);
    await handleSignUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(mockCredentialProvider.signUp).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      ctx.config.session.secret,
      ctx.config.baseUrl,
    );
  });

  it('returns redirect URL on success', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleSignUp = signUp(ctx);
    const result = await handleSignUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/verify-email',
    });
  });

  it('passes additional fields to provider', async () => {
    const mockCredentialProvider = createMockCredentialProvider();
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleSignUp = signUp(ctx);
    await handleSignUp({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      age: 25,
    });

    expect(mockCredentialProvider.signUp).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        age: 25,
      },
      ctx.config.session.secret,
      ctx.config.baseUrl,
    );
  });

  it('returns error when credential provider not found', async () => {
    const ctx = createMockAuthContext({
      providers: [],
    });

    const handleSignUp = signUp(ctx);
    const result = await handleSignUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('propagates provider errors', async () => {
    const providerError = new Error('Sign up failed');
    const mockCredentialProvider = createMockCredentialProvider({
      signUp: vi.fn().mockReturnValue(errAsync(providerError)),
    });
    const ctx = createMockAuthContext({
      providers: [mockCredentialProvider],
    });

    const handleSignUp = signUp(ctx);
    const result = await handleSignUp({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.isErr()).toBe(true);
  });
});
