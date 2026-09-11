import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  PlayCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Sliders,
  DollarSign,
  AlertCircle,
  Cpu
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { recoveryApi } from '../api/client';
import { RecoveryCase, PrioritySummaryResponse, RecoverNextResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import RecoveryCaseDrawer from '../components/recovery/RecoveryCaseDrawer';

export default function RecoveryPriorityQueue() {
  const navigate = useNavigate();
  const { currentUser, hasPermission } = useAuth();

  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [summary, setSummary] = useState<PrioritySummaryResponse | null>(null);
  const [recoverNext, setRecoverNext] = useState<RecoverNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isExecutingNext, setIsExecutingNext] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters & Sorting State
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCases, setTotalCases] = useState(0);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const [queueRes, summaryRes, nextRes] = await Promise.all([
        recoveryApi.getPriorityQueue({
          priority_level: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          recommended_action: actionFilter !== 'ALL' ? actionFilter : undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
          search: searchTerm ? searchTerm : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          page_size: pageSize
        }),
        recoveryApi.getPrioritySummary(),
        recoveryApi.getRecoverNext()
      ]);

      setCases(queueRes.items || []);
      setTotalCases(queueRes.total || 0);
      setSummary(summaryRes);
      setRecoverNext(nextRes);
    } catch (err: any) {
      console.error('Failed to load priority queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, [priorityFilter, statusFilter, actionFilter, severityFilter, sortBy, sortOrder, page, searchTerm]);

  const handleRecalculatePriorities = async () => {
    setIsRecalculating(true);
    try {
      const res = await recoveryApi.recalculatePriorities();
      setToastMsg(`Priorities recalculated across ${res.total_recalculated} cases using active multi-factor policy.`);
      setTimeout(() => setToastMsg(null), 5000);
      await fetchQueueData();
    } catch (err: any) {
      console.error('Recalculation error:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleExecuteRecoverNext = async () => {
    if (!recoverNext?.case) return;
    setIsExecutingNext(true);
    try {
      const caseId = recoverNext.case.case_id;
      const actionType = recoverNext.recommended_action || recoverNext.case.recommended_action;
      await recoveryApi.executeAction(caseId, actionType || undefined);
      setToastMsg(`Executed ${actionType || 'Recovery'} on Case ${caseId}. Queue updated.`);
      setTimeout(() => setToastMsg(null), 5000);
      await fetchQueueData();
    } catch (err: any) {
      console.error('Recover next execution failed:', err);
    } finally {
      setIsExecutingNext(false);
    }
  };

  const formatINR = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const getPriorityBadgeClass = (level?: string) => {
    switch (level) {
      case 'P0':
        return 'bg-rose-950/90 text-rose-300 border-rose-700/80 shadow-rose-950/50 shadow-sm font-black';
      case 'P1':
        return 'bg-amber-950/90 text-amber-300 border-amber-700/80 shadow-amber-950/50 shadow-sm font-black';
      case 'P2':
        return 'bg-blue-950/90 text-blue-300 border-blue-700/80 font-bold';
      case 'P3':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700 font-medium';
    }
  };

  const getPriorityScoreBg = (score: number) => {
    if (score >= 85) return 'from-rose-500 to-amber-500 text-white';
    if (score >= 70) return 'from-amber-500 to-yellow-500 text-slate-950';
    if (score >= 40) return 'from-blue-500 to-cyan-500 text-slate-950';
    return 'from-slate-600 to-slate-700 text-slate-200';
  };

  return (
    <PageContainer
      title="AI Recovery Priority Queue"
      onRefresh={fetchQueueData}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Message Notification */}
        {toastMsg && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-700/80 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200 shadow-xl transition-all">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Top Header & Core Judge Prompt Banner ── */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    REVENUE RECOVERY QUEUE
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      LIVE AI SCORING
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400">AI-ranked opportunities for recovering revenue at risk.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl mt-3 text-xs text-slate-300 leading-relaxed font-sans">
                <span className="font-semibold text-emerald-400 block mb-0.5">
                  "RevenueRescue AI doesn't just tell you where revenue was lost. It tells you what to recover first."
                </span>
                <span className="text-slate-400 text-[11px]">
                  Priority is intelligently ranked on <strong>Financial Impact × Recoverability × Urgency × Risk</strong> — rather than simply sorting transactions by amount.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start lg:self-center shrink-0">
              <button
                onClick={handleRecalculatePriorities}
                disabled={isRecalculating}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Priorities'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Top Summary KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>TOTAL REVENUE AT RISK</span>
              <DollarSign className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-slate-100 font-mono">
              {summary ? formatINR(summary.total_revenue_at_risk) : '—'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="font-mono text-slate-300">{summary?.total_cases || 0}</span> total detected cases
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>HIGH PRIORITY (P0 + P1)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {summary ? formatINR(summary.high_priority_revenue_at_risk) : '—'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="font-bold text-rose-400">{summary?.p0_cases || 0} P0</span> Critical + <span className="font-bold text-amber-400">{summary?.p1_cases || 0} P1</span> High
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>ESTIMATED RECOVERABLE</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {summary ? formatINR(summary.estimated_recoverable_revenue) : '—'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="font-bold text-emerald-400 font-mono">{summary?.average_recovery_probability.toFixed(0) || 0}%</span> avg probability
            </div>
          </div>

          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>CASES REQUIRING ACTION</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {summary?.cases_requiring_manual_action || 0}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              Requires human sign-off / workflow review
            </div>
          </div>
        </div>

        {/* ── "RECOVER NEXT" Highlight Hero Card ── */}
        {recoverNext?.eligible && recoverNext.case && (
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-600/70 rounded-2xl shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    NEXT BEST RECOVERY OPPORTUNITY
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityBadgeClass(recoverNext.case.priority_level)}`}>
                    {recoverNext.case.priority_level || 'P0'} CRITICAL
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    CASE: {recoverNext.case.case_id}
                  </h3>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatINR(recoverNext.case.amount_at_risk)} at risk
                  </span>
                  <span className="text-xs text-slate-400">
                    Priority: <strong className="text-slate-100 font-mono">{recoverNext.case.priority_score?.toFixed(1)}/100</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Recovery Probability: <strong className="text-emerald-400 font-mono">{((recoverNext.case.recovery_probability || 0.5) * 100).toFixed(0)}%</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-4xl">
                  {recoverNext.why_first_reason}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSelectedCaseId(recoverNext.case?.case_id || null)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  View Breakdown
                </button>
                <button
                  onClick={handleExecuteRecoverNext}
                  disabled={isExecutingNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50"
                >
                  <PlayCircle className={`w-4 h-4 ${isExecutingNext ? 'animate-spin' : ''}`} />
                  <span>{isExecutingNext ? 'Executing...' : `START RECOVERY (${recoverNext.recommended_action || 'AUTO'})`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters & Sorting Bar ── */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case ID, transaction, customer, root cause..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans font-semibold"
              >
                <option value="priority_score">AI Priority (Recommended)</option>
                <option value="amount_at_risk">Revenue at Risk</option>
                <option value="recovery_probability">Recovery Probability</option>
                <option value="urgency_score">Urgency</option>
                <option value="severity">Severity</option>
                <option value="created_at">Age / Creation Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono font-bold"
                title="Toggle Sort Order"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Priority Tier:
            </span>
            {['ALL', 'P0', 'P1', 'P2', 'P3'].map((tier) => (
              <button
                key={tier}
                onClick={() => setPriorityFilter(tier)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priorityFilter === tier
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tier === 'ALL' ? 'All Priority' : tier}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            <span className="text-[11px] font-bold text-slate-400 mr-1">Status:</span>
            {['ALL', 'DETECTED', 'DIAGNOSED', 'ACTION_EXECUTED', 'RECOVERED', 'ESCALATED', 'STOPPED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* ── AI Priority Queue Table / Cards ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">
                AI PRIORITY QUEUE ({totalCases} Cases Ranked)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Page {page} of {Math.ceil(totalCases / pageSize) || 1}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-semibold">Calculating Multi-Factor Recovery Priorities...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">No cases match the selected filters</p>
              <p className="text-xs text-slate-500">Try adjusting priority tier or clearing search parameters.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {cases.map((c) => (
                <div
                  key={c.case_id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Priority Tier & Score Pill */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 text-center space-y-1">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded border w-full text-center ${getPriorityBadgeClass(c.priority_level)}`}>
                        {c.priority_level || 'P2'}
                      </span>
                      <div className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-center">
                        <span className="text-xs font-black font-mono text-slate-200">
                          {c.priority_score ? Number(c.priority_score).toFixed(0) : 0}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">/100</span>
                      </div>
                    </div>

                    {/* Case Metadata */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-sm font-bold text-slate-100 font-mono">{c.case_id}</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {formatINR(c.amount_at_risk)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {c.recovery_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Severity: <strong className="text-slate-200">{c.severity}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-1 font-sans">
                        {c.priority_reason || c.root_cause || 'Prioritized based on multi-factor revenue recovery model.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                        <span>
                          Recovery Prob: <strong className="text-emerald-400 font-mono">{((c.recovery_probability || 0.5) * 100).toFixed(0)}%</strong>
                        </span>
                        <span>
                          Urgency: <strong className="text-slate-200 font-mono">{((c.urgency_score || 0.5) * 100).toFixed(0)}%</strong>
                        </span>
                        <span>
                          Status: <strong className="text-slate-300">{c.current_status}</strong>
                        </span>
                        {c.customer_id && (
                          <span>
                            Customer: <strong className="text-slate-300 font-mono">{c.customer_id}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action & Detail Trigger */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500 uppercase font-mono font-semibold">Recommended</div>
                      <div className="text-xs font-bold text-slate-200">
                        {c.recommended_action || 'START_RECOVERY'}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCaseId(c.case_id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>View Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recovery Funnel Story Section ── */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">REVENUE RECOVERY FUNNEL</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">1. DETECTED</div>
              <div className="text-base font-bold text-slate-200 font-mono">
                {summary ? formatINR(summary.funnel.revenue_detected) : '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">2. AT RISK</div>
              <div className="text-base font-bold text-rose-400 font-mono">
                {summary ? formatINR(summary.funnel.revenue_at_risk) : '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">3. RECOVERABLE</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {summary ? formatINR(summary.funnel.recoverable_revenue) : '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">4. HIGH PRIORITY</div>
              <div className="text-base font-bold text-amber-400 font-mono">
                {summary ? formatINR(summary.funnel.high_priority_revenue) : '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">5. IN PROGRESS</div>
              <div className="text-base font-bold text-cyan-400 font-mono">
                {summary ? formatINR(summary.funnel.recovery_in_progress) : '—'}
              </div>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase">6. RECOVERED</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {summary ? formatINR(summary.funnel.recovered_revenue) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Slide-in Case Detail & Score Breakdown Drawer ── */}
        <RecoveryCaseDrawer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onActionSuccess={() => {
            fetchQueueData();
          }}
        />
      </div>
    </PageContainer>
  );
}
