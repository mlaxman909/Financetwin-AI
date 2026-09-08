import { LivePipelineRequest, LivePipelineResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options?.headers);
  if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Automatically attach active authenticated user context headers for backend RBAC
  try {
    const savedUser = localStorage.getItem('revenuerescue_active_user') || localStorage.getItem('financetwin_active_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.email) {
        headers.set('X-User-Email', user.email);
      }
      if (user.role) {
        headers.set('X-User-Role', user.role);
      }
    }
  } catch (e) {
    // Ignore localStorage parse errors in non-browser environments
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) {
        errorMessage = parsed.detail;
      }
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// Recovery API Endpoints
// ==========================================

import type {
  RecoveryCase,
  RecoveryAction,
  RecoveryMetrics,
  BatchSummary,
  RecoveryPolicy,
  CaseSimulationResult,
  LeakageSummaryResponse,
  RecoveryIntelligenceResponse,
  RecoveryLearningResponse
} from '../types';

export const recoveryApi = {
  getCases: (params?: {
    status?: string;
    recovery_type?: string;
    severity?: string;
    is_high_value?: boolean;
    skip?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.recovery_type) query.set('recovery_type', params.recovery_type);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.is_high_value !== undefined) query.set('is_high_value', String(params.is_high_value));
    if (params?.skip !== undefined) query.set('skip', String(params.skip));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiFetch<RecoveryCase[]>(`/api/recovery/cases${qs ? `?${qs}` : ''}`);
  },

  getCase: (caseId: string) => {
    return apiFetch<RecoveryCase>(`/api/recovery/cases/${caseId}`);
  },

  detectCases: () => {
    return apiFetch<{ created_cases: string[]; count: number }>(`/api/recovery/detect`, {
      method: 'POST'
    });
  },

  diagnoseCase: (caseId: string) => {
    return apiFetch<{ case_id: string; root_cause: string; confidence: number; evidence: any }>(
      `/api/recovery/diagnose/${caseId}`,
      { method: 'POST' }
    );
  },

  decideAction: (caseId: string) => {
    return apiFetch<{ case_id: string; recommended_action: string; priority_score: number; probability: number }>(
      `/api/recovery/decide/${caseId}`,
      { method: 'POST' }
    );
  },

  executeAction: (caseId: string, actionType?: string, parameters?: Record<string, any>) => {
    return apiFetch<{
      case_id: string;
      action_id: string;
      action_type: string;
      outcome_status: string;
      amount_recovered: number;
      policy_passed: boolean;
      policy_denial_reason?: string;
      current_status: string;
    }>(`/api/recovery/execute/${caseId}`, {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, parameters: parameters || {} })
    });
  },

  simulateCase: (caseId: string, actionType?: string) => {
    return apiFetch<CaseSimulationResult>(`/api/recovery/cases/${caseId}/simulate${actionType ? `?action_type=${actionType}` : ''}`, {
      method: 'POST'
    });
  },

  runBatch: (cases?: any[]) => {
    return apiFetch<BatchSummary>(`/api/recovery/batch/run`, {
      method: 'POST',
      body: cases ? JSON.stringify({ cases }) : undefined
    });
  },

  getMetrics: () => {
    return apiFetch<RecoveryMetrics>(`/api/recovery/metrics`);
  },

  getLeakage: () => {
    return apiFetch<LeakageSummaryResponse>(`/api/recovery/leakage`);
  },

  getIntelligence: () => {
    return apiFetch<RecoveryIntelligenceResponse>(`/api/recovery/intelligence`);
  },

  getLearning: () => {
    return apiFetch<RecoveryLearningResponse>(`/api/recovery/learning`);
  },

  getAudit: (caseId: string) => {
    return apiFetch<any[]>(`/api/recovery/audit/${caseId}`);
  },

  getPolicies: () => {
    return apiFetch<RecoveryPolicy>(`/api/recovery/policies`);
  },

  simulatePolicies: (policyUpdates: Partial<RecoveryPolicy>) => {
    return apiFetch<any>(`/api/recovery/policies/simulate`, {
      method: 'POST',
      body: JSON.stringify(policyUpdates)
    });
  },

  applyPolicies: (policyUpdates: Partial<RecoveryPolicy>) => {
    return apiFetch<any>(`/api/recovery/policies/apply`, {
      method: 'POST',
      body: JSON.stringify(policyUpdates)
    });
  },

  runLivePipeline: (req: LivePipelineRequest) => {
    return apiFetch<LivePipelineResponse>(`/api/recovery/live-pipeline/run`, {
      method: 'POST',
      body: JSON.stringify(req)
    });
  },

  // ── AI Recovery Priority Engine Endpoints ──
  getPriorityQueue: (params?: {
    priority_level?: string;
    recovery_type?: string;
    status?: string;
    recommended_action?: string;
    severity?: string;
    min_amount?: number;
    max_amount?: number;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
          query.set(k, String(v));
        }
      });
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return apiFetch<any>(`/api/recovery/priority-queue${qStr}`);
  },

  getPrioritySummary: () => {
    return apiFetch<any>(`/api/recovery/priority-summary`);
  },

  getRecoverNext: () => {
    return apiFetch<any>(`/api/recovery/recover-next`);
  },

  recalculatePriorities: () => {
    return apiFetch<any>(`/api/recovery/recalculate-priorities`, {
      method: 'POST'
    });
  },

  recalculateCasePriority: (caseId: string) => {
    return apiFetch<any>(`/api/recovery/cases/${caseId}/recalculate-priority`, {
      method: 'POST'
    });
  }
};

// ==========================================
// Assistant / AI Copilot API
// ==========================================

export interface AssistantChatResponse {
  reply: string;
  intent?: string;
  facts?: Array<{ label: string; value: string }>;
  recommendations?: string[];
  suggested_actions?: string[];
  deep_link?: string;
  related_metrics?: Record<string, any>;
  live_context?: Record<string, any>;
  structured_cards?: Array<Record<string, any>>;
  confidence?: number;
}

export const assistantApi = {
  chat: (
    message: string,
    history: Array<{ role: string; content: string }> = [],
    currentPage?: string,
    role?: string,
    transactionId?: string
  ) => {
    return apiFetch<AssistantChatResponse>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        current_page: currentPage || window.location.pathname,
        role: role || 'ADMIN',
        transaction_id: transactionId
      })
    });
  },

  getContext: () => {
    return apiFetch<Record<string, any>>('/api/assistant/context');
  },

  getSuggestions: () => {
    return apiFetch<{ categories: Array<{ name: string; prompt: string }> }>('/api/assistant/suggestions');
  }
};




