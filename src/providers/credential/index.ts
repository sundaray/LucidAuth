import { CredentialProvider } from './provider';
import type { CredentialProviderConfig } from './types';
import type { CredentialProvider as CredentialProviderType } from '../types';

export function Credential(
  config: CredentialProviderConfig,
): CredentialProviderType {
  return new CredentialProvider(config);
}
