import type { AuthProviderId } from '../../providers/types';
import { LucidAuthError } from '../errors';

import { ResultAsync } from 'neverthrow';

// ============================================
// USER TYPES
// ============================================
export interface BaseUser {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string | null;
}

export interface User extends BaseUser {}

// ============================================
// SESSION TYPES
// ============================================

export interface BaseUserSession {
  user: BaseUser;
  provider: AuthProviderId;
  expiresAt: string;
}

export interface UserSession extends BaseUserSession {}

export interface UserSessionPayload {
  user: User;
  provider: AuthProviderId;
}

export interface SessionStorage<TContext> {
  getSession(context: TContext): ResultAsync<string | null, LucidAuthError>;
  saveSession(
    context: TContext,
    session: string,
  ): ResultAsync<void, LucidAuthError>;
  deleteSession(context: TContext): ResultAsync<void, LucidAuthError>;
}

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
}

export type UserSessionJWE = string & { __brand: UserSessionJWE };
