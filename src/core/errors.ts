export class LucidAuthError extends Error {
  constructor(options: { message: string; cause?: unknown }) {
    super(options.message, { cause: options.cause });
    this.name = 'AuthError';
  }
}

export class CallbackError extends LucidAuthError {
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
    // "onSignUp.checkUserExists" → "OnSignUpCheckUserExistsCallbackError"
    // "onPasswordReset.sendPasswordResetEmail" → "OnPasswordResetSendPasswordResetEmailCallbackError"
    const formattedCallback = options.callback
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
    this.name = `${formattedCallback}CallbackError`;
  }
}

export class UnknownError extends LucidAuthError {
  constructor(options: { message?: string; cause?: unknown; context: string }) {
    super({
      message: `Unknown error occurred in ${options.context}`,
      cause: options.cause,
    });
    this.name = 'UnknownError';
  }
}
