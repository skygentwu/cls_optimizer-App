import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, login, logout, fetchPrices, buildApiUrl } from './client';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

describe('buildApiUrl', () => {
  beforeEach(() => {
    useAppStore.setState({ apiBaseUrl: '' });
  });

  it('returns path when no base', () => {
    expect(buildApiUrl('/api/prices')).toBe('/api/prices');
  });

  it('concatenates base and path', () => {
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });

  it('deduplicates /api when base ends with /api', () => {
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000/api' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });

  it('trims trailing slashes from base', () => {
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000/' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });
});

describe('ApiError', () => {
  it('stores status and message', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
  });
});

describe('request with mocked fetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    useAuthStore.setState({ token: '', user: null, isLoggedIn: false });
    useAppStore.setState({ apiBaseUrl: '' });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('login sends POST and returns data', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'abc', token_type: 'bearer', user: { username: 'u', display_name: 'U', role: 'admin', auth_source: 'local' } }),
    });

    const res = await login('u', 'p');
    expect(res.access_token).toBe('abc');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'u', password: 'p' }),
      })
    );
  });

  it('logout sends POST', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const res = await logout();
    expect(res.ok).toBe(true);
  });

  it('fetchPrices appends query param', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, records: [] }),
    });

    await fetchPrices(10);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/prices?limit=10',
      expect.any(Object)
    );
  });

  it('injects Authorization header when token exists', async () => {
    useAuthStore.setState({ token: 'my-token', user: { username: 'u', display_name: 'U', role: 'user', auth_source: 'local' }, isLoggedIn: true });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await fetchPrices(1);
    const callArgs = fetchMock.mock.calls[0][1] as RequestInit;
    expect(callArgs.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer my-token',
    });
  });

  it('throws ApiError on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'Server fail' }),
    });

    await expect(login('u', 'p')).rejects.toBeInstanceOf(ApiError);
  });

  it('clears auth and redirects on 401', async () => {
    useAuthStore.setState({ token: 'old-token', user: { username: 'u', display_name: 'U', role: 'user', auth_source: 'local' }, isLoggedIn: true });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Unauthorized' }),
    });

    await expect(fetchPrices(1)).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().token).toBe('');
    expect(window.location.hash).toBe('#/login');
  });

  it('aborts request after 15s timeout', async () => {
    fetchMock.mockImplementation((_url: string, options: RequestInit) => {
      return new Promise((_, reject) => {
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }
      });
    });
    const promise = login('u', 'p');
    vi.advanceTimersByTime(16000);
    await expect(promise).rejects.toThrow('Aborted');
  });
});
