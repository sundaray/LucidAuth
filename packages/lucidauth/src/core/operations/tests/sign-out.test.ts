import { describe, it, expect, vi, beforeEach } from 'vitest';
import { okAsync, errAsync } from 'neverthrow';
import { signOut } from '../sign-out.js';
import { createMockAuthContext } from './setup.js';
import { LucidAuthError } from '../../errors.js';

class MockDeleteSessionError extends LucidAuthError {
  constructor() {
    super({ message: 'Failed to delete session' });
    this.name = 'MockDeleteSessionError';
  }
}

describe('signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes user session', async () => {
    const ctx = createMockAuthContext();

    const handleSignOut = signOut(ctx);
    await handleSignOut({ redirectTo: '/auth/signin' });

    expect(ctx.session.deleteUserSession).toHaveBeenCalled();
  });

  it('returns redirect URL on success', async () => {
    const ctx = createMockAuthContext();

    const handleSignOut = signOut(ctx);
    const result = await handleSignOut({ redirectTo: '/auth/signin' });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/auth/signin',
    });
  });

  it('returns custom redirect URL', async () => {
    const ctx = createMockAuthContext();

    const handleSignOut = signOut(ctx);
    const result = await handleSignOut({ redirectTo: '/goodbye' });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      redirectTo: '/goodbye',
    });
  });

  it('returns error when session deletion fails', async () => {
    const ctx = createMockAuthContext({
      session: {
        deleteUserSession: vi
          .fn()
          .mockReturnValue(errAsync(new MockDeleteSessionError())),
      },
    });

    const handleSignOut = signOut(ctx);
    const result = await handleSignOut({ redirectTo: '/auth/signin' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(MockDeleteSessionError);
  });
});
