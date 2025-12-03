import { jwtDecrypt, errors } from 'jose';
import { ResultAsync } from 'neverthrow';
import { Buffer } from 'node:buffer';
import type { User, UserSession, UserSessionJWE } from '.';
import type { AuthProviderId } from '../../providers/types';
import { ExpiredUserSessionError, InvalidUserSessionError } from './errors';

export interface DecryptUserSessionParams {
  JWE: UserSessionJWE;
  secret: string;
}

export function decryptUserSessionJWE(
  params: DecryptUserSessionParams,
): ResultAsync<UserSession, ExpiredUserSessionError | InvalidUserSessionError> {
  const { JWE, secret } = params;

  // Decode the base64 secret to get the raw bytes
  const secretKey = Buffer.from(secret, 'base64');

  return ResultAsync.fromPromise(
    (async () => {
      const { payload } = await jwtDecrypt(JWE, secretKey);
      const { exp, user, provider } = payload as {
        exp: number;
        iat: number;
        user: User;
        provider: AuthProviderId;
      };
      return {
        user,
        provider,
        expiresAt: new Date(exp * 1000).toISOString(),
      };
    })(),
    (error) => {
      if (error instanceof errors.JWTExpired) {
        return new ExpiredUserSessionError({ cause: error });
      }
      return new InvalidUserSessionError({ cause: error });
    },
  );
}
