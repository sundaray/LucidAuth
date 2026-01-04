import { jwtVerify, errors } from 'jose';
import { ResultAsync } from 'neverthrow';
import { Buffer } from 'node:buffer';
import type { EmailVerificationPayload } from './types.js';
import {
  ExpiredEmailVerificationTokenError,
  InvalidEmailVerificationTokenError,
} from './errors.js';

export function verifyEmailVerificationToken(
  token: string,
  secret: string,
): ResultAsync<
  EmailVerificationPayload,
  ExpiredEmailVerificationTokenError | InvalidEmailVerificationTokenError
> {
  return ResultAsync.fromPromise(
    (async () => {
      const secretKey = Buffer.from(secret, 'base64');

      const { payload } = await jwtVerify<EmailVerificationPayload>(
        token,
        secretKey,
      );

      return payload;
    })(),
    (error) => {
      if (error instanceof errors.JWTExpired) {
        return new ExpiredEmailVerificationTokenError({ cause: error });
      }
      return new InvalidEmailVerificationTokenError({ cause: error });
    },
  );
}
