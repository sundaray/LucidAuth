import { GoogleProvider } from './provider.js';
import type { GoogleProviderConfig } from './types.js';
import type { AnyAuthProvider, OAuthProvider } from '../types.js';

export function Google(config: GoogleProviderConfig): OAuthProvider {
  return new GoogleProvider(config);
}

export type { GoogleProviderConfig };
