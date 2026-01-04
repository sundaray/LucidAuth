import { describe, it, expect } from 'vitest';
import { parseUrl, appendErrorToPath, isNextJsDynamicError } from './index.js';
import { InvalidUrlError } from '../../providers/google/errors.js';

describe('parseUrl', () => {
  it('returns Ok with URL for valid url string', () => {
    const result = parseUrl('https://example.com/path?query=value');

    expect(result.isOk()).toBe(true);

    const url = result._unsafeUnwrap();
    expect(url.hostname).toBe('example.com');
    expect(url.pathname).toBe('/path');
    expect(url.searchParams.get('query')).toBe('value');
  });

  it('returns Ok with URL for valid url with port', () => {
    const result = parseUrl('http://localhost:3000/api/auth');

    expect(result.isOk()).toBe(true);

    const url = result._unsafeUnwrap();
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('3000');
    expect(url.pathname).toBe('/api/auth');
  });

  it('returns Err with InvalidUrlError for invalid url', () => {
    const result = parseUrl('not-a-valid-url');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidUrlError);
  });

  it('returns Err with InvalidUrlError for empty string', () => {
    const result = parseUrl('');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidUrlError);
  });
});

describe('appendErrorToPath', () => {
  it('appends error with ? when path has no query params', () => {
    const result = appendErrorToPath('/sign-in', 'InvalidCredentialsError');

    expect(result).toBe('/sign-in?error=invalid_credentials_error');
  });

  it('appends error with & when path already has query params', () => {
    const result = appendErrorToPath(
      '/sign-in?redirect=/dashboard',
      'InvalidCredentialsError',
    );

    expect(result).toBe(
      '/sign-in?redirect=/dashboard&error=invalid_credentials_error',
    );
  });

  it('converts PascalCase error name to snake_case', () => {
    const result = appendErrorToPath('/error', 'GetSessionError');

    expect(result).toBe('/error?error=get_session_error');
  });

  it('handles long error names with multiple capital letters', () => {
    const result = appendErrorToPath(
      '/error',
      'InvalidEmailVerificationTokenError',
    );

    expect(result).toBe('/error?error=invalid_email_verification_token_error');
  });

  it('handles root path', () => {
    const result = appendErrorToPath('/', 'AuthError');

    expect(result).toBe('/?error=auth_error');
  });

  it('handles single word error name', () => {
    const result = appendErrorToPath('/error', 'Error');

    expect(result).toBe('/error?error=error');
  });
});

describe('isNextJsDynamicError', () => {
  it('returns true for Next.js dynamic server usage error', () => {
    const error = {
      digest: 'DYNAMIC_SERVER_USAGE',
      message: 'Some error message',
    };

    expect(isNextJsDynamicError(error)).toBe(true);
  });

  it('returns false for error with different digest', () => {
    const error = {
      digest: 'SOME_OTHER_DIGEST',
      message: 'Some error message',
    };

    expect(isNextJsDynamicError(error)).toBe(false);
  });

  it('returns false for error without digest property', () => {
    const error = new Error('Regular error');

    expect(isNextJsDynamicError(error)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isNextJsDynamicError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isNextJsDynamicError(undefined)).toBe(false);
  });

  it('returns false for non-object values', () => {
    expect(isNextJsDynamicError('string')).toBe(false);
    expect(isNextJsDynamicError(123)).toBe(false);
    expect(isNextJsDynamicError(true)).toBe(false);
  });

  it('returns false for object with digest as non-string', () => {
    const error = {
      digest: 12345,
    };

    expect(isNextJsDynamicError(error)).toBe(false);
  });
});
