import type { GoogleProviderConfig, GoogleProvider } from './types.js';
import { createAuthorizationUrl } from './create-authorization-url.js';
import { completeSignin } from './complete-signin.js';
import { onAuthentication } from './on-authentication.js';
import { getErrorRedirectPath } from './get-error-redirect-path.js';

export function Google(config: GoogleProviderConfig): GoogleProvider {
  return {
    id: 'google',
    type: 'oauth',
    createAuthorizationUrl: createAuthorizationUrl(config),
    completeSignin: completeSignin(config),
    onAuthentication: onAuthentication(config),
    getErrorRedirectPath: getErrorRedirectPath(config),
  };
}

export type { GoogleProviderConfig };
