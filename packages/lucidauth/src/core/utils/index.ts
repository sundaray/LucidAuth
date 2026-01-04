import { Result } from 'neverthrow';
import { InvalidUrlError } from '../../providers/google/errors';

export function parseUrl(url: string): Result<URL, InvalidUrlError> {
  return Result.fromThrowable(
    () => new URL(url),
    (error) => new InvalidUrlError({ cause: error }),
  )();
}

export function appendErrorToPath(path: string, errorName: string): string {
  // Convert error name to snake_case
  // Example: "GetSessionError" -> "get_session_error"
  // Example: "InvalidEmailVerificationTokenError" -> "invalid_email_verification_token_error"
  const formattedError = errorName
    .replace(/([A-Z])/g, '_$1') // Add underscore before capitals: "_Get_Session_Error"
    .toLowerCase() // Convert to lowercase: "_get_session_error"
    .replace(/^_/, ''); // Remove leading underscore: "get_session_error"

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}error=${encodeURIComponent(formattedError)}`;
}

export function isNextJsDynamicError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    (error as { digest: string }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

export function ensureLeadingSlash(path: string): string {
  if (path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}
