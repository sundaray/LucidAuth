import type { AuthProviderId } from '../../providers/types.js';
import {
  GetSessionError,
  SaveSessionError,
  DeleteSessionError,
} from './errors.js';

import { ResultAsync } from 'neverthrow';

export interface UserSessionPayload {
  maxAge: number;
  provider: AuthProviderId;
  email?: string;
  name?: string;
  image?: string;
  role?: string;
  [key: string]: unknown;
}

export type UserSession = Omit<UserSessionPayload, 'maxAge' | 'provider'>;

export interface SessionStorage<TContext> {
  getSession(context: TContext): ResultAsync<string | null, GetSessionError>;
  saveSession(
    context: TContext,
    session: string,
  ): ResultAsync<void, SaveSessionError>;
  deleteSession(context: TContext): ResultAsync<void, DeleteSessionError>;
}

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
}

export type UserSessionJWE = string & { __brand: UserSessionJWE };
