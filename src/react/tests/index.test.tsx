// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { UserSessionProvider, useUserSession } from '../index.js';
import { MissingUserSessionProviderError } from '../errors.js';
import type { UserSession } from '../../core/session/types.js';

function createMockUserSession(
  overrides: Partial<UserSession> = {},
): UserSession {
  return {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    provider: 'google',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    ...overrides,
  };
}

function createWrapper(session: UserSession | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <UserSessionProvider session={session}>{children}</UserSessionProvider>
    );
  };
}

describe('UserSessionProvider', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <UserSessionProvider session={null}>
        <div data-testid="child">Child content</div>
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child content');
  });

  it('provides session to consuming components', () => {
    const mockSession = createMockUserSession();

    function TestConsumer() {
      const { session } = useUserSession();
      return <div data-testid="email">{session?.user.email}</div>;
    }

    render(
      <UserSessionProvider session={mockSession}>
        <TestConsumer />
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
  });

  it('updates state when session prop changes', () => {
    const initialSession = createMockUserSession({
      user: { id: 'user-1', email: 'first@example.com', name: 'First User' },
    });
    const updatedSession = createMockUserSession({
      user: { id: 'user-2', email: 'second@example.com', name: 'Second User' },
    });

    function TestConsumer() {
      const { session } = useUserSession();
      return <div data-testid="email">{session?.user.email}</div>;
    }

    const { rerender } = render(
      <UserSessionProvider session={initialSession}>
        <TestConsumer />
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('email')).toHaveTextContent('first@example.com');

    rerender(
      <UserSessionProvider session={updatedSession}>
        <TestConsumer />
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('email')).toHaveTextContent('second@example.com');
  });

  it('handles transition from authenticated to unauthenticated', () => {
    const mockSession = createMockUserSession();

    function TestConsumer() {
      const { session, isAuthenticated } = useUserSession();
      return (
        <div>
          <span data-testid="authenticated">{String(isAuthenticated)}</span>
          <span data-testid="email">{session?.user.email ?? 'none'}</span>
        </div>
      );
    }

    const { rerender } = render(
      <UserSessionProvider session={mockSession}>
        <TestConsumer />
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');

    rerender(
      <UserSessionProvider session={null}>
        <TestConsumer />
      </UserSessionProvider>,
    );

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });
});

describe('useUserSession', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('throws MissingUserSessionProviderError when used outside provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useUserSession())).toThrow(
      MissingUserSessionProviderError,
    );
  });

  describe('with authenticated session', () => {
    it('returns success status with session data', () => {
      const mockSession = createMockUserSession();

      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(mockSession),
      });

      expect(result.current.status).toBe('success');
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.error).toBeNull();
    });

    it('returns isAuthenticated as true', () => {
      const mockSession = createMockUserSession();

      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(mockSession),
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isLoading as false', () => {
      const mockSession = createMockUserSession();

      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(mockSession),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('returns isError as false', () => {
      const mockSession = createMockUserSession();

      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(mockSession),
      });

      expect(result.current.isError).toBe(false);
    });
  });

  describe('with null session (unauthenticated)', () => {
    it('returns success status with null session', () => {
      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.status).toBe('success');
      expect(result.current.session).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('returns isAuthenticated as false', () => {
      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns isLoading as false', () => {
      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('returns isError as false', () => {
      const { result } = renderHook(() => useUserSession(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isError).toBe(false);
    });
  });

  it('returns all expected properties', () => {
    const mockSession = createMockUserSession();

    const { result } = renderHook(() => useUserSession(), {
      wrapper: createWrapper(mockSession),
    });

    expect(result.current).toEqual({
      status: 'success',
      session: mockSession,
      error: null,
      isLoading: false,
      isError: false,
      isAuthenticated: true,
    });
  });
});
