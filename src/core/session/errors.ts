import { LucidAuthError } from '../errors.js';

export class DeleteOauthStateCookieError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown }) {
    super({
      message: options.message || 'Failed to delete the OAuth state cookie.',
      cause: options.cause,
    });
    this.name = 'DeleteOauthStateCookieError';
  }
}

export class EncryptUserSessionPayloadError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to encrypt user session payload.',
      cause: options.cause,
    });
    this.name = 'EncryptUserSessionPayloadError';
  }
}

export class RunOAuthProviderSignInCallbackError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message:
        options.message || 'Failed to run OAuth provider sign-in callback.',
      cause: options.cause,
    });
    this.name = 'RunOAuthProviderSignInCallbackError';
  }
}

export class CreateUserSessionPayloadError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to create user session payload.',
      cause: options.cause,
    });
    this.name = 'CreateUserSessionPayloadError';
  }
}

export class OnSignInCallbackError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'User onSignIn callback failed to execute.',
      cause: options.cause,
    });
    this.name = 'OnSignInCallbackError';
  }
}

export class SetUserSessionCookieError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to set the user session cookie.',
      cause: options.cause,
    });
    this.name = 'SetUserSessionCookieError';
  }
}

export class GetUserSessionError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to get user session.',
      cause: options.cause,
    });
    this.name = 'GetUserSessionError';
  }
}

export class SaveUserSessionError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to save user session.',
      cause: options.cause,
    });
    this.name = 'SaveUserSessionError';
  }
}

export class DeleteUserSessionError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to delete user session.',
      cause: options.cause,
    });
    this.name = 'DeleteUserSessionError';
  }
}

export class ExpiredUserSessionError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'User session has expired.',
      cause: options.cause,
    });
    this.name = 'ExpiredUserSessionError';
  }
}

export class InvalidUserSessionError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid user session.',
      cause: options.cause,
    });
    this.name = 'InvalidUserSessionError';
  }
}
