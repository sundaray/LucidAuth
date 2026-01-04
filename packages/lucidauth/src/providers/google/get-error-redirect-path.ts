import type { GoogleProviderConfig } from './types.js';

export function getErrorRedirectPath(config: GoogleProviderConfig) {
  return function (): `/${string}` {
    return config.onAuthentication.redirects.error;
  };
}
