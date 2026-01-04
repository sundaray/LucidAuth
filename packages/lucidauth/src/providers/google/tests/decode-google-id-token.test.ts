import { describe, it, expect } from 'vitest';
import { decodeGoogleIdToken } from '../decode-google-id-token.js';
import { DecodeGoogleIdTokenError } from '../errors.js';
import type { GoogleUserClaims } from '../types.js';

function createMockIdToken(payload: GoogleUserClaims): string {
  const header = { alg: 'RS256', typ: 'JWT' };

  const base64UrlEncode = (obj: object): string => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);
  const signature = 'mock-signature';

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function createMockGoogleClaims(
  overrides: Partial<GoogleUserClaims> = {},
): GoogleUserClaims {
  return {
    aud: 'your-client-id.apps.googleusercontent.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    iss: 'https://accounts.google.com',
    sub: '123456789',
    email: 'test@gmail.com',
    ...overrides,
  };
}

describe('decodeGoogleIdToken', () => {
  it('returns Ok with decoded claims for valid id token', () => {
    const mockClaims = createMockGoogleClaims({
      email_verified: true,
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });

    const idToken = createMockIdToken(mockClaims);

    const result = decodeGoogleIdToken(idToken);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      iss: 'https://accounts.google.com',
      sub: '123456789',
      email: 'test@gmail.com',
      email_verified: true,
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });
  });

  it('returns Ok with required claims only', () => {
    const mockClaims = createMockGoogleClaims();

    const idToken = createMockIdToken(mockClaims);

    const result = decodeGoogleIdToken(idToken);

    expect(result.isOk()).toBe(true);

    const claims = result._unsafeUnwrap();
    expect(claims.aud).toBe('your-client-id.apps.googleusercontent.com');
    expect(claims.iss).toBe('https://accounts.google.com');
    expect(claims.sub).toBe('123456789');
    expect(claims.email).toBe('test@gmail.com');
  });

  it('returns Ok with all optional claims', () => {
    const mockClaims = createMockGoogleClaims({
      at_hash: 'abc123',
      azp: 'your-client-id.apps.googleusercontent.com',
      email_verified: true,
      name: 'Test User',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/photo.jpg',
      locale: 'en',
      profile: 'https://plus.google.com/123456789',
    });

    const idToken = createMockIdToken(mockClaims);

    const result = decodeGoogleIdToken(idToken);

    expect(result.isOk()).toBe(true);

    const claims = result._unsafeUnwrap();
    expect(claims.at_hash).toBe('abc123');
    expect(claims.azp).toBe('your-client-id.apps.googleusercontent.com');
    expect(claims.email_verified).toBe(true);
    expect(claims.name).toBe('Test User');
    expect(claims.given_name).toBe('Test');
    expect(claims.family_name).toBe('User');
    expect(claims.picture).toBe('https://example.com/photo.jpg');
    expect(claims.locale).toBe('en');
    expect(claims.profile).toBe('https://plus.google.com/123456789');
  });

  it('returns Err with DecodeGoogleIdTokenError for invalid token format', () => {
    const invalidToken = 'not-a-valid-jwt';

    const result = decodeGoogleIdToken(invalidToken);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(DecodeGoogleIdTokenError);
  });

  it('returns Err with DecodeGoogleIdTokenError for malformed base64', () => {
    const malformedToken = 'header.!!!invalid-base64!!!.signature';

    const result = decodeGoogleIdToken(malformedToken);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(DecodeGoogleIdTokenError);
  });

  it('returns Err with DecodeGoogleIdTokenError for empty string', () => {
    const result = decodeGoogleIdToken('');

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(DecodeGoogleIdTokenError);
  });
});
