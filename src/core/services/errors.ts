import { SuperAuthError } from '../errors';

export class ProviderNotFoundError extends SuperAuthError {
  constructor(options: { providerId: string; cause?: unknown }) {
    super({
      message: `Provider '${options.providerId}' not found.`,
      cause: options.cause,
    });
    this.name = 'ProviderNotFoundError';
  }
}
