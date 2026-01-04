import { LucidAuthError } from '../../core/errors.js';

export class InvalidUrlError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Invalid URL provided',
      cause: options.cause,
    });

    this.name = 'InvalidUrlError';
  }
}

export class EncodeClientCredentialsError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to encode client credentials',
      cause: options.cause,
    });
    this.name = 'EncodeClientCredentialsError';
  }
}

export class TokenFetchError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to fetch tokens from provider',
      cause: options.cause,
    });
    this.name = 'TokenFetchError';
  }
}

export class TokenResponseError extends LucidAuthError {
  public status?: number;
  public statusText?: string;

  constructor(
    options: {
      message?: string;
      cause?: unknown;
      status?: number;
      statusText?: string;
    } = {},
  ) {
    super({
      message: options.message || 'Token endpoint returned an error response',
      cause: options.cause,
    });
    this.name = 'TokenResponseError';
    this.status = options.status;
    this.statusText = options.statusText;
  }
}

export class TokenParseError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to parse token response',
      cause: options.cause,
    });
    this.name = 'TokenParseError';
  }
}

export class DecodeGoogleIdTokenError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to decode Google ID token.',
      cause: options.cause,
    });
    this.name = 'DecodeGoogleIdTokenError';
  }
}
