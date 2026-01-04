import { jwtVerify, errors } from 'jose';
import { ResultAsync } from 'neverthrow';
import { Buffer } from 'node:buffer';
import {
  ExpiredPasswordResetTokenError,
  InvalidPasswordResetTokenError,
} from './errors';

interface PasswordResetTokenPayload {
  email: string;
}

export function verifyPasswordResetToken(
  token: string,
  secret: string,
): ResultAsync<
  PasswordResetTokenPayload,
  ExpiredPasswordResetTokenError | InvalidPasswordResetTokenError
> {
  return ResultAsync.fromPromise(
    (async () => {
      const secretKey = Buffer.from(secret, 'base64');

      const { payload } = await jwtVerify<PasswordResetTokenPayload>(
        token,
        secretKey,
      );

      return payload;
    })(),
    (error) => {
      if (error instanceof errors.JWTExpired) {
        return new ExpiredPasswordResetTokenError({ cause: error });
      }
      return new InvalidPasswordResetTokenError({ cause: error });
    },
  );
}
