import { LucidAuthError } from '../../core/errors.js';

export class AccountNotFoundError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message:
        options.message || 'No account found with this email. Please sign up.',
      cause: options.cause,
    });
    this.name = 'AccountNotFoundError';
  }
}

export class InvalidCredentialsError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid email or password.',
      cause: options.cause,
    });
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountAlreadyExistsError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'An account with this email already exists.',
      cause: options.cause,
    });
    this.name = 'AccountAlreadyExistsError';
  }
}
