import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { createSessionOperations } from '../create-session-operations.js';
import type { CookieOperations } from '../../types.js';
import { COOKIE_NAMES, OAUTH_STATE_MAX_AGE } from '../../constants.js';

function createMockCookies(): CookieOperations {
  return {
    get: vi.fn().mockReturnValue(okAsync(null)),
    set: vi.fn().mockReturnValue(okAsync(undefined)),
    delete: vi.fn().mockReturnValue(okAsync(undefined)),
  };
}

describe('createSessionOperations', () => {
  const userSessionMaxAge = 60 * 60 * 24 * 7; // 7 days

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setUserSession', () => {
    it('calls cookies.set with correct parameters', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.setUserSession('user-session-jwe');

      expect(mockCookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.USER_SESSION,
        'user-session-jwe',
        userSessionMaxAge,
      );
    });

    it('returns success on successful set', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.setUserSession('user-session-jwe');

      expect(result.isOk()).toBe(true);
    });

    it('returns error when cookie set fails', async () => {
      const mockCookies = createMockCookies();
      mockCookies.set = vi
        .fn()
        .mockReturnValue(errAsync(new Error('Set failed')));
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.setUserSession('user-session-jwe');

      expect(result.isErr()).toBe(true);
    });
  });

  describe('getUserSession', () => {
    it('calls cookies.get with correct cookie name', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.getUserSession();

      expect(mockCookies.get).toHaveBeenCalledWith(COOKIE_NAMES.USER_SESSION);
    });

    it('returns session JWE when exists', async () => {
      const mockCookies = createMockCookies();
      mockCookies.get = vi
        .fn()
        .mockReturnValue(okAsync('existing-session-jwe'));
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.getUserSession();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('existing-session-jwe');
    });

    it('returns null when no session exists', async () => {
      const mockCookies = createMockCookies();
      mockCookies.get = vi.fn().mockReturnValue(okAsync(null));
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.getUserSession();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });
  });

  describe('deleteUserSession', () => {
    it('calls cookies.delete with correct cookie name', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.deleteUserSession();

      expect(mockCookies.delete).toHaveBeenCalledWith(
        COOKIE_NAMES.USER_SESSION,
      );
    });

    it('returns success on successful delete', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.deleteUserSession();

      expect(result.isOk()).toBe(true);
    });
  });

  describe('setOAuthState', () => {
    it('calls cookies.set with OAuth state cookie name and max age', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.setOAuthState('oauth-state-jwe');

      expect(mockCookies.set).toHaveBeenCalledWith(
        COOKIE_NAMES.OAUTH_STATE,
        'oauth-state-jwe',
        OAUTH_STATE_MAX_AGE,
      );
    });
  });

  describe('getOAuthState', () => {
    it('calls cookies.get with OAuth state cookie name', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.getOAuthState();

      expect(mockCookies.get).toHaveBeenCalledWith(COOKIE_NAMES.OAUTH_STATE);
    });

    it('returns OAuth state JWE when exists', async () => {
      const mockCookies = createMockCookies();
      mockCookies.get = vi.fn().mockReturnValue(okAsync('oauth-state-jwe'));
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      const result = await sessionOps.getOAuthState();

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('oauth-state-jwe');
    });
  });

  describe('deleteOAuthState', () => {
    it('calls cookies.delete with OAuth state cookie name', async () => {
      const mockCookies = createMockCookies();
      const sessionOps = createSessionOperations(
        mockCookies,
        userSessionMaxAge,
      );

      await sessionOps.deleteOAuthState();

      expect(mockCookies.delete).toHaveBeenCalledWith(COOKIE_NAMES.OAUTH_STATE);
    });
  });
});
