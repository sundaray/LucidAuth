import { decodeJwt } from 'jose';
import { Result } from 'neverthrow';
import type { GoogleIdTokenPayload } from './types.js';
import { DecodeGoogleIdTokenError } from './errors.js';

export function decodeGoogleIdToken(
  idToken: string,
): Result<GoogleIdTokenPayload, DecodeGoogleIdTokenError> {
  return Result.fromThrowable(
    () => decodeJwt(idToken) as GoogleIdTokenPayload,
    (error): DecodeGoogleIdTokenError =>
      new DecodeGoogleIdTokenError({
        cause: error,
      }),
  )();
}
