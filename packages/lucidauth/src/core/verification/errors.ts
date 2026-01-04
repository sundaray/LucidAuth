import { LucidAuthError } from '../errors.js';

export class GenerateEmailVerificationTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message:
        options.message || 'Failed to generate email verification token.',
      cause: options.cause,
    });
    this.name = 'GenerateEmailVerificationTokenError';
  }
}

export class ExpiredEmailVerificationTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Email verification token has expired.',
      cause: options.cause,
    });
    this.name = 'ExpiredEmailVerificationTokenError';
  }
}

export class EmailVerificationTokenNotFoundError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Email verification token not found.',
      cause: options.cause,
    });
    this.name = 'EmailVerificationTokenNotFoundError';
  }
}

export class InvalidEmailVerificationTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid email verification token.',
      cause: options.cause,
    });
    this.name = 'InvalidEmailVerificationTokenError';
  }
}

export class BuildEmailVerificationUrlError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to build email verification URL.',
      cause: options.cause,
    });
    this.name = 'BuildEmailVerificationUrlError';
  }
}
