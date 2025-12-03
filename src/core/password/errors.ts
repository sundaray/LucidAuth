import { LucidAuthError } from '../errors';

export class HashPasswordError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to hash password',
      cause: options.cause,
    });
    this.name = 'HashPasswordError';
  }
}

export class VerifyPasswordError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to verify password',
      cause: options.cause,
    });
    this.name = 'VerifyPasswordError';
  }
}

export class InvalidPasswordHashFormatError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid password hash format.',
      cause: options.cause,
    });
    this.name = 'InvalidPasswordHashFormatError';
  }
}
export class GeneratePasswordResetTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to generate password reset token.',
      cause: options.cause,
    });
    this.name = 'GeneratePasswordResetTokenError';
  }
}

export class BuildPasswordResetUrlError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to build password reset URL.',
      cause: options.cause,
    });
    this.name = 'BuildPasswordResetUrlError';
  }
}

export class PasswordResetTokenNotFoundError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Password reset token not found.',
      cause: options.cause,
    });
    this.name = 'PasswordResetTokenNotFoundError';
  }
}
export class InvalidPasswordResetTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid password reset token.',
      cause: options.cause,
    });
    this.name = 'InvalidPasswordResetTokenError';
  }
}

export class ExpiredPasswordResetTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Password reset token has expired.',
      cause: options.cause,
    });
    this.name = 'ExpiredPasswordResetTokenError';
  }
}
