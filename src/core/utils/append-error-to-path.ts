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
