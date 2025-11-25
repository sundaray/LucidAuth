import { describe, test, expect } from 'vitest';
import { generateCodeVerifier } from './generate-code-verifier';

describe('generateCodeVerifier', () => {
  test('should generate a random code verifier', () => {
    const result = generateCodeVerifier();

    expect(result.isOk()).toBe(true);

    const codeVerifier = result._unsafeUnwrap();

    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  test('should generate unique code verifiers', () => {
    const codeVerifier1 = generateCodeVerifier()._unsafeUnwrap();
    const codeVerifier2 = generateCodeVerifier()._unsafeUnwrap();

    expect(codeVerifier1).not.toEqual(codeVerifier2);
  });
});
