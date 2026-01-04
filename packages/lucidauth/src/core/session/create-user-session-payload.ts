import { ResultAsync, okAsync } from 'neverthrow';
import type { AuthProviderId } from '../../providers/types';
import type { User, UserSessionPayload } from './';

interface CreateUserSessionPayloadParams {
  provider: AuthProviderId;
  user: User;
}

export function createUserSessionPayload(
  params: CreateUserSessionPayloadParams,
): ResultAsync<UserSessionPayload, never> {
  const { provider, user } = params;

  return okAsync({
    user,
    provider,
  });
}
