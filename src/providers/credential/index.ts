import { signUp } from './sign-up.js';
import { signIn } from './sign-in.js';
import { verifyEmail } from './verify-email.js';
import { resetPassword } from './reset-password.js';
import { forgotPassword } from './forgot-password.js';
import { verifyPasswordResetToken } from './verify-password-reset-token.js';
import type { CredentialProviderConfig, CredentialProvider } from './types.js';

export function Credential(
  config: CredentialProviderConfig,
): CredentialProvider {
  return {
    id: 'credential',
    type: 'credential',
    signUp: signUp(config),
    signIn: signIn(config),
    verifyEmail: verifyEmail(config),
    forgotPassword: forgotPassword(config),
    verifyPasswordResetToken: verifyPasswordResetToken(config),
    resetPassword: resetPassword(config),
  };
}

export type { CredentialProviderConfig };
