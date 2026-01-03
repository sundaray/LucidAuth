import { ok, err, Result } from 'neverthrow';
import type {
  AnyAuthProvider,
  OAuthProvider,
  AuthProviderId,
} from './types.js';
import {
  OAuthProviderNotFoundError,
  InvalidOAuthProviderTypeError,
} from './errors.js';

export function getOAuthProvider(
  providers: Map<string, AnyAuthProvider>,
  providerId: AuthProviderId,
): Result<
  OAuthProvider,
  OAuthProviderNotFoundError | InvalidOAuthProviderTypeError
> {
  const provider = providers.get(providerId);

  if (!provider) {
    return err(new OAuthProviderNotFoundError({ providerId }));
  }

  if (provider.type !== 'oauth') {
    return err(new InvalidOAuthProviderTypeError({ providerId }));
  }

  return ok(provider);
}
