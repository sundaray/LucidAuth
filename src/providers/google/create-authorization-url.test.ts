import { describe, test, expect } from 'vitest';
import {
  createAuthorizationUrl,
  type AuthorizationUrlParams,
} from './create-authorization-url';

describe('createAuthorizationUrl', () => {
  const validParams: AuthorizationUrlParams = {
    clientId: 'test-client-id',
    redirectUri: 'https://myapp.com/api/auth/callback',
    state: 'random-state-string',
    codeChallenge: 'code-challenge-value',
    prompt: 'select_account',
  };

  test('should return an authorization URL string', () => {
    const result = createAuthorizationUrl(validParams);

    expect(result.isOk()).toBe(true);

    const urlString = result._unsafeUnwrap();
    const url = new URL(urlString);

    expect(url.origin).toBe('https://accounts.google.com');
    expect(url.pathname).toBe('/o/oauth2/v2/auth');
  });
});
