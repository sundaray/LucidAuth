import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextJsCookies } from '../cookies.js';
import {
  NextJsGetCookieError,
  NextJsSetCookieError,
  NextJsDeleteCookieError,
} from '../errors.js';
import { createMockCookieStore } from './setup.js';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock isNextJsDynamicError
vi.mock('../../core/utils/index.js', () => ({
  isNextJsDynamicError: vi.fn(),
}));

import { cookies } from 'next/headers';
import { isNextJsDynamicError } from '../../core/utils/index.js';

describe('nextJsCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNextJsDynamicError).mockReturnValue(false);
  });

  // ============================================
  // GET TESTS
  // ============================================
  describe('get', () => {
    it('returns cookie value when cookie exists', async () => {
      const mockCookieStore = createMockCookieStore({
        'test-cookie': 'test-value',
      });
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await nextJsCookies.get('test-cookie');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('test-value');
      expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie');
    });

    it('returns null when cookie does not exist', async () => {
      const mockCookieStore = createMockCookieStore({});
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await nextJsCookies.get('nonexistent-cookie');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('returns null when DYNAMIC_SERVER_USAGE error occurs', async () => {
      const dynamicError = new Error('Dynamic server usage');
      (dynamicError as any).digest = 'DYNAMIC_SERVER_USAGE';

      vi.mocked(cookies).mockRejectedValue(dynamicError);
      vi.mocked(isNextJsDynamicError).mockReturnValue(true);

      const result = await nextJsCookies.get('test-cookie');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    it('returns NextJsGetCookieError when non-dynamic error occurs', async () => {
      const genericError = new Error('Database connection failed');

      vi.mocked(cookies).mockRejectedValue(genericError);
      vi.mocked(isNextJsDynamicError).mockReturnValue(false);

      const result = await nextJsCookies.get('test-cookie');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NextJsGetCookieError);
    });
  });

  // ============================================
  // SET TESTS
  // ============================================
  describe('set', () => {
    it('sets cookie with correct options', async () => {
      const mockCookieStore = createMockCookieStore();
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await nextJsCookies.set('test-cookie', 'test-value', 3600);

      expect(result.isOk()).toBe(true);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'test-cookie',
        'test-value',
        {
          httpOnly: true,
          secure: false, // NODE_ENV is not 'production' in tests
          sameSite: 'lax',
          path: '/',
          maxAge: 3600,
        },
      );
    });

    it('returns NextJsSetCookieError when error occurs', async () => {
      vi.mocked(cookies).mockRejectedValue(new Error('Failed to set cookie'));

      const result = await nextJsCookies.set('test-cookie', 'test-value', 3600);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NextJsSetCookieError);
    });
  });

  // ============================================
  // DELETE TESTS
  // ============================================
  describe('delete', () => {
    it('deletes cookie with correct options', async () => {
      const mockCookieStore = createMockCookieStore();
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await nextJsCookies.delete('test-cookie');

      expect(result.isOk()).toBe(true);
      expect(mockCookieStore.delete).toHaveBeenCalledWith({
        name: 'test-cookie',
        path: '/',
        secure: false, // NODE_ENV is not 'production' in tests
        sameSite: 'lax',
      });
    });

    it('returns NextJsDeleteCookieError when error occurs', async () => {
      vi.mocked(cookies).mockRejectedValue(
        new Error('Failed to delete cookie'),
      );

      const result = await nextJsCookies.delete('test-cookie');

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(NextJsDeleteCookieError);
    });
  });
});
