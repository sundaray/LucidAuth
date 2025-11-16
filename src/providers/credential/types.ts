export interface User {
  email: string;
  [key: string]: unknown;
}

export interface CredentialProviderConfig {
  onSignUp(data: {
    email: string;
    hashedPassword: string;
    [key: string]: unknown;
  }): Promise<User>;

  /**
   * A callback to fetch an existing user from your database.
   * The library will use this user's `hashedPassword` to verify their sign-in attempt.
   *
   * @param data An object containing the `email` of the user trying to sign in.
   * @returns A promise that resolves to the user object, including their stored `hashedPassword`.
   * If no user is found with that email, you **must return `null` or `undefined`**.
   */
  onSignIn(data: {
    email: string;
  }): Promise<(User & { hashedPassword: string }) | null>;

  emailVerification: {
    /**
     * The path for the email verification link (e.g., `/api/auth/verify-email`).
     */
    path: `/${string}`;
    /**
     * A callback to send the email verification link.
     * Use your own email provider (e.g., SendGrid, Nodemailer) to send an email.
     *
     * @param params An object containing the user's `email` and the generated `url` to send.
     * @returns A promise that resolves when the email has been sent.
     */
    sendVerificationEmail(params: {
      email: string;
      url: string;
    }): Promise<void>;
    /**
     * A callback that fires *after* a verification token has been successfully validated.
     * Use this to mark the user as "verified" in your database (e.g., set `user.emailVerified = true`).
     *
     * @param data An object containing the `email` of the user who was verified.
     * @returns A promise that resolves when your database has been updated.
     */
    onEmailVerified(data: { email: string }): Promise<void>;
    /**
     * The URL to redirect to if email verification fails.
     */
    onError: `/${string}`;
    /**
     * The URL to redirect to after a successful email verification.
     */
    onSuccess: `/${string}`;
  };
}
