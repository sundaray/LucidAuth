import { describe, it, expect, vi } from 'vitest';
import { getOAuthProvider } from '../get-oauth-provider.js';
import {
  OAuthProviderNotFoundError,
  InvalidOAuthProviderTypeError,
} from '../errors.js';
import type {
  AnyAuthProvider,
  CredentialProvider,
  OAuthProvider,
} from '../types.js';

function createMockOAuthProvider(): OAuthProvider {
  return {
    id: 'google',
    type: 'oauth',
    createAuthorizationUrl: vi.fn(),
    completeSignin: vi.fn(),
    onAuthentication: vi.fn(),
    getErrorRedirectPath: vi.fn(),
  } as unknown as OAuthProvider;
}

function createMockCredentialProvider(): CredentialProvider {
  return {
    id: 'credential',
    type: 'credential',
    config: {
      sendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      onSignUp: vi.fn(),
      onPasswordReset: vi.fn(),
    },
    signUp: vi.fn(),
    signIn: vi.fn(),
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    verifyPasswordResetToken: vi.fn(),
    resetPassword: vi.fn(),
  } as unknown as CredentialProvider;
}

describe('getOAuthProvider', () => {
  it('returns Ok with OAuth provider when found', () => {
    const oauthProvider = createMockOAuthProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['google', oauthProvider],
    ]);

    const result = getOAuthProvider(providers, 'google');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(oauthProvider);
  });

  it('returns Ok with correct OAuth provider when multiple providers exist', () => {
    const googleProvider = createMockOAuthProvider();
    const credentialProvider = createMockCredentialProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['google', googleProvider],
      ['credential', credentialProvider],
    ]);

    const result = getOAuthProvider(providers, 'google');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(googleProvider);
  });

  it('returns Err with OAuthProviderNotFoundError when provider does not exist', () => {
    const providers = new Map<string, AnyAuthProvider>();

    const result = getOAuthProvider(providers, 'google');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      OAuthProviderNotFoundError,
    );
  });

  it('returns Err with OAuthProviderNotFoundError when only credential provider exists', () => {
    const credentialProvider = createMockCredentialProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['credential', credentialProvider],
    ]);

    const result = getOAuthProvider(providers, 'google');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      OAuthProviderNotFoundError,
    );
  });

  it('returns Err with InvalidOAuthProviderTypeError when provider has wrong type', () => {
    const credentialProvider = createMockCredentialProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['google', credentialProvider],
    ]);

    const result = getOAuthProvider(providers, 'google');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      InvalidOAuthProviderTypeError,
    );
  });

  it('returns Err with OAuthProviderNotFoundError for non-existent provider id', () => {
    const googleProvider = createMockOAuthProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['google', googleProvider],
    ]);

    const result = getOAuthProvider(providers, 'github' as any);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      OAuthProviderNotFoundError,
    );
  });
});
