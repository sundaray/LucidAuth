import type { AuthConfig } from '../../types';
import type { SessionStorage, UserSessionPayload } from '../session/types';
import {
  encryptUserSessionPayload,
  decryptUserSession,
  createUserSessionPayload,
} from '../session';
import type { AuthProviderId } from '../../providers/types';
import { ResultAsync, okAsync } from 'neverthrow';
import { AuthError, UnknownError } from '../errors';

export class SessionService<TContext> {
  constructor(
    private config: AuthConfig,
    private userSessionStorage: SessionStorage<TContext>,
  ) {}

  // --------------------------------------------
  // Create session
  // --------------------------------------------
  createSession(
    sessionData: Record<string, unknown>,
    providerId: AuthProviderId,
  ): ResultAsync<string, AuthError> {
    return createUserSessionPayload({
      authConfig: this.config,
      providerName: providerId,
      userClaims: sessionData,
    })
      .andThen((userSessionPayload) =>
        encryptUserSessionPayload({
          userSessionPayload,
          secret: this.config.session.secret,
          maxAge: this.config.session.maxAge,
        }),
      )
      .mapErr((error) => {
        if (error instanceof AuthError) {
          return error;
        }
        return new UnknownError({
          context: 'session-service.createSession',
          cause: error,
        });
      });
  }

  // --------------------------------------------
  // Get session
  // --------------------------------------------
  getSession(
    context: TContext,
  ): ResultAsync<UserSessionPayload | null, AuthError> {
    return this.userSessionStorage
      .getSession(context)
      .andThen((session) => {
        if (!session) {
          return okAsync(null);
        }

        return decryptUserSession({
          session,
          secret: this.config.session.secret,
        });
      })
      .mapErr((error) => {
        if (error instanceof AuthError) {
          return error;
        }
        return new UnknownError({
          context: 'session-service.getSession',
          cause: error,
        });
      });
  }

  // --------------------------------------------
  // Delete session
  // --------------------------------------------
  deleteSession(context: TContext): ResultAsync<void, AuthError> {
    return this.userSessionStorage.deleteSession(context).mapErr((error) => {
      if (error instanceof AuthError) {
        return error;
      }
      return new UnknownError({
        context: 'session-service.deleteSession',
        cause: error,
      });
    });
  }
}
