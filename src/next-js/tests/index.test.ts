import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { createAuthInstance } from '../index.js';
import { createMockConfig, createMockUserSession } from './setup.js';
import { LucidAuthError } from '../../core/errors.js';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock createAuthHelpers
vi.mock('../../core/auth.js', () => ({
  createAuthHelpers: vi.fn(),
}));

// Mock middleware
vi.mock('../middleware.js', () => ({
  createExtendUserSessionMiddleware: vi.fn(() => vi.fn()),
}));

// Mock cookies
vi.mock('../cookies.js', () => ({
  nextJsCookies: {},
}));

import { redirect } from 'next/navigation';
import { createAuthHelpers } from '../../core/auth.js';
import { createExtendUserSessionMiddleware } from '../middleware.js';

describe('createAuthInstance', () => {
  const mockAuthHelpers = {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUserSession: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    verifyPasswordResetToken: vi.fn(),
    handleOAuthCallback: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAuthHelpers).mockReturnValue(mockAuthHelpers);
  });

  describe('signIn', () => {
    it('redirects to authorization URL for Google sign-in', async () => {
      mockAuthHelpers.signIn.mockReturnValue(
        okAsync({ authorizationUrl: 'https://accounts.google.com/oauth' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.signIn('google', { redirectTo: '/dashboard' });

      expect(mockAuthHelpers.signIn).toHaveBeenCalledWith('google', {
        redirectTo: '/dashboard',
      });
      expect(redirect).toHaveBeenCalledWith(
        'https://accounts.google.com/oauth',
      );
    });

    it('redirects to dashboard for credential sign-in', async () => {
      mockAuthHelpers.signIn.mockReturnValue(
        okAsync({ redirectTo: '/dashboard' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.signIn('credential', {
        email: 'test@example.com',
        password: 'password123',
        redirectTo: '/dashboard',
      });

      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('throws error when sign-in fails', async () => {
      class SignInError extends LucidAuthError {
        constructor() {
          super({ message: 'Sign-in failed' });
          this.name = 'SignInError';
        }
      }

      mockAuthHelpers.signIn.mockReturnValue(errAsync(new SignInError()));

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await expect(
        auth.signIn('google', { redirectTo: '/dashboard' }),
      ).rejects.toBeInstanceOf(SignInError);
    });
  });

  describe('signUp', () => {
    it('redirects after successful sign-up', async () => {
      mockAuthHelpers.signUp.mockReturnValue(
        okAsync({ email: 'test@example.com', redirectTo: '/verify-email' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuthHelpers.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(redirect).toHaveBeenCalledWith('/verify-email');
    });

    it('throws error when sign-up fails', async () => {
      class SignUpError extends LucidAuthError {
        constructor() {
          super({ message: 'Sign-up failed' });
          this.name = 'SignUpError';
        }
      }

      mockAuthHelpers.signUp.mockReturnValue(errAsync(new SignUpError()));

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await expect(
        auth.signUp({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(SignUpError);
    });
  });

  describe('signOut', () => {
    it('redirects after successful sign-out', async () => {
      mockAuthHelpers.signOut.mockReturnValue(okAsync({ redirectTo: '/' }));

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.signOut({ redirectTo: '/' });

      expect(mockAuthHelpers.signOut).toHaveBeenCalledWith({ redirectTo: '/' });
      expect(redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('getUserSession', () => {
    it('returns user session when authenticated', async () => {
      const mockSession = createMockUserSession();
      mockAuthHelpers.getUserSession.mockReturnValue(okAsync(mockSession));

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      const session = await auth.getUserSession();

      expect(session).toEqual(mockSession);
    });

    it('returns null when not authenticated', async () => {
      mockAuthHelpers.getUserSession.mockReturnValue(okAsync(null));

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      const session = await auth.getUserSession();

      expect(session).toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('redirects after successful forgot password request', async () => {
      mockAuthHelpers.forgotPassword.mockReturnValue(
        okAsync({ redirectTo: '/check-email' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.forgotPassword('test@example.com');

      expect(mockAuthHelpers.forgotPassword).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(redirect).toHaveBeenCalledWith('/check-email');
    });
  });

  describe('resetPassword', () => {
    it('redirects after successful password reset', async () => {
      mockAuthHelpers.resetPassword.mockReturnValue(
        okAsync({ redirectTo: '/sign-in' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      await auth.resetPassword('reset-token', 'newPassword123');

      expect(mockAuthHelpers.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'newPassword123',
      );
      expect(redirect).toHaveBeenCalledWith('/sign-in');
    });
  });

  describe('handler', () => {
    it('handles verify-email route', async () => {
      mockAuthHelpers.verifyEmail.mockReturnValue(
        okAsync({ redirectTo: '/sign-in' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      const request = new Request(
        'https://myapp.com/api/auth/verify-email?token=abc123',
      );

      await auth.handler(request);

      expect(mockAuthHelpers.verifyEmail).toHaveBeenCalledWith(request);
      expect(redirect).toHaveBeenCalledWith('/sign-in');
    });

    it('handles verify-password-reset-token route', async () => {
      mockAuthHelpers.verifyPasswordResetToken.mockReturnValue(
        okAsync({ email: 'test@example.com', redirectTo: '/reset-password' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      const request = new Request(
        'https://myapp.com/api/auth/verify-password-reset-token?token=abc123',
      );

      await auth.handler(request);

      expect(mockAuthHelpers.verifyPasswordResetToken).toHaveBeenCalledWith(
        request,
      );
      expect(redirect).toHaveBeenCalledWith('/reset-password');
    });

    it('handles OAuth callback route', async () => {
      mockAuthHelpers.handleOAuthCallback.mockReturnValue(
        okAsync({ redirectTo: '/dashboard' }),
      );

      const config = createMockConfig();
      const auth = createAuthInstance(config);

      const request = new Request(
        'https://myapp.com/api/auth/callback/google?code=auth-code&state=state',
      );

      await auth.handler(request);

      expect(mockAuthHelpers.handleOAuthCallback).toHaveBeenCalledWith(
        request,
        'google',
      );
      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('extendUserSessionMiddleware', () => {
    it('creates middleware from config', () => {
      const config = createMockConfig();
      const auth = createAuthInstance(config);

      expect(createExtendUserSessionMiddleware).toHaveBeenCalledWith(config);
      expect(auth.extendUserSessionMiddleware).toBeDefined();
    });
  });
});
