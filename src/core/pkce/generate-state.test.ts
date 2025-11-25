import { describe, test, expect } from 'vitest';
import { generateState } from './generate-state';

describe('generateTest', () => {
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
});
