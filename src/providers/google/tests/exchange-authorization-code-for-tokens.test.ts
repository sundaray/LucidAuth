import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import {
  MockAgent,
  setGlobalDispatcher,
  getGlobalDispatcher,
  type Dispatcher,
} from 'undici';
import { createMockTokenResponse } from './setup';
import { exchangeAuthorizationCodeForTokens } from '../exchange-authorization-code-for-tokens';
import type { ExchangeAuthorizationCodeForTokensParams } from '../exchange-authorization-code-for-tokens';

// ============================================
// MOCK FACTORIES
// ============================================

function createMockParams(
  overrides: Partial<ExchangeAuthorizationCodeForTokensParams> = {},
): ExchangeAuthorizationCodeForTokensParams {
  return {
    code: 'test-auth-code',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'https://myapp.com/api/auth/callback/google',
    codeVerifier: 'test-code-verifier',
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('exchangeAuthorizationCodeForTokens', () => {
  let mockAgent: MockAgent;

  const originalDispatcher: Dispatcher = getGlobalDispatcher();

  beforeEach(() => {
    mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    setGlobalDispatcher(originalDispatcher);
  });

  // ============ Success Cases ============
  describe('success cases', async () => {
    it('returns token response on successful exchange of authorization code', async () => {
      const expectedTokenResponse = createMockTokenResponse();

      mockAgent
        .get('https://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
        })
        .reply(200, expectedTokenResponse, {
          headers: { 'content-type': 'application/json' },
        });

      const result =
        await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(expectedTokenResponse);
    });

    it('sends POST request to Google token endpoint with correct headers', async () => {
      mockAgent
        .get('https://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
        .reply(200, createMockTokenResponse(), {
          headers: { 'content-type': 'application/json' },
        });

      const result =
        await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(result.isOk()).toBe(true);
    });

    it('includes all required parameters in the request body', async () => {
      let capturedBody: string | undefined;

      mockAgent
        .get('https://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
          body: (body) => {
            capturedBody = body;
            return true;
          },
        })
        .reply(200, createMockTokenResponse(), {
          headers: { 'content-type': 'application/json' },
        });

      await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(capturedBody).toContain('code=test-auth-code');
      expect(capturedBody).toContain('client_id=test-client-id');
      expect(capturedBody).toContain('code_verifier=test-code-verifier');
      expect(capturedBody).toContain('grant_type=authorization_code');
      expect(capturedBody).toContain(
        'redirect_uri=https%3A%2F%2Fmyapp.com%2Fapi%2Fauth%2Fcallback%2Fgoogle',
      );
    });
  });

  // ============ Error Cases ============
  /**
   * TokenFetch Error
   * Occurs when the network request itself fails
   */
  describe('error cases', () => {
    it('returns TokenFetchError when network request fails', async () => {
      mockAgent
        .get('https://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
        })
        .replyWithError(new Error('Network Error'));

      const result =
        await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('TokenFetchError');
    });

    /**
     * Error 2: TokenResponseError
     * Occurs when Google returns a non-2xx status code
     */
    it('returns ResponseTokenError when response status is 401', async () => {
      mockAgent
        .get('htpps://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
        })
        .reply(
          401,
          { error: 'invalid_client' },
          {
            headers: { 'content-type': 'application/json' },
          },
        );
      const result =
        await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('TokenResponseError');
    });

    /**
     * Error 3: TokenParseError
     * Occurs when the response body is not valid JSON.
     */
    it('returns TokenParseError when response is not valid JSON', async () => {
      mockAgent
        .get('https://oauth2.googleapis.com')
        .intercept({
          path: '/token',
          method: 'POST',
        })
        .reply(200, 'not valid json', {
          headers: { 'content-type': 'text/plain' },
        });

      const result =
        await exchangeAuthorizationCodeForTokens(createMockParams());

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().name).toBe('TokenParseError');
    });
  });
});
