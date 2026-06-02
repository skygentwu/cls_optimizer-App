// 基于 cls_optimizer/frontend/src/types.ts 复用

export type PricePayload = {
  liquid_chlorine: number;
  hcl31: number;
  naclo10: number;
  naoh32: number;
};

export type ConstraintParams = Record<string, unknown>;

export type ProductPayload = {
  liquid_chlorine: number;
  hcl31: number;
  naclo10: number;
};

export type User = {
  username: string;
  display_name: string;
  role: string;
  auth_source: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type CurrentUserResponse = User;

export type PriceRecord = {
  date: string;
  prices: PricePayload;
  data_flag: string;
  data_source: string;
};

export type PriceTableResponse = {
  source: "database" | "excel" | "unknown";
  total: number;
  records: PriceRecord[];
};

export type OptimizationResponse = {
  products: ProductPayload | null;
  total_margin: number;
  status: string;
  is_optimal: boolean;
};

export type DecisionSensitivityRow = {
  product_key: keyof PricePayload | string;
  product: string;
  shock_pct: number;
  base_price: number;
  adjusted_price: number;
  total_margin: number;
  margin_delta: number;
  status: string;
  is_optimal: boolean;
  recommended_products: ProductPayload | null;
};

export type DecisionSensitivityResponse = {
  decision_name: string;
  base_total_margin: number;
  shock_percents: number[];
  rows: DecisionSensitivityRow[];
  best_case: DecisionSensitivityRow | null;
  worst_case: DecisionSensitivityRow | null;
  conclusion: string;
};

export type DecisionMode = {
  name: string;
  mode: string;
  scenario: string;
  description: string;
  enabled: boolean;
};

export type DecisionRecommendationResponse = {
  decision_name: string;
  status: string;
  is_optimal: boolean;
  products: ProductPayload | null;
  total_margin: number;
  total_product_qty: number;
  total_cl2_usage: number;
  cl2_usage: ProductPayload | null;
  margin_per_cl2: Record<string, number>;
  calculation_process: Record<string, unknown> | null;
  conclusion: string;
  raw: Record<string, unknown>;
};

export type ManualEvaluationResponse = {
  products: ProductPayload;
  cl2_target: number;
  cl2_used: number;
  cl2_diff: number;
  cl2_abs_diff: number;
  is_cl2_balanced: boolean;
  implied_naoh_daily: number;
  max_products: ProductPayload;
  capacity_warnings: Array<Record<string, unknown>>;
  total_margin: number;
  recommendation_diff: number | null;
  recommendation_percent: number | null;
  compare_rows: Array<Record<string, unknown>> | null;
  raw: Record<string, unknown>;
};

export type ManualSalesLoadResponse = {
  source: string;
  date_options: string[];
  selected_date: string | null;
  products: ProductPayload | null;
  naoh_daily: number | null;
  warning: string;
  diagnostics: Array<Record<string, unknown>>;
};

export type PriceRecordUpdateResponse = {
  source: "database" | "excel" | "unknown";
  saved_rows: number;
  audit_rows: number;
  excel_synced: boolean;
  excel_error: string;
  record: PriceRecord;
};

export type PriceBulkUpdateResponse = {
  source: "database" | "excel" | "unknown";
  updated_rows: number;
  saved_rows: number;
  audit_rows: number;
  excel_synced: boolean;
  excel_error: string;
  records: PriceRecord[];
};

export type PriceForecastGenerateResponse = {
  source: "database" | "excel" | "unknown";
  filled_rows: number;
  saved_rows: number;
  forecast_id: string;
  excel_synced: boolean;
  excel_error: string;
  records: PriceRecord[];
};

export type PriceAuditTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type PriceForecastVersionTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type PriceQualityResponse = {
  total: number;
  severity_counts: Record<string, number>;
  records: Array<Record<string, unknown>>;
};

export type BacktestRangeResponse = {
  source: Record<string, string>;
  range: Record<string, string>;
  warning: string;
};

export type BacktestAnalysisResponse = {
  source: Record<string, string>;
  range: Record<string, string>;
  selected: Record<string, unknown>;
  summary: Record<string, unknown>;
  detail_records: Array<Record<string, unknown>>;
  field_notes: Array<Record<string, unknown>>;
  warning: string;
};

export type ForecastAnalysisResponse = {
  source: string;
  forecast_days: number;
  evaluation_horizon_days: number;
  filled_rows: number;
  available_start_date: string | null;
  available_end_date: string | null;
  selected_start_date: string | null;
  selected_end_date: string | null;
  warning: string;
  common: Record<string, unknown>;
  rules: Record<string, unknown>;
  forecast_records: Array<Record<string, unknown>>;
  evaluation_records: Array<Record<string, unknown>>;
  optimization_records: Array<Record<string, unknown>>;
  benefit_trend_records: Array<Record<string, unknown>>;
  output_trend_records: Array<Record<string, unknown>>;
  output_summary: Array<Record<string, unknown>>;
  benefit_summary: Record<string, unknown>;
};

export type ForecastLlmAdviceResponse = {
  used_llm: boolean;
  provider: string;
  answer: string;
  prompt: string;
  process_log: string[];
  llm_error: string;
  context: Record<string, unknown>;
  word_file_name: string;
  word_content_base64: string;
};

export type FinanceMarginAnalysisResponse = {
  months: string[];
  selected_month: string;
  date_options: string[];
  selected_date: string | null;
  price_source: string;
  price_date: string;
  prices: Record<string, number>;
  naoh_daily: number;
  solver_status: string;
  solver_margin: number;
  manual_source: string;
  summary: Record<string, unknown>;
  finance_view: Array<Record<string, unknown>>;
  compare_records: Array<Record<string, unknown>>;
  manual_detail: Array<Record<string, unknown>>;
  system_detail: Array<Record<string, unknown>>;
  warning: string;
};

export type AdvisorMessage = {
  role: string;
  content: string;
};

export type AdvisorReportResponse = {
  session_id: string;
  used_llm: boolean;
  provider: string;
  report: string;
  prompt: string;
  context: Record<string, unknown>;
  process_log: string[];
  llm_error: string;
  word_file_name: string;
  word_content_base64: string;
};

export type AdvisorFeedbackResponse = {
  feedback_id: string;
  message: string;
};

export type AdvisorFeedbackTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type ApcWorkOrderResponse = {
  payload: Record<string, unknown>;
};

export type ApcSendResponse = {
  ok: boolean;
  status: string;
  message: string;
  response_text: string;
  http_status: number | null;
  receipt_validation: Record<string, unknown>;
  payload: Record<string, unknown>;
  process_log: string[];
};

export type AdminTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type AdminMutationResponse = {
  ok: boolean;
  message: string;
  records: Array<Record<string, unknown>>;
};

export type ConstraintConfigResponse = {
  defaults: Record<string, unknown>;
  catalog: Array<Record<string, unknown>>;
  source_hash: string;
};

export type LLMSettingsResponse = {
  provider: string;
  providers: string[];
  provider_values: Record<string, Record<string, unknown>>;
  custom: Record<string, unknown>;
  privacy: Record<string, unknown>;
};

export type LLMConnectionTestResponse = {
  ok: boolean;
  message: string;
};

export type MarketDataConfigResponse = {
  config: Record<string, unknown>;
  warnings: string[];
  connection_status: Array<Record<string, string>>;
  requests: Array<Record<string, unknown>>;
  requirements: Array<Record<string, string>>;
};

export type MarketDataConfigUpdateResponse = {
  ok: boolean;
  message: string;
  config: Record<string, unknown>;
  warnings: string[];
};

export type MarketDataNormalizeResponse = {
  result: Record<string, unknown>;
};

export type PendingApcInstruction = {
  instruction_source: "手工调整";
  products: ProductPayload;
  created_at: string;
  reason: string;
  cl2_target: number;
  cl2_used: number;
  cl2_diff: number;
  total_margin: number;
};
