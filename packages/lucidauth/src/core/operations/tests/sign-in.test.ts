import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, okAsync } from 'neverthrow';
import { signIn } from '../sign-in.js';
import {
  createMockAuthContext,
  createMockOAuthProvider,
  createMockCredentialProvider,
} from './setup.js';
import { ProviderNotFoundError } from '../../oauth/errors.js';

// Mock dependencies
vi.mock('../../pkce/index.js', () => ({
  generateState: vi.fn().mockReturnValue(ok('mock-state')),
  generateCodeVerifier: vi.fn().mockReturnValue(ok('mock-code-verifier')),
  generateCodeChallenge: vi.fn().mockReturnValue(ok('mock-code-challenge')),
}));

vi.mock('../../oauth/index.js', () => ({
  encryptOAuthStatePayload: vi
    .fn()
    .mockReturnValue(okAsync('mock-oauth-state-jwe')),
}));

vi.mock('../../session/index.js', () => ({
  createUserSessionPayload: vi
    .fn()
    .mockReturnValue(ok({ user: {}, provider: 'credential' })),
  encryptUserSessionPayload: vi
    .fn()
    .mockReturnValue(okAsync('mock-session-jwe')),
}));

import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
} from '../../pkce/index.js';
import { encryptOAuthStatePayload } from '../../oauth/index.js';
import {
  createUserSessionPayload,
  encryptUserSessionPayload,
} from '../../session/index.js';

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OAuth sign in', () => {
    it('returns authorization URL for valid OAuth provider', async () => {
      const mockOAuthProvider = createMockOAuthProvider();
      const ctx = createMockAuthContext({
        providers: [mockOAuthProvider],
      });

      const handleSignIn = signIn(ctx);
      const result = await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        authorizationUrl:
          'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      });
    });

    it('generates PKCE parameters', async () => {
      const mockOAuthProvider = createMockOAuthProvider();
      const ctx = createMockAuthContext({
        providers: [mockOAuthProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(generateState).toHaveBeenCalled();
      expect(generateCodeVerifier).toHaveBeenCalled();
      expect(generateCodeChallenge).toHaveBeenCalledWith('mock-code-verifier');
    });

    it('encrypts OAuth state payload', async () => {
      const mockOAuthProvider = createMockOAuthProvider();
      const ctx = createMockAuthContext({
        providers: [mockOAuthProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(encryptOAuthStatePayload).toHaveBeenCalledWith({
        oauthState: {
          state: 'mock-state',
          codeVerifier: 'mock-code-verifier',
          redirectTo: '/dashboard',
          provider: 'google',
        },
        secret: ctx.config.session.secret,
        maxAge: expect.any(Number),
      });
    });

    it('stores OAuth state in session', async () => {
      const mockOAuthProvider = createMockOAuthProvider();
      const ctx = createMockAuthContext({
        providers: [mockOAuthProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(ctx.session.setOAuthState).toHaveBeenCalledWith(
        'mock-oauth-state-jwe',
      );
    });

    it('calls provider createAuthorizationUrl with correct parameters', async () => {
      const mockOAuthProvider = createMockOAuthProvider();
      const ctx = createMockAuthContext({
        providers: [mockOAuthProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(mockOAuthProvider.createAuthorizationUrl).toHaveBeenCalledWith({
        state: 'mock-state',
        codeChallenge: 'mock-code-challenge',
        baseUrl: 'https://myapp.com',
      });
    });
  });

  describe('Credential sign in', () => {
    it('returns redirect URL for valid credentials', async () => {
      const mockCredentialProvider = createMockCredentialProvider();
      const ctx = createMockAuthContext({
        providers: [mockCredentialProvider],
      });

      const handleSignIn = signIn(ctx);
      const result = await handleSignIn('credential', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/dashboard',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        redirectTo: '/dashboard',
      });
    });

    it('calls provider signIn with email and password', async () => {
      const mockCredentialProvider = createMockCredentialProvider();
      const ctx = createMockAuthContext({
        providers: [mockCredentialProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('credential', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/dashboard',
      });

      expect(mockCredentialProvider.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('creates and stores user session', async () => {
      const mockCredentialProvider = createMockCredentialProvider();
      const ctx = createMockAuthContext({
        providers: [mockCredentialProvider],
      });

      const handleSignIn = signIn(ctx);
      await handleSignIn('credential', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/dashboard',
      });

      expect(createUserSessionPayload).toHaveBeenCalled();
      expect(encryptUserSessionPayload).toHaveBeenCalled();
      expect(ctx.session.setUserSession).toHaveBeenCalledWith(
        'mock-session-jwe',
      );
    });
  });

  describe('Error cases', () => {
    it('returns error when provider not found', async () => {
      const ctx = createMockAuthContext({
        providers: [],
      });

      const handleSignIn = signIn(ctx);
      const result = await handleSignIn('google', { redirectTo: '/dashboard' });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ProviderNotFoundError);
    });

    it('returns error for unknown provider type', async () => {
      const unknownProvider = {
        id: 'unknown',
        type: 'unknown' as any,
      };
      const ctx = createMockAuthContext({
        providers: [unknownProvider as any],
      });

      const handleSignIn = signIn(ctx);
      const result = await handleSignIn('unknown' as any, {
        redirectTo: '/dashboard',
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ProviderNotFoundError);
    });
  });
});
