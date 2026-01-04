import { ok, err, Result } from 'neverthrow';
import type { AnyAuthProvider, CredentialProvider } from './types.js';
import {
  CredentialProviderNotFoundError,
  InvalidCredentialProviderTypeError,
} from './errors.js';

export function getCredentialProvider(
  providers: Map<string, AnyAuthProvider>,
): Result<
  CredentialProvider,
  CredentialProviderNotFoundError | InvalidCredentialProviderTypeError
> {
  const provider = providers.get('credential');

  if (!provider) {
    return err(new CredentialProviderNotFoundError());
  }

  if (provider.type !== 'credential') {
    return err(new InvalidCredentialProviderTypeError());
  }

  return ok(provider);
}
