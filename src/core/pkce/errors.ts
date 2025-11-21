import { SuperAuthError } from '../errors';

export class GenerateStateError extends SuperAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to generate state.',
      cause: options.cause,
    });
    this.name = 'GenerateStateError';
  }
}

export class GenerateCodeVerifierError extends SuperAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to generate code verifier.',
      cause: options.cause,
    });
    this.name = 'GenerateCodeVerifierError';
  }
}

export class GenerateCodeChallengeError extends SuperAuthError {
  constructor(options: { message?: string; cause?: unknown } = {}) {
    super({
      message: options.message || 'Failed to generate code challenge.',
      cause: options.cause,
    });
    this.name = 'GenerateCodeChallengeError';
  }
}
