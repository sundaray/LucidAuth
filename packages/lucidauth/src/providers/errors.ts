import { LucidAuthError } from '../core/errors';

export class ProviderNotFoundError extends LucidAuthError {
  constructor(options: { providerId: string; cause?: unknown }) {
    super({
      message: `Provider '${options.providerId}' not found.`,
      cause: options.cause,
    });
    this.name = 'ProviderNotFoundError';
  }
}

export class CredentialProviderNotFoundError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Credential provider not found.',
      cause: options.cause,
    });
    this.name = 'CredentialProviderNotFoundError';
  }
}

export class InvalidCredentialProviderTypeError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Provider is not a credential provider.',
      cause: options.cause,
    });
    this.name = 'InvalidCredentialProviderTypeError';
  }
}

export class OAuthProviderNotFoundError extends LucidAuthError {
  constructor(
    options: { providerId?: string; message?: string; cause?: unknown } = {},
  ) {
    super({
      message:
        options.message || `OAuth provider '${options.providerId}' not found.`,
      cause: options.cause,
    });
    this.name = 'OAuthProviderNotFoundError';
  }
}

export class InvalidOAuthProviderTypeError extends LucidAuthError {
  constructor(
    options: { providerId?: string; message?: string; cause?: unknown } = {},
  ) {
    super({
      message:
        options.message ||
        `Provider '${options.providerId}' is not an OAuth provider.`,
      cause: options.cause,
    });
    this.name = 'InvalidOAuthProviderTypeError';
  }
}
