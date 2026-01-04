import { describe, it, expect, vi } from 'vitest';
import { getCredentialProvider } from '../get-credential-provider.js';
import {
  CredentialProviderNotFoundError,
  InvalidCredentialProviderTypeError,
} from '../errors.js';
import type {
  AnyAuthProvider,
  CredentialProvider,
  OAuthProvider,
} from '../types.js';

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

describe('getCredentialProvider', () => {
  it('returns Ok with credential provider when found', () => {
    const credentialProvider = createMockCredentialProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['credential', credentialProvider],
    ]);

    const result = getCredentialProvider(providers);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(credentialProvider);
  });

  it('returns Ok with credential provider when multiple providers exist', () => {
    const credentialProvider = createMockCredentialProvider();
    const oauthProvider = createMockOAuthProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['credential', credentialProvider],
      ['google', oauthProvider],
    ]);

    const result = getCredentialProvider(providers);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(credentialProvider);
  });

  it('returns Err with CredentialProviderNotFoundError when provider does not exist', () => {
    const providers = new Map<string, AnyAuthProvider>();

    const result = getCredentialProvider(providers);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('returns Err with CredentialProviderNotFoundError when only OAuth providers exist', () => {
    const oauthProvider = createMockOAuthProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['google', oauthProvider],
    ]);

    const result = getCredentialProvider(providers);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      CredentialProviderNotFoundError,
    );
  });

  it('returns Err with InvalidCredentialProviderTypeError when provider has wrong type', () => {
    const oauthProvider = createMockOAuthProvider();
    const providers = new Map<string, AnyAuthProvider>([
      ['credential', oauthProvider],
    ]);

    const result = getCredentialProvider(providers);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      InvalidCredentialProviderTypeError,
    );
  });
});
