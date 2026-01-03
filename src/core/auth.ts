import type { AuthConfig } from '../types/index.js';
import type { AnyAuthProvider } from '../providers/types.js';
import type { AuthContext, CookieOperations } from './types.js';

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
  const ctx: AuthContext = {
    config,
    providers: new Map(providers.map((provider) => [provider.id, provider])),
    cookies,
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
