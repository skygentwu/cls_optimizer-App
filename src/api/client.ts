// 基于 cls_optimizer/frontend/src/api/client.ts 复用，适配移动端

import { useAuthStore } from "@/stores/authStore";
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
} from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function buildApiUrl(path: string): string {
  const base = String(API_BASE).replace(/\/+$/, "");
  if (!base) {
    return path;
  }
  if (base.endsWith("/api") && path.startsWith("/api/")) {
    return `${base}${path.slice(4)}`;
  }
  return `${base}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.includes('/auth/login')) {
      useAuthStore.getState().clearAuth();
      window.location.reload();
    }
    throw new ApiError(response.status, body.detail ?? response.statusText);
  }
  return response.json() as Promise<T>;
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

export function generatePriceForecast(days: number, syncExcel = true) {
  return request<PriceForecastGenerateResponse>("/api/prices/forecast", {
    method: "POST",
    body: JSON.stringify({ days, sync_excel: syncExcel }),
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
