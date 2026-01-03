import type { AuthConfig } from '../types/index.js';
import type { AnyAuthProvider } from '../providers/types.js';
import type { AuthContext, CookieOperations } from './types.js';
import { createSessionOperations } from './session/index.js';

import {
  signIn,
  signUp,
  signOut,
  getUserSession,
  handleOAuthCallback,
  verifyEmail,
  forgotPassword,
  verifyPasswordResetToken,
  resetPassword,
} from './operations/index.js';

export function createAuthHelpers(
  config: AuthConfig,
  providers: AnyAuthProvider[],
  cookies: CookieOperations,
) {
  const session = createSessionOperations(cookies, config.session.maxAge);

  const ctx: AuthContext = {
    config,
    // The 'providers' key will look like: Map { 'google' => GoogleProviderObj, 'credential' => CredentialProviderObj }
    providers: new Map(providers.map((provider) => [provider.id, provider])),
    cookies,
    session,
  };

  return {
    signIn: signIn(ctx),
    signUp: signUp(ctx),
    signOut: signOut(ctx),
    getUserSession: getUserSession(ctx),
    handleOAuthCallback: handleOAuthCallback(ctx),
    verifyEmail: verifyEmail(ctx),
    forgotPassword: forgotPassword(ctx),
    verifyPasswordResetToken: verifyPasswordResetToken(ctx),
    resetPassword: resetPassword(ctx),
  };
}
