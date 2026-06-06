import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, login, logout, fetchPrices, buildApiUrl } from './client';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

/**
 * buildApiUrl 测试集
 * 作用：验证后端地址与 API 路径的拼接逻辑
 * 场景：开发环境走 Vite Proxy（无 base）、生产环境有完整 baseURL、防止 /api 重复
 */
describe('buildApiUrl', () => {
  beforeEach(() => {
    // 每个测试前重置 apiBaseUrl 为空，模拟开发环境
    useAppStore.setState({ apiBaseUrl: '' });
  });

  it('无 base 时直接返回 path', () => {
    expect(buildApiUrl('/api/prices')).toBe('/api/prices');
  });

  it('有 base 时拼接成完整 URL', () => {
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });

  it('base 以 /api 结尾时自动去重', () => {
    // 避免 http://localhost:8000/api/api/prices 这种重复路径
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000/api' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });

  it('去除 base 末尾的多余斜杠', () => {
    useAppStore.setState({ apiBaseUrl: 'http://localhost:8000/' });
    expect(buildApiUrl('/api/prices')).toBe('http://localhost:8000/api/prices');
  });
});

/**
 * ApiError 测试集
 * 作用：自定义异常类，用于区分 HTTP 状态码和业务错误信息
 */
describe('ApiError', () => {
  it('保存状态码和错误消息', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
  });
});

/**
 * request 函数测试集（使用 mock fetch）
 * 覆盖场景：正常请求、鉴权头注入、异常响应、401 跳转、超时中断
 */
describe('request with mocked fetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    // 替换全局 fetch 为 mock 版本，便于控制返回值
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    // 重置登录态和 API 配置
    useAuthStore.setState({ token: '', user: null, isLoggedIn: false });
    useAppStore.setState({ apiBaseUrl: '' });
    // 启用假时钟，用于测试 15 秒超时
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('login 发送 POST 并返回登录结果', async () => {
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

  it('logout 发送 POST 请求', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const res = await logout();
    expect(res.ok).toBe(true);
  });

  it('fetchPrices 在 URL 后附加 limit 参数', async () => {
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

  it('存在 token 时自动注入 Authorization 请求头', async () => {
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

  it('非 2xx 响应抛出 ApiError', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'Server fail' }),
    });

    await expect(login('u', 'p')).rejects.toBeInstanceOf(ApiError);
  });

  it('401 时清除登录态并跳转到登录页', async () => {
    useAuthStore.setState({ token: 'old-token', user: { username: 'u', display_name: 'U', role: 'user', auth_source: 'local' }, isLoggedIn: true });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ detail: 'Unauthorized' }),
    });

    await expect(fetchPrices(1)).rejects.toBeInstanceOf(ApiError);
    // 验证登录态已被清除
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().token).toBe('');
    // HashRouter 下通过修改 hash 跳转
    expect(window.location.hash).toBe('#/login');
  });

  it('15 秒无响应自动中断请求', async () => {
    // 模拟一个永不清除的 fetch，用于验证 AbortController 超时逻辑
    fetchMock.mockImplementation((_url: string, options: RequestInit) => {
      return new Promise((_, reject) => {
        if (options.signal) {
          // 监听 abort 事件，触发后拒绝 Promise
          options.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }
      });
    });
    const promise = login('u', 'p');
    // 快进 16 秒，触发 setTimeout 中的 controller.abort()
    vi.advanceTimersByTime(16000);
    await expect(promise).rejects.toThrow('Aborted');
  });
});
