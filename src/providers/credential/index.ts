import { CredentialProvider } from './provider.js';
import type { CredentialProviderConfig } from './types.js';
import type { CredentialProvider as CredentialProviderType } from '../types.js';

export function Credential(
  config: CredentialProviderConfig,
): CredentialProviderType {
  return new CredentialProvider(config);
}
