import { describe, it, expect, vi } from 'vitest';
import { onAuthentication } from '../on-authentication.js';
import { createMockConfig, createMockUserClaims } from './setup.js';

describe('onAuthentication', () => {
  it('calls user callback with claims and returns user', async () => {
    const mockCreateGoogleUser = vi.fn().mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    const config = createMockConfig();
    config.onAuthentication.createGoogleUser = mockCreateGoogleUser;

    const handleOnAuthentication = onAuthentication(config);
    const claims = createMockUserClaims();

    const result = await handleOnAuthentication(claims);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: 'user-123',
      email: 'test@example.com',
    });
    expect(mockCreateGoogleUser).toHaveBeenCalledWith(claims);
    expect(mockCreateGoogleUser).toHaveBeenCalledTimes(1);
  });

  it('wraps onAuthentication callback error in CallbackError', async () => {
    const mockCreateGoogleUser = vi
      .fn()
      .mockRejectedValue(new Error('Database connection failed.'));

    const config = createMockConfig();
    config.onAuthentication.createGoogleUser = mockCreateGoogleUser;

    const handleOnAuthentication = onAuthentication(config);
    const claims = createMockUserClaims();

    const result = await handleOnAuthentication(claims);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe(
      'OnAuthenticationCallbackError',
    );
  });
});
