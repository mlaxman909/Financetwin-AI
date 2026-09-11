export type UserRole =
  | 'RECOVERY_OPERATOR'
  | 'RECOVERY_MANAGER'
  | 'RECOVERY_ADMIN';


export interface DemoUser {
  email: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  organization: string;
  permissions: string[];
}

export interface Payment {
  id: number;
  payment_id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  settlement_batch_id: number | null;
}

export interface SettlementBatch {
  id: number;
  settlement_id: string;
  merchant_id: string;
  gross_amount: number;
  gateway_fee: number;
  fee_tax: number;
  refunds: number;
  adjustments: number;
  reserves: number;
  net_amount: number;
  settlement_date: string;
  expected_credit_date: string;
  status: 'PENDING' | 'MATCHED' | 'EXCEPTION' | 'ABSTAINED' | 'UNMATCHED';
  utr: string | null;
  created_at: string;
}

export interface BankTransaction {
  id: number;
  bank_transaction_id: string;
  reference: string;
  credit_amount: number;
  debit_amount: number;
  transaction_date: string;
  description: string;
  balance: number;
  source: string;
  created_at: string;
}

export interface ReconciliationRun {
  id: number;
  run_id: string;
  started_at: string;
  completed_at: string | null;
  total_settlements: number;
  matched_count: number;
  abstained_count: number;
  exception_count: number;
  created_at: string;
}

export interface ReconciliationMatch {
  id: number;
  reconciliation_run_id: number;
  settlement_batch_id: number;
  bank_transaction_id: number | null;
  match_type: string;
  confidence: number;
  second_best_confidence: number | null;
  confidence_margin: number | null;
  matching_pass: number;
  decision: 'MATCH' | 'ABSTAIN' | 'NO_MATCH' | 'EXCEPTION';
  explainability_json: {
    pass_0_integrity_passed?: boolean;
    rejection_reason?: string | null;
    scoring_pass?: number;
    selected_candidate_id?: string | null;
    second_best_score?: number;
    confidence_margin?: number;
    required_margin?: number;
    candidate_scores?: Array<{
      tx_id: string;
      score: number;
      breakdown: {
        reference: number;
        amount: number;
        date: number;
        metadata: number;
      };
    }>;
  };
  created_at: string;
  settlement_batch: SettlementBatch;
  bank_transaction: BankTransaction | null;
}

export interface ExceptionRecord {
  id: number;
  exception_id: string;
  reconciliation_run_id: number;
  settlement_batch_id: number | null;
  bank_transaction_id: number | null;
  exception_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expected_amount: number;
  actual_amount: number;
  variance: number;
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED' | 'MANUAL_REVIEW';
  anomaly_score: number | null;
  cluster_id: number | null;
  created_at: string;
  settlement_batch?: SettlementBatch;
  bank_transaction?: BankTransaction;
}

export interface AuditLogEntry {
  id?: number;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  decision: string;
  reason: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ExceptionDetail {
  exception_id: string;
  exception_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED' | 'MANUAL_REVIEW';
  expected_amount: number;
  actual_amount: number;
  variance: number;
  anomaly_score: number | null;
  cluster_id: number | null;
  created_at: string;
  settlement_batch: {
    settlement_id: string;
    merchant_id: string;
    gross_amount: number;
    net_amount: number;
    utr: string | null;
    settlement_date: string;
    expected_credit_date: string;
  } | null;
  bank_transaction: {
    bank_transaction_id: string;
    reference: string;
    credit_amount: number;
    transaction_date: string;
    description: string;
    source: string;
  } | null;
  match_details: {
    match_type: string;
    confidence: number;
    explainability: ReconciliationMatch['explainability_json'];
  };
  ai_investigation: {
    exception_type: string;
    root_cause: string;
    investigation_confidence: number;
    evidence_ids: string[];
    recommended_action: string;
    explanation: string;
  } | null;
  audit_history: AuditLogEntry[];
  risk_decision: {
    score: number;
    recommended_action: string;
  };
}

export interface DashboardSummary {
  total_settlements: number;
  matched_count: number;
  abstained_count: number;
  no_match_count: number;
  exception_count: number;
  match_rate: number;
  precision: number | null;
  recall: number;
  false_match_rate: number | null;
  coverage: number;
  auto_resolution_rate: number;
  financial_amount_at_risk: number;
}

export interface Policy {
  minimum_match_confidence: number;
  minimum_confidence_margin: number;
  max_auto_resolve_amount: number;
  high_value_transaction_threshold: number;
  amount_tolerance: number;
  date_tolerance_days: number;
  tax_rate: number;
  severity_weight_low: number;
  severity_weight_medium: number;
  severity_weight_high: number;
  severity_weight_critical: number;
}

export interface PolicyImpactMetrics {
  match_count: number;
  abstain_count: number;
  exception_count: number;
  manual_review_count: number;
  auto_resolve_count: number;
  coverage: number;
  false_match_rate: number | null;
  financial_amount_at_risk: number;
}

export interface PolicySimulationResponse {
  before: PolicyImpactMetrics;
  after: PolicyImpactMetrics;
}

export interface Anomaly {
  exception_id: string;
  exception_type: string;
  severity: string;
  expected_amount: number;
  actual_amount: number;
  variance: number;
  anomaly_score: number;
  anomaly_flag: number;
  cluster_id: number;
}

export interface Cluster {
  cluster_id: number;
  size: number;
  pattern: string;
  exceptions: Array<{
    exception_id: string;
    exception_type: string;
    severity: string;
    expected_amount: number;
    actual_amount: number;
    variance: number;
  }>;
}

// ==========================================
// RevenueRescue AI — Recovery Types
// ==========================================

export type RecoveryCaseStatus =
  | 'DETECTED'
  | 'DIAGNOSED'
  | 'PRIORITIZED'
  | 'ACTION_SELECTED'
  | 'POLICY_CHECKED'
  | 'ACTION_EXECUTED'
  | 'WAITING_FOR_OUTCOME'
  | 'RECOVERED'
  | 'RETRY'
  | 'STOPPED'
  | 'ESCALATED'
  | 'UNRECOVERABLE'
  | 'EXPIRED';

export type RecoveryType =
  | 'PAYMENT_FAILURE'
  | 'CHECKOUT_ABANDONMENT'
  | 'OVERDUE_RECEIVABLE'
  | 'MANDATE_FAILURE'
  | 'SUBSCRIPTION_FAILURE'
  | 'SETTLEMENT_SHORTFALL';

export interface RecoveryAction {
  id: number;
  action_id: string;
  case_id: string;
  action_type: string;
  action_sequence: number;
  parameters: Record<string, any>;
  policy_checked: boolean;
  policy_passed: boolean;
  policy_denial_reason?: string | null;
  executed_at?: string | null;
  execution_mode: 'SIMULATED' | 'LIVE';
  outcome_status: string;
  outcome_notes?: string | null;
  amount_recovered: number;
  cost_incurred: number;
  audit_hash?: string | null;
  created_at: string;
}

export interface ScoreBreakdown {
  financial_impact_pct: number;
  recovery_probability_pct: number;
  urgency_score_pct: number;
  severity_score_pct: number;
  historical_multiplier_pct: number;
  weights?: {
    financial: number;
    probability: number;
    urgency: number;
    severity: number;
  };
}

export interface RecoveryCase {
  id: number;
  case_id: string;
  source_exception_id?: string | null;
  source_transaction_id?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  merchant_id?: string | null;
  recovery_type: RecoveryType | string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  amount_at_risk: number;
  amount_recovered: number;
  root_cause: string;
  diagnosis_confidence: number;
  diagnosis_evidence?: {
    evidence?: string[];
    suggested_action?: string;
    details?: string;
    [key: string]: any;
  };
  recovery_probability: number;
  
  // AI Priority Engine Fields
  priority_score: number;
  priority_level?: 'P0' | 'P1' | 'P2' | 'P3' | string;
  financial_impact_score?: number | null;
  urgency_score?: number | null;
  severity_score?: number | null;
  historical_multiplier?: number | null;
  priority_reason?: string | null;
  priority_breakdown?: ScoreBreakdown | null;
  priority_calculated_at?: string | null;

  recommended_action?: string | null;
  action_reason?: string | null;
  current_status: RecoveryCaseStatus | string;
  attempt_count?: number;
  retry_count?: number;
  max_retries_allowed?: number;
  reminder_count?: number;
  max_reminders_allowed?: number;
  days_overdue?: number | null;
  workflow_started_at?: string | null;
  workflow_expires_at?: string | null;
  last_action_at?: string | null;
  next_retry_at?: string | null;
  is_high_value?: boolean;
  has_dispute?: boolean;
  is_disputed?: boolean;
  promise_to_pay_date?: string | null;
  promise_to_pay_misses?: number;
  assigned_to?: string | null;
  escalation_reason?: string | null;
  anomaly_score?: number | null;
  audit_hash?: string | null;
  created_at: string;
  updated_at?: string | null;
  actions?: RecoveryAction[];
}

export interface PriorityQueueSummary {
  p0_count: number;
  p1_count: number;
  p2_count: number;
  p3_count: number;
  total_cases: number;
  total_revenue_at_risk: number;
  high_priority_revenue: number;
  estimated_recoverable_revenue: number;
  average_recovery_probability: number;
  cases_requiring_action: number;
}

export interface PriorityQueueResponse {
  items: RecoveryCase[];
  total: number;
  page: number;
  page_size: number;
  summary: PriorityQueueSummary;
}

export interface PrioritySummaryResponse {
  total_cases: number;
  p0_cases: number;
  p1_cases: number;
  p2_cases: number;
  p3_cases: number;
  total_revenue_at_risk: number;
  high_priority_revenue_at_risk: number;
  estimated_recoverable_revenue: number;
  recovered_revenue: number;
  recovery_rate_pct: number;
  average_recovery_probability: number;
  cases_requiring_manual_action: number;
  highest_priority_case?: RecoveryCase | null;
  recommended_next_action?: string | null;
  funnel: {
    revenue_detected: number;
    revenue_at_risk: number;
    recoverable_revenue: number;
    high_priority_revenue: number;
    recovery_in_progress: number;
    recovered_revenue: number;
  };
  priority_distribution: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
}

export interface RecoverNextResponse {
  eligible: boolean;
  case?: RecoveryCase | null;
  why_first_reason?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  recommended_action?: string | null;
  message?: string | null;
}

export interface RecoveryMetrics {
  total_revenue_at_risk?: number;
  total_at_risk?: number;
  total_amount_recovered?: number;
  total_recovered?: number;
  recovery_rate_pct?: number;
  active_recovery_cases?: number;
  active_cases?: number;
  total_cases?: number;
  cases_recovered?: number;
  recovered_cases?: number;
  cases_escalated?: number;
  escalated_cases?: number;
  cases_stopped?: number;
  stopped_cases?: number;
  cases_in_progress?: number;
  in_progress_cases?: number;
  avg_recovery_time_hours?: number;
  avg_time_to_recovery_hours?: number;
  by_type?: Record<string, { count: number; at_risk: number; recovered: number; recovery_rate_pct?: number }>;
  by_intervention?: Record<string, any>;
  by_severity?: Record<string, { count: number; at_risk: number; recovered: number }>;
  funnel?: {
    detected: number;
    diagnosed: number;
    actioned: number;
    recovered: number;
    detected_amt?: number;
    recovered_amt?: number;
  };
  human_attention_queue?: any[];
}

export interface BatchSummary {
  batch_size: number;
  total_at_risk: number;
  total_recovered: number;
  in_progress_amount: number;
  stopped_amount: number;
  escalated_amount: number;
  unrecovered_amount: number;
  recovery_rate_pct: number;
  cases_recovered: number;
  cases_stopped: number;
  cases_escalated: number;
  cases_in_progress: number;
  by_type: Record<string, any>;
  all_results: any[];
}

export interface RecoveryPolicy {
  max_payment_retries: number;
  max_customer_reminders: number;
  max_workflow_duration_days: number;
  high_value_escalation_threshold: number;
  max_promise_to_pay_misses: number;
  retry_cooldown_hours: number;
}

export interface CandidateActionEvaluation {
  action_type: string;
  label: string;
  description: string;
  recovery_probability: number;
  action_success_probability: number;
  combined_probability: number;
  amount_at_risk: number;
  expected_recovery: number;
  policy_status: 'APPROVED' | 'BLOCKED' | 'REQUIRES_APPROVAL';
  policy_reason: string;
  is_recommended: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CaseSimulationResult {
  case_id: string;
  amount_at_risk: number;
  root_cause: string;
  selected_action: CandidateActionEvaluation;
  candidate_actions: CandidateActionEvaluation[];
  is_simulated: boolean;
  timestamp: string;
}

export interface LeakageCategory {
  category_key: string;
  title: string;
  description: string;
  cases_count: number;
  amount_at_risk: number;
  amount_recovered: number;
  recoverable_amount: number;
  recovery_rate_pct: number;
  benchmark_recovery_pct: number;
  trend: string;
  trend_direction: 'up' | 'down';
}

export interface LeakageSummaryResponse {
  categories: LeakageCategory[];
  total_at_risk: number;
  total_recovered: number;
  total_recoverable: number;
  net_recovery_rate_pct: number;
}

export interface ActionBenchmark {
  action_type: string;
  name: string;
  channel: string;
  total_executed: number;
  success_count: number;
  success_rate_pct: number;
  amount_recovered: number;
  avg_recovery_time_hours: number;
}

export interface IntelligenceTrendPoint {
  date: string;
  revenue_at_risk: number;
  expected_recovery: number;
  actual_recovered: number;
  recovery_rate_pct: number;
}

export interface RecoveryIntelligenceResponse {
  action_benchmarks: ActionBenchmark[];
  timeline_trends: IntelligenceTrendPoint[];
  learning_loop_status: string;
  model_confidence_index: number;
  sample_size: number;
}

export interface LearningInsight {
  insight_id: string;
  title: string;
  observation: string;
  recommendation: string;
}

export interface RecoveryLearningResponse {
  learning_engine: string;
  total_cases_evaluated: number;
  successful_recoveries_count: number;
  total_revenue_rescued: number;
  overall_learning_efficiency_pct: number;
  observed_insights: LearningInsight[];
  top_performing_intervention: string;
  least_effective_intervention: string;
}

export interface LivePipelineStep {
  step_number: number;
  name: string;
  status: 'LOCKED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  timestamp: string;
  summary: string;
  data: Record<string, any>;
}

export interface LivePipelineRequest {
  customer_id: string;
  transaction_id: string;
  amount: number;
  currency?: string;
  payment_status: string;
  failure_reason: string;
  execution_mode?: string;
}

export interface LivePipelineResponse {
  run_id: string;
  customer_id: string;
  transaction_id: string;
  amount: number;
  final_status: string;
  is_recovered: boolean;
  recovered_amount: number;
  remaining_risk: number;
  strategy: string;
  channel: string;
  audit_id: string;
  steps: LivePipelineStep[];
}



