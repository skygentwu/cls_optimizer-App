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
  CurrentUserResponse,
  DecisionMode,
  DecisionRecommendationResponse,
  DecisionSensitivityResponse,
  FinanceMarginAnalysisResponse,
  ForecastAnalysisResponse,
  ForecastLlmAdviceResponse,
  LoginResponse,
  ManualEvaluationResponse,
  ManualSalesLoadResponse,
  OptimizationResponse,
  PricePayload,
  PriceBulkUpdateResponse,
  PriceForecastGenerateResponse,
  PriceQualityResponse,
  PriceRecordUpdateResponse,
  PriceTableResponse,
  ProductPayload,
  ConstraintParams,
  BacktestRangeResponse,
  BacktestAnalysisResponse,
  PriceForecastVersionReviewResponse,
  PriceMarketAnalysisResponse,
  PriceMarketPromptTemplateResponse,
  AdvisorReportResponse,
  AdvisorWordExportResponse,
  AdvisorFeedbackResponse,
  AdvisorFeedbackTableResponse,
  AdvisorFeedbackSummaryResponse,
  AdvisorFeedbackMonthlySummaryResponse,
  ConstraintConfigResponse,
  ConstraintUpdateResponse,
  ConstraintSourceValidateResponse,
  ConstraintSourceUploadResponse,
  ApcWorkOrderResponse,
  ApcSendResponse,
} from "@/types";

/**
 * 获取当前配置的 API 基础地址
 * 优先级：appStore.apiBaseUrl > 环境变量 VITE_API_BASE_URL > 空字符串
 */
const getApiBase = () => useAppStore.getState().apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "";

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

/**
 * 通用请求函数（所有 API 的底层封装）
 * - 自动读取 token 注入 Authorization
 * - 15 秒超时中断（防止后端长时间计算导致页面假死）
 * - 401 时自动清除登录态并跳转到 #/login
 * - 网络异常时通过 finally 确保 timer 被清理，避免内存泄漏
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
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
        return Promise.reject(new ApiError(response.status, '登录已过期'));
      }
      throw new ApiError(response.status, body.detail ?? response.statusText);
    }
    return response.json() as Promise<T>;
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

export function updateCurrentUser(payload: { display_name?: string; password?: string }) {
  return request<CurrentUserResponse>("/api/auth/me/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function updatePriceRecord(
  date: string,
  prices: PricePayload,
  dataFlag = "手动修改",
  dataSource = "App手动修改",
  syncExcel = true,
  note = "App价格修改"
) {
  return request<PriceRecordUpdateResponse>(`/api/prices/${date}`, {
    method: "PUT",
    body: JSON.stringify({
      date,
      prices,
      data_flag: dataFlag,
      data_source: dataSource,
      note,
      sync_excel: syncExcel,
    }),
  });
}

export function bulkUpdatePriceRecords(
  records: Array<{ date: string; prices: PricePayload; data_flag: string; data_source: string }>,
  note = "价格数据页批量维护",
  syncExcel = true
) {
  return request<PriceBulkUpdateResponse>("/api/prices/bulk", {
    method: "PUT",
    body: JSON.stringify({
      records,
      note,
      sync_excel: syncExcel,
    }),
  });
}

export function generatePriceForecast(
  days: number,
  syncExcel = true,
  common: Record<string, unknown> = {},
  rules: Record<string, unknown> = {}
) {
  return request<PriceForecastGenerateResponse>("/api/prices/forecast", {
    method: "POST",
    body: JSON.stringify({ days, sync_excel: syncExcel, common, rules }),
  });
}

export function reviewPriceForecastVersion(
  forecastId: string,
  status: string,
  note?: string,
  approvalLevel?: string,
  approver?: string,
  reviewMeetingRecord?: string
) {
  return request<PriceForecastVersionReviewResponse>(`/api/prices/forecast-versions/${forecastId}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status,
      note: note ?? null,
      approval_level: approvalLevel ?? null,
      approver: approver ?? null,
      review_meeting_record: reviewMeetingRecord ?? null,
    }),
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

export function saveMarketPromptTemplate(template: string) {
  return request<PriceMarketPromptTemplateResponse>("/api/prices/market-prompt-template", {
    method: "POST",
    body: JSON.stringify({ template }),
  });
}

export function resetMarketPromptTemplate() {
  return request<PriceMarketPromptTemplateResponse>("/api/prices/market-prompt-template/reset", {
    method: "POST",
  });
}

// ==================== 参数设定 ====================

export function fetchConstraintConfig() {
  return request<ConstraintConfigResponse>("/api/config/constraints");
}

export function previewConstraintUpdate(params: {
  content: string;
  filename?: string;
  actor?: string;
}) {
  return request<ConstraintUpdateResponse>("/api/config/constraints/preview-update", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function commitConstraintUpdate(params: {
  content: string;
  filename?: string;
  actor?: string;
}) {
  return request<ConstraintUpdateResponse>("/api/config/constraints/commit-update", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function validateConstraintSource(content: string) {
  return request<ConstraintSourceValidateResponse>("/api/config/constraints/validate-source", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function uploadConstraintSource(content: string, filename?: string) {
  return request<ConstraintSourceUploadResponse>("/api/config/constraints/upload-source", {
    method: "POST",
    body: JSON.stringify({ content, filename: filename ?? null }),
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
      params: params ?? null,
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
      params: params ?? null,
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
      params: params ?? null,
      shock_percents: shockPercents,
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
      params: params ?? null,
    }),
  });
}

export function fetchManualSales(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<ManualSalesLoadResponse>(`/api/decisions/manual-sales${query}`);
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
      params: params ?? null,
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
      params: params ?? null,
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
      params: params ?? null,
      use_llm: useLlm,
      provider: provider ?? null,
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

export function exportAdvisorWord(payload: {
  messages?: { role: string; content: string }[];
  decision_name?: string;
  opt_products?: ProductPayload | null;
  opt_total_margin?: number | null;
  use_llm?: boolean;
  provider?: string;
}) {
  return request<AdvisorWordExportResponse>("/api/advisor/export-word", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveAdvisorFeedback(payload: {
  session_id?: string;
  report?: string;
  rating?: number;
  comment?: string;
  adopted?: boolean;
  meeting_minutes?: string;
  responsible_department?: string;
  execution_result?: string;
  benefit_deviation?: string;
  parameter_adjustment_suggestion?: string;
  attachment_refs?: string[];
  approval_level?: string;
  approver?: string;
  approval_status?: string;
  report_type?: string;
}) {
  return request<AdvisorFeedbackResponse>("/api/advisor/feedback", {
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

// ==================== APC 工单 ====================

export function previewApcWorkOrder(payload: {
  products: ProductPayload;
  prices: PricePayload;
  naoh_daily: number;
  total_margin: number;
  solver_status: string;
  decision_mode: string;
  instruction_source: string;
  params?: ConstraintParams | null;
  plant_code: string;
  unit_code: string;
  plan_date?: string;
  remark: string;
  manual_adjustment_reason: string;
  endpoint: string;
  api_token?: string;
  timeout: number;
  dry_run: boolean;
  receipt_field_aliases?: Record<string, string[] | string>;
}) {
  return request<ApcWorkOrderResponse>("/api/apc/work-orders/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendApcWorkOrder(payload: {
  products: ProductPayload;
  prices: PricePayload;
  naoh_daily: number;
  total_margin: number;
  solver_status: string;
  decision_mode: string;
  instruction_source: string;
  params?: ConstraintParams | null;
  plant_code: string;
  unit_code: string;
  plan_date?: string;
  remark: string;
  manual_adjustment_reason: string;
  endpoint: string;
  api_token?: string;
  timeout: number;
  dry_run: boolean;
  receipt_field_aliases?: Record<string, string[] | string>;
}) {
  return request<ApcSendResponse>("/api/apc/work-orders/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

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
      params: params ?? null,
    }),
  });
}
