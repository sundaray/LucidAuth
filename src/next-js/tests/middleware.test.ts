import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { createExtendUserSessionMiddleware } from '../middleware.js';
import {
  createMockConfig,
  createMockUserSession,
  createMockNextRequest,
} from './setup.js';
import { COOKIE_NAMES } from '../../core/constants.js';
import type { UserSessionJWE } from '../../core/session/types.js';

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({
      cookies: {
        set: vi.fn(),
      },
    })),
  },
}));

// Mock session functions
vi.mock('../../core/session', () => ({
  decryptUserSessionJWE: vi.fn(),
  encryptUserSessionPayload: vi.fn(),
}));

import { NextResponse } from 'next/server';
import {
  decryptUserSessionJWE,
  encryptUserSessionPayload,
} from '../../core/session';

describe('createExtendUserSessionMiddleware', () => {
  const mockResponseCookiesSet = vi.fn();

  const FIXED_TIMESTAMP = new Date('2025-01-15T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();

    vi.useFakeTimers();
    vi.setSystemTime(FIXED_TIMESTAMP);

    vi.mocked(NextResponse.next).mockReturnValue({
      cookies: {
        set: mockResponseCookiesSet,
      },
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('passes through non-GET requests unchanged', async () => {
    const config = createMockConfig();
    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/api/data', {
      method: 'POST',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(decryptUserSessionJWE).not.toHaveBeenCalled();
  });

  it('passes through when no session cookie exists', async () => {
    const config = createMockConfig();
    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: {},
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(decryptUserSessionJWE).not.toHaveBeenCalled();
  });

  it('passes through when session decryption fails', async () => {
    vi.mocked(decryptUserSessionJWE).mockReturnValue(
      errAsync(new Error('Decryption failed')),
    );

    const config = createMockConfig();
    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'invalid-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(mockResponseCookiesSet).not.toHaveBeenCalled();
  });

  it('passes through when session is not near expiration', async () => {
    const config = createMockConfig({
      session: {
        secret: 'test-secret',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    });

    const nowInSeconds = Math.floor(FIXED_TIMESTAMP.getTime() / 1000);
    const exp = nowInSeconds + 60 * 60 * 24 * 6; // 6 days from fixed time

    const mockSession = {
      ...createMockUserSession(),
      exp,
    };

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));

    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'valid-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(encryptUserSessionPayload).not.toHaveBeenCalled();
    expect(mockResponseCookiesSet).not.toHaveBeenCalled();
  });

  it('refreshes session when past halfway point', async () => {
    const config = createMockConfig({
      session: {
        secret: 'test-secret',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    });

    const nowInSeconds = Math.floor(FIXED_TIMESTAMP.getTime() / 1000);
    const exp = nowInSeconds + 60 * 60 * 24 * 2; // 2 days from fixed time

    const mockSession = {
      ...createMockUserSession(),
      exp,
    };

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));
    vi.mocked(encryptUserSessionPayload).mockReturnValue(
      okAsync('new-session-jwe' as UserSessionJWE),
    );

    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'old-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(encryptUserSessionPayload).toHaveBeenCalledWith({
      payload: {
        user: mockSession.user,
        provider: mockSession.provider,
      },
      secret: config.session.secret,
      maxAge: config.session.maxAge,
    });
    expect(mockResponseCookiesSet).toHaveBeenCalledWith(
      COOKIE_NAMES.USER_SESSION,
      'new-session-jwe',
      {
        maxAge: config.session.maxAge,
        httpOnly: true,
        secure: false, // NODE_ENV is not 'production' in tests
        sameSite: 'lax',
        path: '/',
      },
    );
  });

  it('does not refresh session when exactly at halfway point', async () => {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const config = createMockConfig({
      session: {
        secret: 'test-secret',
        maxAge,
      },
    });

    const nowInSeconds = Math.floor(FIXED_TIMESTAMP.getTime() / 1000);
    const refreshThreshold = maxAge / 2;
    const exp = nowInSeconds + refreshThreshold + 1; // Just above threshold

    const mockSession = {
      ...createMockUserSession(),
      exp,
    };

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));

    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'valid-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(encryptUserSessionPayload).not.toHaveBeenCalled();
    expect(mockResponseCookiesSet).not.toHaveBeenCalled();
  });

  it('handles encryption failure gracefully', async () => {
    const config = createMockConfig({
      session: {
        secret: 'test-secret',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    });

    const nowInSeconds = Math.floor(FIXED_TIMESTAMP.getTime() / 1000);
    const exp = nowInSeconds + 60 * 60 * 24 * 1; // 1 day from fixed time

    const mockSession = {
      ...createMockUserSession(),
      exp,
    };

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));
    vi.mocked(encryptUserSessionPayload).mockReturnValue(
      errAsync(new Error('Encryption failed')),
    );

    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'old-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(mockResponseCookiesSet).not.toHaveBeenCalled();
  });

  it('does not refresh session when exp is not present', async () => {
    const config = createMockConfig();

    const mockSession = createMockUserSession();

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));

    const middleware = createExtendUserSessionMiddleware(config);

    const request = createMockNextRequest('https://myapp.com/dashboard', {
      method: 'GET',
      cookies: { [COOKIE_NAMES.USER_SESSION]: 'valid-session-jwe' },
    });

    const response = await middleware(request as any);

    expect(response).toBeDefined();
    expect(encryptUserSessionPayload).not.toHaveBeenCalled();
  });
});
