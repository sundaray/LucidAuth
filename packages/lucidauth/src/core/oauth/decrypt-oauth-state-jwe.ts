import { jwtDecrypt, errors } from 'jose';
import { ResultAsync } from 'neverthrow';
import type { OAuthState } from './index.js';
import { Buffer } from 'node:buffer';
import { ExpiredOAuthStateError, InvalidOAuthStateError } from './errors.js';

export interface DecryptOAuthStateJWEParams {
  jwe: string;
  secret: string;
}

export function decryptOAuthStateJWE(
  params: DecryptOAuthStateJWEParams,
): ResultAsync<OAuthState, ExpiredOAuthStateError | InvalidOAuthStateError> {
  const { jwe, secret } = params;

  // Decode the base64 secret to get the raw bytes
  const secretKey = Buffer.from(secret, 'base64');

  return ResultAsync.fromPromise(
    (async () => {
      const { payload } = await jwtDecrypt(jwe, secretKey);
      return payload.oauthState as OAuthState;
    })(),
    (error) => {
      if (error instanceof errors.JWTExpired) {
        return new ExpiredOAuthStateError({ cause: error });
      }
      return new InvalidOAuthStateError({ cause: error });
    },
  );
}
