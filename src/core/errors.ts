export class AuthError extends Error {
  constructor(options: { message: string; cause?: unknown }) {
    super(options.message, { cause: options.cause });
    this.name = 'AuthError';
  }
}

export class CallbackError extends AuthError {
  constructor(options: {
    callback: string;
    message?: string;
    cause?: unknown;
  }) {
    super({
      message:
        options.message ||
        `User callback '${options.callback}' failed to execute.`,
      cause: options.cause,
    });
    this.name = 'CallbackError';
  }
}

export class UnknownError extends AuthError {
  constructor(options: { message?: string; cause?: unknown; context: string }) {
    super({
      message: `Unknown error occurred in ${options.context}`,
      cause: options.cause,
    });
    this.name = 'UnknownError';
  }
}
