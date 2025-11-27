import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GenerateStateError } from './errors';

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
import { generateState } from './generate-state';

describe('generateTest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('should generate a random test string', () => {
    const result = generateState();

    expect(result.isOk()).toBe(true);

    const state = result._unsafeUnwrap();

    expect(state).toBeTypeOf('string');
    expect(state.length).toBeGreaterThan(0);
  });

  test('should generate unique values on subsequent calls', () => {
    const result1 = generateState();
    const result2 = generateState();

    const state1 = result1._unsafeUnwrap();
    const state2 = result2._unsafeUnwrap();

    expect(state1).not.toEqual(state2);
  });

  test('should return GenerateStateError when crypto.randomBytes throws', () => {
    const cryptoError = new Error('Entropy source exhausted');

    vi.mocked(crypto.randomBytes).mockImplementation(() => {
      throw cryptoError;
    });

    const result = generateState();

    expect(result.isErr()).toBe(true);
    const error = result._unsafeUnwrapErr();

    expect(error).toBeInstanceOf(GenerateStateError);
  });
});
