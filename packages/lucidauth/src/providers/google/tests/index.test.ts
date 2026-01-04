import { Google } from '../index.js';
import { describe, it, expect, vi } from 'vitest';
import { createMockConfig } from './setup.js';

describe('Google provider', () => {
  it('returns provider with correct id and type', () => {
    const provider = Google(createMockConfig());

    expect(provider.id).toBe('google');
    expect(provider.type).toBe('oauth');
  });

  it('exposes all required interface methods', () => {
    const provider = Google(createMockConfig());

    expect(typeof provider.createAuthorizationUrl).toBe('function');
    expect(typeof provider.completeSignin).toBe('function');
    expect(typeof provider.onAuthentication).toBe('function');
    expect(typeof provider.getErrorRedirectPath).toBe('function');
  });
});
