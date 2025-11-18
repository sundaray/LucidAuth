import { AuthError } from '../errors.js';

export class InitiateSignInError extends AuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to initiate OAuth sign-in.',
      cause: options.cause,
    });
    this.name = 'InitiateSignInError';
  }
}

export class CompleteSignInError extends AuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to complete OAuth sign-in.',
      cause: options.cause,
    });
    this.name = 'CompleteSignInError';
  }
}

export class ProviderNotFoundError extends AuthError {
  constructor(options: { providerId: string; cause?: unknown }) {
    super({
      message: `Provider '${options.providerId}' not found.`,
      cause: options.cause,
    });
    this.name = 'ProviderNotFoundError';
  }
}
