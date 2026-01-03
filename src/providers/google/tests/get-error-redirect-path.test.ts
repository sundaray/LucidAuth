import { describe, it, expect } from 'vitest';
import { getErrorRedirectPath } from '../get-error-redirect-path.js';
import { createMockConfig } from './setup.js';

describe('getErrorRedirectPath', () => {
  it('returns configured error redirect path', () => {
    const config = createMockConfig();
    config.onAuthentication.redirects.error = '/custom/error/page';

    const getPath = getErrorRedirectPath(config);

    expect(getPath()).toBe('/custom/error/page');
  });

  it('returns default error path from config', () => {
    const config = createMockConfig();

    const getPath = getErrorRedirectPath(config);

    expect(getPath()).toBe('/auth/error');
  });
});
