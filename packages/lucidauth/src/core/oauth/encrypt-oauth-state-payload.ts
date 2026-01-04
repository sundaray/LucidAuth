import { EncryptJWT } from 'jose';
import { ResultAsync } from 'neverthrow';
import { EncryptOAuthStatePayloadError } from './errors.js';
import type { OAuthState } from './types.js';
import { Buffer } from 'node:buffer';
import type { OAuthStateJWE } from './types.js';

export function encryptOAuthStatePayload(params: {
  oauthState: OAuthState;
  secret: string;
  maxAge: number;
}): ResultAsync<OAuthStateJWE, EncryptOAuthStatePayloadError> {
  return ResultAsync.fromPromise(
    (async () => {
      const { oauthState, secret, maxAge } = params;

      // Decode the base64 secret to get the raw bytes
      const secretKey = Buffer.from(secret, 'base64');

      const jwe = await new EncryptJWT({ oauthState })
        .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
        .setIssuedAt()
        .setExpirationTime(`${maxAge}s`)
        .encrypt(secretKey);

      return jwe as OAuthStateJWE;
    })(),
    (error) => new EncryptOAuthStatePayloadError({ cause: error }),
  );
}
