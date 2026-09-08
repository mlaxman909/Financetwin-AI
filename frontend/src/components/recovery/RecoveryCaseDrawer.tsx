import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  TrendingUp,
  RotateCw,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText,
  User,
  ArrowRight,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { recoveryApi } from '../../api/client';
import { RecoveryCase, CandidateActionEvaluation } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RecoveryCaseDrawerProps {
  caseId: string | null;
  onClose: () => void;
  onActionSuccess?: () => void;
}

export default function RecoveryCaseDrawer({
  caseId,
  onClose,
  onActionSuccess
}: RecoveryCaseDrawerProps) {
  const { hasPermission } = useAuth();
  const [caseData, setCaseData] = useState<RecoveryCase | null>(null);
  const [candidateActions, setCandidateActions] = useState<CandidateActionEvaluation[]>([]);
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showEvidence, setShowEvidence] = useState(true);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      setCandidateActions([]);
      setExecutionResult(null);
      setSimulationResult(null);
      return;
    }

    const fetchCaseDetails = async () => {
      setIsLoading(true);
      try {
        const [detail, simRes, auditRes] = await Promise.all([
          recoveryApi.getCase(caseId),
          recoveryApi.simulateCase(caseId).catch(() => null),
          recoveryApi.getAudit(caseId).catch(() => [])
        ]);

        setCaseData(detail);
        if (simRes && simRes.candidate_actions) {
          setCandidateActions(simRes.candidate_actions);
          if (simRes.selected_action) {
            setSelectedActionType(simRes.selected_action.action_type);
          }
        }
        setAuditLogs(auditRes || []);
      } catch (err) {
        console.error('Failed to fetch case detail in drawer', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!caseId) return null;

  const handleSimulate = async (actionType?: string) => {
    if (!caseId) return;
    setIsSimulating(true);
    try {
      const res = await recoveryApi.simulateCase(caseId, actionType || selectedActionType || undefined);
      setSimulationResult(res);
      if (res.candidate_actions) {
        setCandidateActions(res.candidate_actions);
      }
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecute = async (actionType?: string) => {
    if (!caseId) return;
    setIsExecuting(true);
    try {
      const res = await recoveryApi.executeAction(caseId, actionType || selectedActionType || undefined);
      setExecutionResult(res);
      // Refresh case detail & audit
      const [updatedCase, updatedAudit] = await Promise.all([
        recoveryApi.getCase(caseId),
        recoveryApi.getAudit(caseId).catch(() => [])
      ]);
      setCaseData(updatedCase);
      setAuditLogs(updatedAudit);
      if (onActionSuccess) onActionSuccess();
    } catch (err: any) {
      alert(err?.message || 'Failed to execute recovery action');
    } finally {
      setIsExecuting(false);
    }
  };

  const atRiskAmount = caseData ? Number(caseData.amount_at_risk || 0) : 0;
  const recoveryProb = caseData ? Number(caseData.recovery_probability || 0) : 0;
  const expectedRecovery = atRiskAmount * recoveryProb;

  const selectedActionEval = candidateActions.find((a) => a.action_type === selectedActionType) || candidateActions[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Slide-over Panel (Desktop: 680px right panel, Mobile: Full Screen) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <aside className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Top Bar Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm shadow-md">
                RR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-slate-100">{caseData?.case_id || caseId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {caseData?.recovery_type || 'REVENUE_RISK'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    caseData?.current_status === 'RECOVERED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : caseData?.current_status === 'STOPPED' || caseData?.current_status === 'ESCALATED'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {caseData?.current_status || 'DETECTED'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">
                  Customer: <strong className="text-slate-300">{caseData?.customer_name || caseData?.customer_id || 'Enterprise Entity'}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                <span className="text-xs font-mono text-slate-400">Loading case intelligence...</span>
              </div>
            ) : (
              <>
                {/* 1. AI Recovery Priority & Why This Case First */}
                <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-slate-800 space-y-3.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                        Revenue Recovery Priority
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-black ${
                        caseData?.priority_level === 'P0'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : caseData?.priority_level === 'P1'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : caseData?.priority_level === 'P2'
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {caseData?.priority_level || 'P2'} — {caseData?.priority_level === 'P0' ? 'CRITICAL' : caseData?.priority_level === 'P1' ? 'HIGH' : caseData?.priority_level === 'P2' ? 'MEDIUM' : 'LOW'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {caseData?.priority_score ? Number(caseData.priority_score).toFixed(0) : 0}/100
                      </span>
                    </div>
                  </div>

                  {/* Why This Case First Explanation */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed">
                    <strong className="text-emerald-400 block mb-1 font-mono uppercase text-[10px] tracking-wider">
                      WHY THIS CASE FIRST?
                    </strong>
                    {caseData?.priority_reason ||
                      'Prioritized based on high financial impact, strong recoverability likelihood, and time-critical window.'}
                  </div>

                  {/* 5-Factor Score Breakdown Progress Bars */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Financial Exposure</span>
                      <span className="font-mono font-bold text-slate-200">
                        {caseData?.priority_breakdown?.financial_impact_pct?.toFixed(0) || Math.min(100, Math.round((atRiskAmount / 50000) * 65))}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, caseData?.priority_breakdown?.financial_impact_pct || (atRiskAmount / 50000) * 65)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Recovery Probability</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {caseData?.priority_breakdown?.recovery_probability_pct?.toFixed(0) || Math.round(recoveryProb * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${caseData?.priority_breakdown?.recovery_probability_pct || recoveryProb * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Time Urgency</span>
                      <span className="font-mono font-bold text-amber-400">
                        {caseData?.priority_breakdown?.urgency_score_pct?.toFixed(0) || ((caseData?.urgency_score || 0.6) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${caseData?.priority_breakdown?.urgency_score_pct || (caseData?.urgency_score || 0.6) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Failure Severity ({caseData?.severity || 'MEDIUM'})</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {caseData?.priority_breakdown?.severity_score_pct?.toFixed(0) || ((caseData?.severity_score || 0.6) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${caseData?.priority_breakdown?.severity_score_pct || (caseData?.severity_score || 0.6) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Historical Yield Multiplier</span>
                      <span className="font-mono font-bold text-purple-400">
                        {caseData?.priority_breakdown?.historical_multiplier_pct?.toFixed(0) || ((caseData?.historical_multiplier || 1.0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (caseData?.priority_breakdown?.historical_multiplier_pct || 100) * 0.9)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Core Financial Revenue Triad */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider block">
                      Revenue At Risk
                    </span>
                    <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                      ₹{atRiskAmount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Identified Exposure</span>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                      Recovery Probability
                    </span>
                    <div className="text-lg font-bold font-mono text-teal-300 mt-1">
                      {Math.round(recoveryProb * 100)}%
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">ML Model Estimate</span>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                      Expected Recovery
                    </span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      ₹{Math.round(expectedRecovery).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">At Risk × Probability</span>
                  </div>
                </div>

                {/* 2. Why is this revenue at risk? (Root Cause & Evidence) */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Why is this revenue at risk?
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                      {Math.round((caseData?.diagnosis_confidence || 0.85) * 100)}% Confidence
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                    <strong className="text-emerald-400 block mb-1">Root Cause Diagnosis:</strong>
                    {caseData?.root_cause || 'Temporary payment gateway timeout and banking channel congestion.'}
                  </div>

                  {/* Accordion for Evidence */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowEvidence(!showEvidence)}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 cursor-pointer"
                    >
                      <span className="font-semibold">Diagnostic Facts & Evidence</span>
                      {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showEvidence && (
                      <div className="mt-2 space-y-1.5 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-400">
                        <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                          <span>Previous Recovery Attempts:</span>
                          <span className="font-mono text-slate-200">{caseData?.retry_count || 0} / {caseData?.max_retries_allowed || 3}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                          <span>Reminders Dispatched:</span>
                          <span className="font-mono text-slate-200">{caseData?.reminder_count || 0} / {caseData?.max_reminders_allowed || 3}</span>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-800/50">
                          <span>High-Value Exposure Flag:</span>
                          <span className="font-mono text-slate-200">{atRiskAmount >= 50000 ? 'YES (Threshold >= ₹50k)' : 'NO'}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span>Active Dispute / Chargeback:</span>
                          <span className="font-mono text-slate-200">{caseData?.is_disputed ? 'YES' : 'NONE'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Candidate Recovery Interventions Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Available Recovery Actions</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">Ranked by Expected Recovery</span>
                  </div>

                  <div className="space-y-2">
                    {candidateActions.map((cand) => {
                      const isSelected = selectedActionType === cand.action_type;
                      return (
                        <div
                          key={cand.action_type}
                          onClick={() => setSelectedActionType(cand.action_type)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                              </div>
                              <span className="font-bold text-xs text-slate-200">{cand.label}</span>
                              {cand.is_recommended && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  AI RECOMMENDED
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              cand.policy_status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}>
                              {cand.policy_status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mb-2 pl-5.5">{cand.description}</p>

                          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80 pl-5.5">
                            <div className="text-slate-400">
                              Success Prob: <strong className="text-slate-200">{Math.round(cand.action_success_probability * 100)}%</strong>
                            </div>
                            <div className="text-emerald-400 font-bold">
                              Exp. Recovery: ₹{Math.round(cand.expected_recovery).toLocaleString('en-IN')}
                            </div>
                          </div>

                          {cand.policy_status !== 'APPROVED' && (
                            <div className="mt-2 p-2 bg-rose-950/40 border border-rose-900/60 rounded-lg text-[10px] font-mono text-rose-300 flex items-center gap-1.5">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>Why blocked: {cand.policy_reason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Action Execution & Simulation Controls */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Selected Action Workflow:</span>
                    <span className="text-[10px] font-mono text-slate-500">Autonomous Bounded Execution</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSimulate(selectedActionType || undefined)}
                      disabled={isSimulating || isExecuting}
                      className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sliders className="w-3.5 h-3.5 text-teal-400" />
                      )}
                      <span>Simulate Outcome</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecute(selectedActionType || undefined)}
                      disabled={isExecuting || isSimulating || selectedActionEval?.policy_status !== 'APPROVED'}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      {isExecuting ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>Execute Recovery Action</span>
                    </button>
                  </div>

                  {executionResult && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs font-mono text-emerald-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Action Executed Successfully (Bounded Mode)</span>
                      </div>
                      <div>Status: {executionResult.current_status} | Amount Rescued: ₹{Number(executionResult.amount_recovered || 0).toLocaleString('en-IN')}</div>
                    </div>
                  )}

                  {simulationResult && (
                    <div className="p-3 bg-teal-950/60 border border-teal-800 rounded-xl text-xs font-mono text-teal-300 space-y-1">
                      <div className="font-bold">Simulation Result: {simulationResult.selected_action?.label}</div>
                      <div>Expected Recovery: ₹{Math.round(simulationResult.selected_action?.expected_recovery || 0).toLocaleString('en-IN')} | Policy: {simulationResult.selected_action?.policy_status}</div>
                      <span className="text-[10px] text-teal-400/80 block mt-1">SIMULATED OUTCOME — Bounded what-if calculation.</span>
                    </div>
                  )}
                </div>

                {/* 5. Chronological Audit Trail */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAudit(!showAudit)}
                    className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 cursor-pointer"
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Case Audit Trail ({auditLogs.length} Events)</span>
                    </span>
                    {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showAudit && (
                    <div className="mt-2 space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs max-h-60 overflow-y-auto">
                      {auditLogs.length === 0 ? (
                        <div className="text-slate-500 text-center py-2">No audit events logged yet.</div>
                      ) : (
                        auditLogs.map((log, idx) => (
                          <div key={idx} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="text-emerald-400 font-bold">{log.action}</span>
                              <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-slate-300 text-[11px]">{log.reason || log.decision}</div>
                            <div className="text-[10px] text-slate-500">Actor: {log.actor}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Safe Status */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950 text-[11px] font-mono text-slate-500 flex items-center justify-between shrink-0">
            <span>Policy Guardrail Standard v2.0</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Grounded AI Engine
            </span>
          </div>

        </aside>
      </div>
    </div>
  );
}
