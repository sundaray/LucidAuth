import { AuthError } from '../../core/errors.js';

export class AccountNotFoundError extends AuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message:
        options.message || 'No account found with this email. Please sign up.',
      cause: options.cause,
    });
    this.name = 'AccountNotFoundError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid email or password.',
      cause: options.cause,
    });
    this.name = 'InvalidCredentialsError';
  }
}
