import { LucidAuthError } from '../core/errors';

export class NextJsGetCookieError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to get cookie.',
      cause: options.cause,
    });
    this.name = 'NextJsGetCookieError';
  }
}

export class NextJsSetCookieError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to set cookie.',
      cause: options.cause,
    });
    this.name = 'NextJsSetCookieError';
  }
}

export class NextJsDeleteCookieError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to delete cookie.',
      cause: options.cause,
    });
    this.name = 'NextJsDeleteCookieError';
  }
}
