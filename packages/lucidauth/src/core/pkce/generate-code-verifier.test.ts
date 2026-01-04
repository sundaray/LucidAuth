import { describe, test, expect, vi } from 'vitest';
import { GenerateCodeVerifierError } from './errors';

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    default: {
      ...actual,
      randomBytes: vi.fn(actual.randomBytes),
    },
  };
});

import crypto from 'node:crypto';
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

  test('should return GenerateCodeVerifierError when crypto.randomBytes throws', () => {
    const cryptoError = new Error('Entropy source exhausted');

    vi.mocked(crypto.randomBytes).mockImplementation(() => {
      throw cryptoError;
    });

    const result = generateCodeVerifier();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();

    expect(error).toBeInstanceOf(GenerateCodeVerifierError);
  });
});
