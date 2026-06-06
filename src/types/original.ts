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

export type PriceAuditTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type PriceAuditFilters = {
  limit: number;
  user_id: string;
  price_date: string;
  field_name: string;
  change_type: string;
};

export type DataChangeLogFilters = {
  limit: number;
  log_table_name: string;
  log_action: string;
  log_actor: string;
  log_date: string;
};

export type PriceForecastVersionTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type PriceForecastVersionReviewResponse = {
  ok: boolean;
  forecast_id: string;
  status: string;
  reviewed_at: string;
  reviewer_user_id: string;
  approval_level: string;
  approver: string;
  review_meeting_record: string;
  note: string;
  message: string;
};

export type PriceQualityResponse = {
  total: number;
  severity_counts: Record<string, number>;
  records: Array<Record<string, unknown>>;
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

export type PriceMarketAnalysisResponse = {
  source: "database" | "excel" | "provided" | "unknown";
  used_llm: boolean;
  provider: string;
  prompt_template: string;
  prompt: string;
  signal_records: Array<Record<string, unknown>>;
  suggestions: Record<string, unknown>;
  notes: Array<Record<string, unknown>>;
  process_log: string[];
  llm_error: string;
};

export type PriceMarketPromptTemplateResponse = {
  template: string;
  default_template: string;
  message: string;
};

export type OptimizationResponse = {
  products: ProductPayload | null;
  total_margin: number;
  status: string;
  is_optimal: boolean;
  max_products?: ProductPayload | null;
};

export type DecisionMode = {
  name: string;
  mode: string;
  scenario: string;
  description: string;
  enabled: boolean;
  note?: string;
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
  max_products?: ProductPayload | null;
  raw: Record<string, unknown>;
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

export type AdminTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type AuthAuditSummaryResponse = {
  total: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  action_counts: Record<string, number>;
  latest_record: Record<string, unknown>;
};

export type SSOConfigStatusResponse = {
  auth_provider: string;
  sso_provider: string;
  enabled: boolean;
  configured: boolean;
  missing_required: string[];
  field_status: Array<Record<string, unknown>>;
  message: string;
};

export type AdminMutationResponse = {
  ok: boolean;
  message: string;
  records: Array<Record<string, unknown>>;
};

export type LLMProviderSetting = {
  base_url: string;
  model: string;
  api_key_env: string;
  temperature: number;
  max_tokens: number;
  timeout: number;
  extra_body?: Record<string, unknown>;
  api_key_configured?: boolean;
  api_key_masked?: string;
  constraints?: {
    temperature_locked?: boolean;
    temperature?: number;
    note?: string;
  };
};

export type LLMPrivacySetting = {
  environment: string;
  enabled: boolean;
  mask_numbers: boolean;
  numeric_mode: "scaled" | "opaque";
  audit_enabled: boolean;
  sensitive_terms: string;
  sensitive_terms_configured?: boolean;
  sensitive_terms_count?: number;
};

export type LLMSettingsResponse = {
  provider: string;
  providers: string[];
  provider_values: Record<string, LLMProviderSetting>;
  provider_defaults: Record<string, LLMProviderSetting>;
  custom: LLMProviderSetting;
  custom_default: LLMProviderSetting;
  privacy: LLMPrivacySetting;
};

export type LLMConnectionTestResponse = {
  ok: boolean;
  message: string;
  process_log: string[];
  effective: Record<string, unknown>;
};

export type ConstraintConfigResponse = {
  defaults: Record<string, unknown>;
  catalog: Array<Record<string, unknown>>;
  source_hash: string;
  constraint_catalog: Array<Record<string, unknown>>;
  max_negative_price: number;
  min_product_components: Record<string, number>;
  synced_at?: string;
};

export type ConstraintUpdateResponse = {
  source_file: string;
  source_hash: string;
  actor: string;
  changes: Array<Record<string, unknown>>;
  preview_markdown: string;
  message: string;
};

export type ConstraintSourceValidateResponse = {
  ok: boolean;
  message: string;
  constraint_count: number;
  registry_count: number;
  decision_mode_count: number;
  meta: Record<string, string>;
  errors: string[];
};

export type ConstraintSourceUploadResponse = {
  ok: boolean;
  message: string;
  config?: ConstraintConfigResponse;
  source_hash: string;
  synced_at: string;
  changes: Array<Record<string, unknown>>;
};

export type DataAdminTableInfo = {
  table_name: string;
  label: string;
  columns: string[];
  excel_path: string;
  editable: boolean;
  importable: boolean;
};

export type DataAdminTablesResponse = {
  tables: DataAdminTableInfo[];
};

export type DataAdminTablePreviewResponse = {
  table_name: string;
  label: string;
  total: number;
  columns: string[];
  records: Array<Record<string, unknown>>;
};

export type DataAdminImportResponse = {
  table_name: string;
  imported_rows: number;
  message: string;
  action?: string;
};

export type DataAdminExportResponse = {
  table_name: string;
  file_name: string;
  content_base64: string;
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

export type MarketDataNormalizeRequest = {
  provider: string;
  product: string;
  metric: string;
  payload: unknown;
};

export type MarketDataNormalizeResponse = {
  result: Record<string, unknown>;
};

export type MarketDataCollectResponse = {
  ok: boolean;
  dry_run: boolean;
  summary: Record<string, unknown>;
  process_log: string[];
  results: Array<Record<string, unknown>>;
};

export type ApcWorkOrderRequest = {
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
  latest_forecast_version: Record<string, unknown>;
  benefit_summary: {
    has_optimal_result?: boolean;
    analysis_days?: number;
    cumulative_profit?: number;
    avg_profit?: number;
    negative_days?: number;
    leading_product?: string;
    primary_output?: string;
    avg_plan?: Record<string, number>;
    best_row?: Record<string, unknown>;
    worst_row?: Record<string, unknown>;
    tone?: string;
    [key: string]: unknown;
  };
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

export type BacktestAnalysisResponse = {
  source: Record<string, string>;
  range: Record<string, string>;
  selected: Record<string, unknown>;
  summary: {
    has_results?: boolean;
    total_system?: number;
    total_manual?: number;
    total_diff?: number;
    uplift_pct?: number;
    positive_days?: number;
    total_days?: number;
    win_rate?: number;
    avg_diff?: number;
    avg_cl2_gap?: number;
    conclusion?: string;
    conclusion_level?: string;
    [key: string]: unknown;
  };
  detail_records: Array<Record<string, unknown>>;
  field_notes: Array<Record<string, unknown>>;
  warning: string;
};

export type BacktestRangeResponse = {
  source: Record<string, string>;
  range: Record<string, string>;
  warning: string;
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
  summary: {
    manual_total?: number;
    system_total?: number;
    diff?: number;
    conclusion?: string;
    conclusion_level?: string;
    priority_products?: string[];
    [key: string]: unknown;
  };
  finance_view: Array<Record<string, unknown>>;
  compare_records: Array<Record<string, unknown>>;
  manual_detail: Array<Record<string, unknown>>;
  system_detail: Array<Record<string, unknown>>;
  warning: string;
};

export type AdvisorMessage = {
  role: "user" | "assistant" | "system";
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

export type AdvisorWordExportResponse = {
  file_name: string;
  content_base64: string;
  message: string;
};

export type AdvisorFeedbackResponse = {
  feedback_id: string;
  message: string;
};

export type AdvisorFeedbackTableResponse = {
  total: number;
  records: Array<Record<string, unknown>>;
};

export type AdvisorFeedbackSummaryResponse = {
  total: number;
  status_counts: Record<string, number>;
  adopted_count: number;
  pending_count: number;
  adoption_rate: number;
  latest_feedback: Record<string, unknown>;
};

export type AdvisorFeedbackMonthlySummaryResponse = {
  total: number;
  months: Array<Record<string, unknown>>;
  latest_month: Record<string, unknown>;
};
