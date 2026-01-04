import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { getUserSession } from '../get-user-session.js';
import { createMockAuthContext, createMockUser } from './setup.js';

vi.mock('../../session/index.js', () => ({
  decryptUserSessionJWE: vi.fn(),
}));

import { decryptUserSessionJWE } from '../../session/index.js';

describe('getUserSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no session exists', async () => {
    const ctx = createMockAuthContext({
      session: {
        getUserSession: vi.fn().mockReturnValue(okAsync(null)),
      },
    });

    const handleGetUserSession = getUserSession(ctx);
    const result = await handleGetUserSession();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeNull();
  });

  it('decrypts and returns user session when JWE exists', async () => {
    const mockSession = {
      user: createMockUser(),
      provider: 'google',
      expiresAt: Date.now() + 1000000,
    };

    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync(mockSession));

    const ctx = createMockAuthContext({
      session: {
        getUserSession: vi.fn().mockReturnValue(okAsync('mock-session-jwe')),
      },
    });

    const handleGetUserSession = getUserSession(ctx);
    const result = await handleGetUserSession();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(mockSession);
  });

  it('calls decryptUserSessionJWE with correct parameters', async () => {
    vi.mocked(decryptUserSessionJWE).mockReturnValue(okAsync({} as any));

    const ctx = createMockAuthContext({
      session: {
        getUserSession: vi.fn().mockReturnValue(okAsync('mock-session-jwe')),
      },
    });

    const handleGetUserSession = getUserSession(ctx);
    await handleGetUserSession();

    expect(decryptUserSessionJWE).toHaveBeenCalledWith({
      JWE: 'mock-session-jwe',
      secret: ctx.config.session.secret,
    });
  });

  it('returns error when session retrieval fails', async () => {
    const ctx = createMockAuthContext({
      session: {
        getUserSession: vi
          .fn()
          .mockReturnValue(errAsync(new Error('Cookie read failed'))),
      },
    });

    const handleGetUserSession = getUserSession(ctx);
    const result = await handleGetUserSession();

    expect(result.isErr()).toBe(true);
  });

  it('returns error when decryption fails', async () => {
    vi.mocked(decryptUserSessionJWE).mockReturnValue(
      errAsync(new Error('Decryption failed')),
    );

    const ctx = createMockAuthContext({
      session: {
        getUserSession: vi.fn().mockReturnValue(okAsync('invalid-jwe')),
      },
    });

    const handleGetUserSession = getUserSession(ctx);
    const result = await handleGetUserSession();

    expect(result.isErr()).toBe(true);
  });
});
