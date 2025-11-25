import { describe, test, expect } from 'vitest';
import { generateCodeChallenge } from './generate-code-challenge';

describe('generateCodeChallenge', () => {
  test('should hash a verifier into a challenge', async () => {
    const codeVerifier =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

    const result = await generateCodeChallenge(codeVerifier);

    expect(result.isOk()).toBe(true);

    const codeChallenge = result._unsafeUnwrap();

    expect(codeChallenge).toBeTypeOf('string');
    expect(codeChallenge.length).toBeGreaterThan(0);
  });

  test('should be deterministic (same input = same output)', async () => {
    const codeVerifier =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~';

    const result1 = await generateCodeChallenge(codeVerifier);
    const result2 = await generateCodeChallenge(codeVerifier);

    const codeChallenge1 = result1._unsafeUnwrap();
    const codeChallenge2 = result2._unsafeUnwrap();

    expect(codeChallenge1).toEqual(codeChallenge2);
  });

  test('should generate different code challenges for different code verifiers', async () => {
    const codeVerifier1 =
      'verifier-one-must-be-at-least-43-characters-long-for-pkce-test';
    const codeVerifier2 =
      'Verifier_Two_With_Numbers_0123456789_and_Symbols_.-~_';

    const result1 = await generateCodeChallenge(codeVerifier1);
    const result2 = await generateCodeChallenge(codeVerifier2);

    const codeChalleneg1 = result1._unsafeUnwrap();
    const codeChalleneg2 = result2._unsafeUnwrap();

    expect(codeChalleneg1).not.toEqual(codeChalleneg2);
  });
});
