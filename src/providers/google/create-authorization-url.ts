import { Result } from 'neverthrow';
import { LucidAuthError } from '../../core/errors.js';
import { AUTH_ROUTES } from '../../core/constants.js';
import { CreateAuthorizationUrlError } from '../../core/oauth/errors.js';

import type { GoogleProviderConfig } from './types.js';

const GOOGLE_AUTHORIZATION_ENDPOINT =
  'https://accounts.google.com/o/oauth2/v2/auth';

const REDIRECT_PATH = '/api/auth/callback/google';

function createAuthorizationUrl(config: GoogleProviderConfig) {
  return function (params: {
    state: string;
    codeChallenge: string;
    baseUrl: string;
  }): Result<string, LucidAuthError> {
    const { state, codeChallenge, baseUrl } = params;
    const prompt = config.prompt || 'select_account';

    return Result.fromThrowable(
      () => {
        const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);

        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', config.clientId);
        url.searchParams.set('redirect_uri', `${baseUrl}${REDIRECT_PATH}`);
        url.searchParams.set('state', state);
        url.searchParams.set('code_challenge', codeChallenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('scope', 'openid email profile');
        url.searchParams.set('prompt', prompt);

        return url.toString();
      },
      (error) => new CreateAuthorizationUrlError({ cause: error }),
    )();
  };
}
