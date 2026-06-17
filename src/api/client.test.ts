import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  login,
  logout,
  fetchPrices,
  buildApiUrl,
  fetchCurrentUser,
  fetchPriceAudits,
  fetchPriceForecastVersions,
  checkPriceQuality,
  previewPriceForecast,
  fetchPriceForecastScenarios,
  comparePriceForecastModels,
  analyzePriceMarketContext,
  fetchMarketPromptTemplate,
  fetchConstraintConfig,
  explainPriceQuality,
  requestParameterTuningAdvice,
  runOptimization,
  fetchDecisionModes,
  recommendDecision,
  runDecisionSensitivity,
  compareDecisions,
  evaluateManualPlan,
  fetchManualSales,
  fetchBacktestRange,
  runBacktestAnalysis,
  runForecastAnalysis,
  generateForecastLlmAdvice,
  generateAdvisorReport,
  fetchAdvisorFeedback,
  fetchAdvisorFeedbackSummary,
  fetchAdvisorFeedbackMonthlySummary,
  explainRecommendation,
  requestConstraintSensitivityExplanation,
  reviewForecastAccuracy,
  requestFeedbackReviewAnalysis,
  runFinanceMarginAnalysis,
} from './client';
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

  it('响应 body 解析失败时使用 statusText 作为错误消息', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => { throw new Error('parse fail'); },
    });

    await expect(login('u', 'p')).rejects.toThrow('Bad Gateway');
  });

  it('响应 body 无 detail 字段时使用 statusText', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({}),
    });

    await expect(login('u', 'p')).rejects.toThrow('Service Unavailable');
  });
});

/**
 * API 导出函数批量调用测试
 * 目的：确保所有 API 函数都能正确构造请求并返回结果
 * 方式：统一 mock fetch 返回 ok，逐一调用并断言 fetch 的 path 和 method
 */
describe('API exports batch tests', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    useAuthStore.setState({ token: '', user: null, isLoggedIn: false });
    useAppStore.setState({ apiBaseUrl: '' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPrices = { liquid_chlorine: 100, hcl31: 200, naclo10: 300, naoh32: 400 };
  const mockProducts = { liquid_chlorine: 10, hcl31: 20, naclo10: 30 };

  it('fetchCurrentUser 调用 /api/auth/me', async () => {
    await fetchCurrentUser();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.any(Object));
  });


  it('fetchPriceAudits 附加 limit 参数', async () => {
    await fetchPriceAudits(50);
    expect(fetchMock).toHaveBeenCalledWith('/api/prices/audits?limit=50', expect.any(Object));
  });

  it('fetchPriceForecastVersions 附加 limit 参数', async () => {
    await fetchPriceForecastVersions(20);
    expect(fetchMock).toHaveBeenCalledWith('/api/prices/forecast-versions?limit=20', expect.any(Object));
  });

  it('checkPriceQuality 附加 threshold 参数', async () => {
    await checkPriceQuality(0.5);
    expect(fetchMock).toHaveBeenCalledWith('/api/prices/quality?daily_change_threshold=0.5', expect.any(Object));
  });




  it('previewPriceForecast 发送只读预览请求', async () => {
    await previewPriceForecast(7);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/prices/forecast/preview');
    expect(call[1].method).toBe('POST');
    const body = JSON.parse(call[1].body as string);
    expect(body.sync_excel).toBe(false);
  });


  it('fetchPriceForecastScenarios 发送 POST', async () => {
    await fetchPriceForecastScenarios(7);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/prices/forecast-scenarios',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('comparePriceForecastModels 发送 POST', async () => {
    await comparePriceForecastModels({
      days: 7,
      lookback_days: 30,
      strategies: ['arima'],
      price_columns: ['液氯_元/吨'],
      common: {},
      rules: {},
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/prices/forecast/model-comparison',
      expect.objectContaining({ method: 'POST' })
    );
  });



  it('analyzePriceMarketContext 发送 POST', async () => {
    await analyzePriceMarketContext('tpl');
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/prices/market-analysis');
    const body = JSON.parse(call[1].body as string);
    expect(body.prompt_template).toBe('tpl');
  });

  it('analyzePriceMarketContext 无模板时 prompt_template 为 null', async () => {
    await analyzePriceMarketContext();
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.prompt_template).toBeNull();
  });

  it('fetchMarketPromptTemplate 调用 GET', async () => {
    await fetchMarketPromptTemplate();
    expect(fetchMock).toHaveBeenCalledWith('/api/prices/market-prompt-template', expect.any(Object));
  });



  it('fetchConstraintConfig 调用 GET', async () => {
    await fetchConstraintConfig();
    expect(fetchMock).toHaveBeenCalledWith('/api/config/constraints', expect.any(Object));
  });


  it('explainPriceQuality 发送 POST', async () => {
    await explainPriceQuality({ issues: [{ severity: 'high' }] });
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/prices/quality-explanation');
    expect(call[1].method).toBe('POST');
  });

  it('requestParameterTuningAdvice 发送 POST', async () => {
    await requestParameterTuningAdvice({ scope: 'solver_weights', current_parameters: {} });
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/config/constraints/tuning-advice');
    expect(call[1].method).toBe('POST');
  });

  it('runOptimization 发送 POST', async () => {
    await runOptimization(1000, mockPrices, 'mode1');
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/optimization/run');
    const body = JSON.parse(call[1].body as string);
    expect(body.naoh_daily).toBe(1000);
  });

  it('runOptimization 无 mode 时 mode 为 null', async () => {
    await runOptimization(1000, mockPrices);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.mode).toBeNull();
  });

  it('fetchDecisionModes 调用 GET', async () => {
    await fetchDecisionModes();
    expect(fetchMock).toHaveBeenCalledWith('/api/decision/modes', expect.any(Object));
  });

  it('recommendDecision 发送 POST', async () => {
    await recommendDecision('mode', 1000, mockPrices);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/decisions/recommend');
    expect(call[1].method).toBe('POST');
  });

  it('runDecisionSensitivity 发送 POST', async () => {
    await runDecisionSensitivity('mode', 1000, mockPrices);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/decisions/sensitivity');
    const body = JSON.parse(call[1].body as string);
    expect(body.shock_percents).toEqual([-10, -5, 0, 5, 10]);
  });

  it('compareDecisions 发送 POST', async () => {
    await compareDecisions(1000, mockPrices);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/decisions/compare',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('evaluateManualPlan 发送 POST', async () => {
    await evaluateManualPlan(1000, mockPrices, mockProducts);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/decisions/manual-evaluation',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetchManualSales 附加 date 参数', async () => {
    await fetchManualSales('2026-01-01');
    expect(fetchMock).toHaveBeenCalledWith('/api/decisions/manual-sales?date=2026-01-01', expect.any(Object));
  });

  it('fetchManualSales 无 date 时不带查询参数', async () => {
    await fetchManualSales();
    expect(fetchMock).toHaveBeenCalledWith('/api/decisions/manual-sales', expect.any(Object));
  });


  it('fetchBacktestRange 调用 GET', async () => {
    await fetchBacktestRange();
    expect(fetchMock).toHaveBeenCalledWith('/api/backtest/range', expect.any(Object));
  });

  it('runBacktestAnalysis 发送 POST', async () => {
    await runBacktestAnalysis('2026-01-01', '2026-01-31');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backtest/analysis',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('runBacktestAnalysis 无日期时参数为 null', async () => {
    await runBacktestAnalysis();
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.start_date).toBeNull();
    expect(body.end_date).toBeNull();
    expect(body.fallback_naoh).toBeNull();
  });

  it('runForecastAnalysis 发送 POST', async () => {
    await runForecastAnalysis(14, 3);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.days).toBe(14);
    expect(body.evaluation_horizon_days).toBe(3);
  });

  it('generateForecastLlmAdvice 发送 POST', async () => {
    await generateForecastLlmAdvice(7);
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/forecast/llm-advice');
    const body = JSON.parse(call[1].body as string);
    expect(body.use_llm).toBe(false);
  });

  it('generateAdvisorReport 发送 POST', async () => {
    await generateAdvisorReport({ messages: [{ role: 'user', content: 'hi' }] });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/advisor/report',
      expect.objectContaining({ method: 'POST' })
    );
  });



  it('fetchAdvisorFeedback 附加 limit 参数', async () => {
    await fetchAdvisorFeedback(20);
    expect(fetchMock).toHaveBeenCalledWith('/api/advisor/feedback?limit=20', expect.any(Object));
  });

  it('fetchAdvisorFeedbackSummary 附加 limit 参数', async () => {
    await fetchAdvisorFeedbackSummary(10);
    expect(fetchMock).toHaveBeenCalledWith('/api/advisor/feedback/summary?limit=10', expect.any(Object));
  });

  it('fetchAdvisorFeedbackMonthlySummary 附加 limit 和 months 参数', async () => {
    await fetchAdvisorFeedbackMonthlySummary(10, 3);
    expect(fetchMock).toHaveBeenCalledWith('/api/advisor/feedback/monthly-summary?limit=10&months=3', expect.any(Object));
  });

  it('explainRecommendation 发送 POST', async () => {
    await explainRecommendation({ decision_name: 'mode', calculation_process: {} });
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/advisor/explain-recommendation');
    expect(call[1].method).toBe('POST');
  });

  it('requestConstraintSensitivityExplanation 发送 POST', async () => {
    await requestConstraintSensitivityExplanation({ decision_name: 'mode', calculation_process: {} });
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/advisor/explain-constraint-sensitivity');
    expect(call[1].method).toBe('POST');
  });

  it('reviewForecastAccuracy 发送 POST', async () => {
    await reviewForecastAccuracy({ evaluation_records: [] });
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/forecast/accuracy-review');
    expect(call[1].method).toBe('POST');
  });

  it('requestFeedbackReviewAnalysis 发送 POST', async () => {
    await requestFeedbackReviewAnalysis({});
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe('/api/advisor/review-feedback');
    expect(call[1].method).toBe('POST');
  });

  it('runFinanceMarginAnalysis 发送 POST', async () => {
    await runFinanceMarginAnalysis('2026-01', '2026-01-01', 1000, mockPrices, mockProducts);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/finance/margin-analysis',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('runFinanceMarginAnalysis 无参数时 body 字段为 null', async () => {
    await runFinanceMarginAnalysis();
    const call = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(call[1].body as string);
    expect(body.month).toBeNull();
    expect(body.decision_date).toBeNull();
    expect(body.naoh_daily).toBeNull();
    expect(body.prices).toBeNull();
    expect(body.system_products).toBeNull();
    expect(body.params).toEqual({});
  });



});
