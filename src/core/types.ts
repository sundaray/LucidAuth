import type { ResultAsync } from 'neverthrow';
export type {
  BaseUser,
  User,
  BaseUserSession,
  UserSession,
} from './session/types.js';
export type { GoogleUserClaims } from '../providers/google/types.js';

export interface CookieOperations {
  get(name: string): ResultAsync<string | null, LucidAuthError>;
  set(
    name: string,
    value: string,
    maxAge: number,
  ): ResultAsync<void, LucidAuthError>;
  delete(name: string): ResultAsync<void, LucidAuthError>;
}

// ============================================
// AUTH CONTEXT
// ============================================

export interface AuthContext {
  config: AuthConfig;
  providers: Map<string, AnyAuthProvider>;
  cookies: CookieOperations;
}

// ============================================
// GOOGLE PROVIDER CALLBACK TYPES
// ============================================

import type { GoogleUserClaims } from '../providers/google/types.js';
import type { AnyAuthProvider } from '../providers/types.js';
import type { AuthConfig } from '../types/index.js';
import type { User } from './session/types.js';
import type { LucidAuthError } from './errors.js';

export type CreateGoogleUserParams = GoogleUserClaims;
export type CreateGoogleUserReturn = User;
export type CreateGoogleUserCallback = (
  params: CreateGoogleUserParams,
) => Promise<CreateGoogleUserReturn>;

// ============================================
// CREDENTIAL PROVIDER - SIGN UP
// ============================================

export type CheckCredentialUserExistsParams = { email: string };
export type CheckCredentialUserExistsReturn = { exists: boolean };
export type CheckCredentialUserExistsCallback = (
  params: CheckCredentialUserExistsParams,
) => Promise<CheckCredentialUserExistsReturn>;

export type SendVerificationEmailParams = { email: string; url: string };
export type SendVerificationEmailCallback = (
  params: SendVerificationEmailParams,
) => Promise<void>;

export type CreateCredentialUserParams = {
  email: string;
  hashedPassword: string;
};
export type CreateCredentialUserCallback = (
  params: CreateCredentialUserParams,
) => Promise<void>;

// ============================================
// CREDENTIAL PROVIDER - SIGN IN
// ============================================

export type GetCredentialUserParams = { email: string };
export type GetCredentialUserReturn =
  | (User & { hashedPassword: string })
  | null;
export type GetCredentialUserCallback = (
  params: GetCredentialUserParams,
) => Promise<GetCredentialUserReturn>;

// ============================================
// CREDENTIAL PROVIDER - PASSWORD RESET
// ============================================

export type SendPasswordResetEmailParams = { email: string; url: string };
export type SendPasswordResetEmailCallback = (
  params: SendPasswordResetEmailParams,
) => Promise<void>;

export type UpdatePasswordParams = { email: string; hashedPassword: string };
export type UpdatePasswordCallback = (
  params: UpdatePasswordParams,
) => Promise<void>;

export type SendPasswordUpdateEmailParams = { email: string };
export type SendPasswordUpdateEmailCallback = (
  params: SendPasswordUpdateEmailParams,
) => Promise<void>;
