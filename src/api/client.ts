/**
 * 移动端统一 HTTP 客户端
 * 基于原生 fetch 封装，所有后端 API 调用集中在此文件
 *
 * 特性：
 * - 自动注入 JWT Authorization Header（从 authStore 读取）
 * - 15 秒请求超时（AbortController）
 * - 401 自动清除登录态并跳转登录页
 * - API Base URL 动态拼接，支持开发代理/模拟器/生产环境
 */

import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";
import type {
  AgentChatMessage,
  AgentChatResult,
  AgentRecentQuestionsResponse,
  AdvisorFeedbackMonthlySummaryResponse,
  AdvisorFeedbackSummaryResponse,
  AdvisorFeedbackTableResponse,
  AdvisorReportResponse,
  BacktestAnalysisResponse,
  BacktestRangeResponse,
  ConstraintConfigResponse,
  ConstraintParams,
  ConstraintSensitivityExplanationResponse,
  CurrentUserResponse,
  DecisionMode,
  DecisionComparisonResponse,
  DecisionRecommendationResponse,
  DecisionSensitivityResponse,
  FeedbackReviewAnalysisResponse,
  FinanceMarginAnalysisResponse,
  ForecastAccuracyReviewResponse,
  ForecastAnalysisResponse,
  ForecastLlmAdviceResponse,
  InventoryRecord,
  LoginResponse,
  MarketDataConfigResponse,
  ManualEvaluationResponse,
  ManualSalesLoadResponse,
  NotificationEvent,
  OptimizationResponse,
  ParameterTuningAdviceResponse,
  ParameterTuningScope,
  PriceForecastModelComparisonRequest,
  PriceForecastModelComparisonResponse,
  PriceForecastPreviewResponse,
  PriceForecastScenarioRequest,
  PriceForecastScenarioResponse,
  PriceMarketAnalysisResponse,
  PriceMarketPromptTemplateResponse,
  PricePayload,
  PriceQualityExplanationResponse,
  PriceQualityResponse,
  PriceTableResponse,
  ProductPayload,
  RecommendationExplanationResponse,
} from "@/types";

/**
 * 获取当前配置的 API 基础地址
 * 优先级：appStore.apiBaseUrl > 环境变量 VITE_API_BASE_URL > 空字符串
 */
const getApiBase = () => useAppStore.getState().apiBaseUrl || "";

/**
 * 拼接完整的请求 URL
 * - 无 base 时直接返回 path（开发环境走 Vite proxy）
 * - base 以 /api 结尾且 path 以 /api/ 开头时自动去重，避免 /api/api/xxx
 * - 去除 base 末尾多余斜杠
 */
export function buildApiUrl(path: string): string {
  const base = String(getApiBase()).replace(/\/+$/, "");
  if (!base) {
    return path;
  }
  if (base.endsWith("/api") && path.startsWith("/api/")) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
}

/**
 * 自定义 API 异常类
 * 用于区分 HTTP 状态码和业务错误信息，上层可通过 err.status 判断错误类型
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiEnvelope<T> {
  code: number;
  data: T;
  msg: string;
  requestId: string;
}

/**
 * 通用请求函数（所有 API 的底层封装）
 * - 自动读取 token 注入 Authorization
 * - 默认 15 秒超时；LLM/分析类路径放宽至 60 秒（见 timeoutForPath）
 * - 401 时自动清除登录态并跳转到 #/login
 * - 网络异常时通过 finally 确保 timer 被清理，避免内存泄漏
 */
// 慢请求路径（LLM/分析类）使用更长超时，避免被默认 15s 误杀；其余保持 15s。
const SLOW_PATH_HINTS = ["/advisor/", "/llm-advice", "/market-analysis", "/tuning-advice", "/accuracy-review", "/review-feedback", "/explain-", "/agent/"];
function timeoutForPath(path: string): number {
  return SLOW_PATH_HINTS.some((p) => path.includes(p)) ? 60000 : 15000;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutForPath(path));
  try {
    const response = await fetch(buildApiUrl(path), {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      // 401 且非登录接口：清除登录态并跳转，避免死循环
      if (response.status === 401 && !path.includes('/auth/login')) {
        useAuthStore.getState().clearAuth();
        window.location.hash = '#/login';
        throw new ApiError(response.status, '登录已过期');
      }
      throw new ApiError(response.status, body.detail ?? response.statusText);
    }
    const json = await response.json();
    if (json !== null && typeof json === "object" && "code" in json && "data" in json) {
      const envelope = json as ApiEnvelope<T>;
      if (envelope.code !== 200) {
        throw new ApiError(response.status, envelope.msg ?? "服务端业务错误");
      }
      return envelope.data;
    }
    return json as T;
  } finally {
    // 无论成功或异常，都必须清理定时器，防止 AbortController 被长期引用
    clearTimeout(timer);
  }
}

// ==================== 认证 ====================

export function login(username: string, password: string) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function fetchCurrentUser() {
  return request<CurrentUserResponse>("/api/auth/me");
}
// ==================== 价格数据 ====================

export function fetchPrices(limit = 30) {
  return request<PriceTableResponse>(`/api/prices?limit=${limit}`);
}

export function fetchPriceAudits(limit = 100) {
  return request<{ total: number; records: unknown[] }>(`/api/prices/audits?limit=${limit}`);
}

export function fetchPriceForecastVersions(limit = 50) {
  return request<{ total: number; records: unknown[] }>(`/api/prices/forecast-versions?limit=${limit}`);
}

export function checkPriceQuality(dailyChangeThreshold = 0.2) {
  return request<PriceQualityResponse>(`/api/prices/quality?daily_change_threshold=${dailyChangeThreshold}`);
}

export function explainPriceQuality(payload: {
  issues: Array<Record<string, unknown>>;
  severity_counts?: Record<string, unknown> | null;
  threshold_pct?: number | null;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<PriceQualityExplanationResponse>("/api/prices/quality-explanation", {
    method: "POST",
    body: JSON.stringify({
      issues: payload.issues,
      severity_counts: payload.severity_counts ?? null,
      threshold_pct: payload.threshold_pct ?? null,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}
export function previewPriceForecast(
  days: number,
  common: Record<string, unknown> = {},
  rules: Record<string, Record<string, unknown>> = {}
) {
  return request<PriceForecastPreviewResponse>("/api/prices/forecast/preview", {
    method: "POST",
    body: JSON.stringify({ days, sync_excel: false, common, rules }),
  });
}

export type ForecastAdjustment = {
  product: "liquid_chlorine" | "hcl31" | "naclo10" | "naoh32";
  price_date: string;
  old_value: number | null;
  new_value: number | null;
  reason: string;
};
export function fetchPriceForecastScenarios(
  days: number,
  common: Record<string, unknown> = {},
  rules: Record<string, Record<string, unknown>> = {}
) {
  return request<PriceForecastScenarioResponse>("/api/prices/forecast-scenarios", {
    method: "POST",
    body: JSON.stringify({ days, common, rules } satisfies PriceForecastScenarioRequest),
  });
}

export function comparePriceForecastModels(payload: PriceForecastModelComparisonRequest) {
  return request<PriceForecastModelComparisonResponse>("/api/prices/forecast/model-comparison", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function analyzePriceMarketContext(promptTemplate?: string) {
  return request<PriceMarketAnalysisResponse>("/api/prices/market-analysis", {
    method: "POST",
    body: JSON.stringify({ prompt_template: promptTemplate ?? null }),
  });
}

export function fetchMarketPromptTemplate() {
  return request<PriceMarketPromptTemplateResponse>("/api/prices/market-prompt-template");
}
// ==================== 参数设定 ====================

export function fetchConstraintConfig() {
  return request<ConstraintConfigResponse>("/api/config/constraints");
}

export function fetchConstraintVersions(limit = 50) {
  return request<{ total: number; records: Array<Record<string, unknown>> }>(
    `/api/config/constraints/versions?limit=${limit}`
  );
}

export function fetchConstraintVersion(id: number) {
  return request<Record<string, unknown>>(`/api/config/constraints/versions/${encodeURIComponent(String(id))}`);
}
export function requestParameterTuningAdvice(payload: {
  scope: ParameterTuningScope;
  current_parameters: Record<string, unknown>;
  context_metrics?: Record<string, unknown> | null;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<ParameterTuningAdviceResponse>("/api/config/constraints/tuning-advice", {
    method: "POST",
    body: JSON.stringify({
      scope: payload.scope,
      current_parameters: payload.current_parameters,
      context_metrics: payload.context_metrics ?? null,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}

// ==================== 最优推荐 ====================

export function runOptimization(
  naohDaily: number,
  prices: PricePayload,
  mode?: string,
  params?: ConstraintParams
) {
  return request<OptimizationResponse>("/api/optimization/run", {
    method: "POST",
    body: JSON.stringify({
      naoh_daily: naohDaily,
      prices,
      mode: mode || null,
      params: params ?? {},
    }),
  });
}

export function fetchDecisionModes() {
  return request<DecisionMode[]>("/api/decision/modes");
}

export function recommendDecision(
  decisionName: string,
  naohDaily: number,
  prices: PricePayload,
  params?: ConstraintParams
) {
  return request<DecisionRecommendationResponse>("/api/decisions/recommend", {
    method: "POST",
    body: JSON.stringify({
      decision_name: decisionName,
      naoh_daily: naohDaily,
      prices,
      params: params ?? {},
    }),
  });
}

export function runDecisionSensitivity(
  decisionName: string,
  naohDaily: number,
  prices: PricePayload,
  params?: ConstraintParams,
  shockPercents: number[] = [-10, -5, 0, 5, 10]
) {
  return request<DecisionSensitivityResponse>("/api/decisions/sensitivity", {
    method: "POST",
    body: JSON.stringify({
      decision_name: decisionName,
      naoh_daily: naohDaily,
      prices,
      params: params ?? {},
      shock_percents: shockPercents,
    }),
  });
}

export function compareDecisions(
  naohDaily: number,
  prices: PricePayload,
  params?: ConstraintParams
) {
  return request<DecisionComparisonResponse>("/api/decisions/compare", {
    method: "POST",
    body: JSON.stringify({ naoh_daily: naohDaily, prices, params: params ?? {} }),
  });
}

export function explainRecommendation(payload: {
  decision_name: string;
  calculation_process: Record<string, unknown>;
  products?: Record<string, number> | null;
  total_margin?: number | null;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<RecommendationExplanationResponse>("/api/advisor/explain-recommendation", {
    method: "POST",
    body: JSON.stringify({
      decision_name: payload.decision_name,
      calculation_process: payload.calculation_process,
      products: payload.products ?? null,
      total_margin: payload.total_margin ?? null,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}

export function requestConstraintSensitivityExplanation(payload: {
  decision_name: string;
  calculation_process: Record<string, unknown>;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<ConstraintSensitivityExplanationResponse>("/api/advisor/explain-constraint-sensitivity", {
    method: "POST",
    body: JSON.stringify({
      decision_name: payload.decision_name,
      calculation_process: payload.calculation_process,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}

// ==================== 手动模拟 ====================

export function evaluateManualPlan(
  naohDaily: number,
  prices: PricePayload,
  products: ProductPayload,
  recommendationProducts?: ProductPayload | null,
  recommendationTotalMargin?: number | null,
  params?: ConstraintParams
) {
  return request<ManualEvaluationResponse>("/api/decisions/manual-evaluation", {
    method: "POST",
    body: JSON.stringify({
      naoh_daily: naohDaily,
      prices,
      products,
      recommendation_products: recommendationProducts ?? null,
      recommendation_total_margin: recommendationTotalMargin ?? null,
      params: params ?? {},
    }),
  });
}

export function fetchManualSales(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<ManualSalesLoadResponse>(`/api/decisions/manual-sales${query}`);
}

// ==================== 库存数据 ====================

export function fetchInventory(limit = 365) {
  return request<{ total: number; records: InventoryRecord[] }>(`/api/inventory?limit=${limit}`);
}
export function fetchInventoryAudits(
  filters: { limit?: number; user_id?: string; inventory_date?: string; product?: string } = {}
) {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 100));
  for (const key of ["user_id", "inventory_date", "product"] as const) {
    const value = String(filters[key] ?? "").trim();
    if (value) {
      params.set(key, value);
    }
  }
  return request<{ total: number; records: Array<Record<string, unknown>> }>(
    `/api/inventory/audits?${params.toString()}`
  );
}

export function fetchInventoryCapacity() {
  return request<{ capacity: Record<string, number> }>("/api/inventory/capacity");
}

// ==================== 回测 ====================

export function fetchBacktestRange() {
  return request<BacktestRangeResponse>("/api/backtest/range");
}

export function runBacktestAnalysis(
  startDate?: string,
  endDate?: string,
  fallbackNaoh?: number,
  normalizeManual = true,
  fitManual = true,
  params?: ConstraintParams
) {
  return request<BacktestAnalysisResponse>("/api/backtest/analysis", {
    method: "POST",
    body: JSON.stringify({
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      fallback_naoh: fallbackNaoh ?? null,
      normalize_manual: normalizeManual,
      fit_manual: fitManual,
      params: params ?? {},
    }),
  });
}

// ==================== 预测分析 ====================

export function runForecastAnalysis(
  days = 30,
  evaluationHorizonDays = 7,
  startDate?: string,
  endDate?: string,
  naohDaily?: number,
  params?: ConstraintParams
) {
  return request<ForecastAnalysisResponse>("/api/forecast/analysis", {
    method: "POST",
    body: JSON.stringify({
      days,
      evaluation_horizon_days: evaluationHorizonDays,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      naoh_daily: naohDaily ?? null,
      params: params ?? {},
    }),
  });
}

export function generateForecastLlmAdvice(
  days = 30,
  startDate?: string,
  endDate?: string,
  naohDaily?: number,
  params?: ConstraintParams,
  useLlm = false,
  provider?: string
) {
  return request<ForecastLlmAdviceResponse>("/api/forecast/llm-advice", {
    method: "POST",
    body: JSON.stringify({
      days,
      start_date: startDate ?? null,
      end_date: endDate ?? null,
      naoh_daily: naohDaily ?? null,
      params: params ?? {},
      use_llm: useLlm,
      provider: provider ?? null,
    }),
  });
}

export function reviewForecastAccuracy(payload: {
  evaluation_records: Array<Record<string, unknown>>;
  summary?: Record<string, unknown> | null;
  detail_records?: Array<Record<string, unknown>> | null;
  field_notes?: Array<Record<string, unknown>> | null;
  horizon_days?: number | null;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<ForecastAccuracyReviewResponse>("/api/forecast/accuracy-review", {
    method: "POST",
    body: JSON.stringify({
      evaluation_records: payload.evaluation_records,
      summary: payload.summary ?? null,
      detail_records: payload.detail_records ?? null,
      field_notes: payload.field_notes ?? null,
      horizon_days: payload.horizon_days ?? null,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}

// ==================== 经营建议/报告 ====================

export function generateAdvisorReport(payload: {
  messages?: { role: string; content: string }[];
  decision_name?: string;
  opt_products?: ProductPayload | null;
  opt_total_margin?: number | null;
  use_llm?: boolean;
  provider?: string;
}) {
  return request<AdvisorReportResponse>("/api/advisor/report", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function fetchAdvisorFeedback(limit = 50) {
  return request<AdvisorFeedbackTableResponse>(`/api/advisor/feedback?limit=${limit}`);
}

export function fetchAdvisorFeedbackSummary(limit = 50) {
  return request<AdvisorFeedbackSummaryResponse>(`/api/advisor/feedback/summary?limit=${limit}`);
}

export function fetchAdvisorFeedbackMonthlySummary(limit = 50, months = 6) {
  return request<AdvisorFeedbackMonthlySummaryResponse>(`/api/advisor/feedback/monthly-summary?limit=${limit}&months=${months}`);
}

export function requestFeedbackReviewAnalysis(payload: {
  feedback_summary?: Record<string, unknown> | null;
  feedback_monthly_summary?: Record<string, unknown> | null;
  feedback_records?: Array<Record<string, unknown>> | null;
  use_llm?: boolean | null;
  provider?: string | null;
}) {
  return request<FeedbackReviewAnalysisResponse>("/api/advisor/review-feedback", {
    method: "POST",
    body: JSON.stringify({
      feedback_summary: payload.feedback_summary ?? null,
      feedback_monthly_summary: payload.feedback_monthly_summary ?? null,
      feedback_records: payload.feedback_records ?? null,
      use_llm: payload.use_llm ?? null,
      provider: payload.provider ?? null,
    }),
  });
}

// ==================== APC 宸ュ崟 ====================
// ==================== 边际贡献 ====================

export function runFinanceMarginAnalysis(
  month?: string,
  decisionDate?: string,
  naohDaily?: number,
  prices?: PricePayload,
  systemProducts?: ProductPayload,
  params?: ConstraintParams
) {
  return request<FinanceMarginAnalysisResponse>("/api/finance/margin-analysis", {
    method: "POST",
    body: JSON.stringify({
      month: month ?? null,
      decision_date: decisionDate ?? null,
      naoh_daily: naohDaily ?? null,
      prices: prices ?? null,
      system_products: systemProducts ?? null,
      params: params ?? {},
    }),
  });
}

// ==================== 外部商情与通知 ====================

export function fetchMarketDataConfig() {
  return request<MarketDataConfigResponse>("/api/market-data/config");
}

export function fetchDefaultMarketDataConfig() {
  return request<MarketDataConfigResponse>("/api/market-data/default-config");
}
export function fetchMarketObservations(
  filters: { observed_date?: string; product?: string; metric?: string; source?: string; limit?: number } = {}
) {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 500));
  for (const key of ["observed_date", "product", "metric", "source"] as const) {
    const value = String(filters[key] ?? "").trim();
    if (value) params.set(key, value);
  }
  return request<{ total: number; records: Array<Record<string, unknown>> }>(
    `/api/market-data/observations?${params.toString()}`
  );
}

export function fetchMarketDataDiff(observedDate: string, metric = "price", product?: string) {
  const params = new URLSearchParams({ observed_date: observedDate, metric });
  if (product) params.set("product", product);
  return request<{ by_source: Record<string, number>; spread: number; source_count: number }>(
    `/api/market-data/diff?${params.toString()}`
  );
}

export function subscribeNotifications(onEvent: (event: NotificationEvent) => void): () => void {
  const token = useAuthStore.getState().token;
  const controller = new AbortController();
  (async () => {
    try {
      const response = await fetch(buildApiUrl("/api/notifications/stream"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:") && currentEvent === "notification") {
            try {
              onEvent(JSON.parse(line.slice(5)) as NotificationEvent);
            } catch {
              // Ignore malformed SSE events; the stream can continue.
            }
          } else if (line === "") {
            currentEvent = "";
          }
        }
      }
    } catch {
      // Connection cancelled or interrupted; callers can resubscribe.
    }
  })();
  return () => controller.abort();
}

export async function streamLlmPost<T>(
  path: string,
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  onToolStep?: (step: Record<string, unknown>) => void
): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    if (response.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.hash = "#/login";
    }
    throw new ApiError(response.status, errBody.msg ?? errBody.detail ?? response.statusText);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError(500, "SSE 响应体为空");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const data = line.slice(5);
        if (currentEvent === "chunk") {
          onChunk(data);
        } else if (currentEvent === "tool_step") {
          if (onToolStep) {
            try {
              onToolStep(JSON.parse(data) as Record<string, unknown>);
            } catch {
              // Ignore malformed tool step events.
            }
          }
        } else if (currentEvent === "result") {
          await reader.cancel();
          return JSON.parse(data) as T;
        }
      } else if (line === "") {
        currentEvent = "";
      }
    }
  }

  throw new ApiError(500, "SSE 流结束时未收到 result 事件");
}

export function streamAgentChat(
  question: string,
  history: AgentChatMessage[],
  onChunk: (text: string) => void,
  onToolStep: (step: Record<string, unknown>) => void
) {
  return streamLlmPost<AgentChatResult>(
    "/api/agent/chat/stream",
    { question, history },
    onChunk,
    onToolStep
  );
}

export function fetchAgentRecentQuestions() {
  return request<AgentRecentQuestionsResponse>("/api/agent/recent-questions");
}
