export { generateEmailVerificationToken } from './generate-email-verification-token.js';
export { verifyEmailVerificationToken } from './verify-email-verification-token.js';
export { buildEmailVerificationUrl } from './build-email-verification-url.js';

export type { EmailVerificationToken } from './types.js';

export {
  GenerateEmailVerificationTokenError,
  VerifyEmailVerificationTokenError,
  ExpiredEmailVerificationTokenError,
  InvalidEmailVerificationTokenError,
  BuildEmailVerificationUrlError,
  EmailVerificationTokenNotFoundError,
} from './errors.js';
