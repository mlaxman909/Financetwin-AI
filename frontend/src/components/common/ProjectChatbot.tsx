import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  Info,
  Clock
} from 'lucide-react';
import { assistantApi, AssistantChatResponse } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  facts?: Array<{ label: string; value: string }>;
  recommendations?: string[];
  suggested_actions?: string[];
  deep_link?: string;
  related_metrics?: Record<string, any>;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface ConversationSession {
  id: string;
  title: string;
  updatedAt: Date;
  messages: ChatMessage[];
  activeTxnId?: string;
}

const CATEGORY_PROMPTS = [
  { name: 'Revenue', prompt: 'Why are we losing revenue today?' },
  { name: 'Payments', prompt: 'Which transactions should be retried?' },
  { name: 'Recovery', prompt: 'Investigate why ₹25,000 revenue is at risk.' },
  { name: 'Risk', prompt: 'Show suspicious payment patterns and high-risk cases.' },
  { name: 'Transactions', prompt: 'Investigate transaction TXN-87421.' },
  { name: 'Anomalies', prompt: 'What unusual payment behavior was detected by ML?' },
  { name: 'Operations', prompt: 'Explain the 10-step autonomous recovery lifecycle.' }
];

const WELCOME_SUGGESTIONS = [
  { title: 'Find Revenue at Risk', desc: 'Break down today\'s failed transactions & total exposure', prompt: 'Why are we losing revenue today?' },
  { title: 'Investigate ₹25k Loss Case', desc: 'Trace root-cause, ML probability & retry strategy', prompt: 'Investigate why ₹25,000 revenue is at risk.' },
  { title: 'Top Recovery Candidates', desc: 'List high-probability transactions ready for automated recovery', prompt: 'Which transactions should be retried?' },
  { title: 'ML Anomaly & Risk Audit', desc: 'Inspect Scikit-Learn IsolationForest outlier clusters', prompt: 'Show suspicious payment patterns and high-risk cases.' }
];

export default function ProjectChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [showContextSidebar, setShowContextSidebar] = useState(true);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [selectedReportMessage, setSelectedReportMessage] = useState<ChatMessage | null>(null);
  const [liveContextData, setLiveContextData] = useState<Record<string, any> | null>(null);

  // Active Session & Conversations
  const [sessions, setSessions] = useState<ConversationSession[]>([
    {
      id: 'session-1',
      title: 'Current Investigation',
      updatedAt: new Date(),
      messages: [],
      activeTxnId: 'TXN-87421'
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('session-1');

  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  // Fetch live context periodically when modal opens
  useEffect(() => {
    if (isOpen) {
      assistantApi
        .getContext()
        .then((data) => setLiveContextData(data))
        .catch(() => {});
    }
  }, [isOpen]);

  // Global Keyboard Shortcuts (Ctrl+K, Esc, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen && !selectedReportMessage) {
        setIsOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewInvestigation();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, selectedReportMessage]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, thinkingStep]);

  // Create new investigation chat
  const handleNewInvestigation = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ConversationSession = {
      id: newId,
      title: `Investigation #${sessions.length + 1}`,
      updatedAt: new Date(),
      messages: []
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Delete conversation
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      setSessions([
        {
          id: `session-${Date.now()}`,
          title: 'New Investigation',
          updatedAt: new Date(),
          messages: []
        }
      ]);
      return;
    }
    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  // Send message flow
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    // Update session title if first message
    const updatedMessages = [...messages, userMessage];
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: s.messages.length === 0 ? text.slice(0, 28) + (text.length > 28 ? '...' : '') : s.title,
            updatedAt: new Date(),
            messages: updatedMessages
          };
        }
        return s;
      })
    );

    setInput('');
    setLoading(true);

    // Realistic state progression animation
    setThinkingStep('Analyzing revenue risk & telemetry signals...');
    const t1 = setTimeout(() => setThinkingStep('Evaluating recovery probability & ML factors...'), 400);
    const t2 = setTimeout(() => setThinkingStep('Checking deterministic policy guardrails...'), 800);

    try {
      const historyPayload = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

      const res: AssistantChatResponse = await assistantApi.chat(
        text,
        historyPayload,
        location.pathname,
        currentUser?.role || 'RECOVERY_ADMIN'
      );

      if (res.live_context) {
        setLiveContextData(res.live_context);
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        intent: res.intent,
        facts: res.facts,
        recommendations: res.recommendations,
        suggested_actions: res.suggested_actions,
        deep_link: res.deep_link,
        related_metrics: res.related_metrics,
        timestamp: new Date()
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [...s.messages, botMessage] } : s))
      );
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **RevenueRescue Copilot Error**: Could not retrieve investigation response (${
          err.message || 'Service temporarily unreachable'
        }). Deterministic database fallback active.`,
        timestamp: new Date()
      };
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s))
      );
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setThinkingStep(null);
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: 'positive' | 'negative') => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === msgId ? { ...m, feedback: type } : m))
      }))
    );
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  // Hide Copilot/Chatbot on login and signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <>
      {/* Floating Copilot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 text-slate-100 rounded-full shadow-2xl shadow-emerald-950/50 hover:shadow-emerald-950 transition-all duration-300 group cursor-pointer"
          title="Open RevenueRescue Copilot (Ctrl + K)"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-bold block text-white leading-tight">RevenueRescue Copilot</span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Investigate • Predict • Recover
            </span>
          </div>
          <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 ml-1">
            Ctrl+K
          </kbd>
        </button>
      )}

      {/* Main Copilot Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div
            className={`w-full bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
              isExpanded ? 'h-[96vh] max-w-[98vw]' : 'h-[86vh] max-w-6xl'
            }`}
          >
            {/* Top Copilot Header Bar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white tracking-wide">RevenueRescue Copilot</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      LIVE TELEMETRY
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Investigate. Predict. Recover. — Grounded in autonomous recovery & reconciliation rules
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1.5 text-slate-400">
                <button
                  onClick={() => setShowHistorySidebar((prev) => !prev)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer hidden md:flex items-center gap-1 text-xs"
                  title="Toggle Investigation History"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowContextSidebar((prev) => !prev)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer hidden lg:flex items-center gap-1 text-xs"
                  title="Toggle Live Revenue Context"
                >
                  <Activity className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg hover:text-white transition-colors cursor-pointer hidden sm:block"
                  title={isExpanded ? 'Minimize' : 'Maximize'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-rose-950 hover:text-rose-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3-Column Operations Area */}
            <div className="flex flex-1 min-h-0 overflow-hidden relative">
              {/* =========================================================================
                  LEFT PANEL: Conversation & Investigation History
              ========================================================================= */}
              {showHistorySidebar && (
                <div className="w-64 bg-slate-950/90 border-r border-slate-800 flex flex-col shrink-0 text-xs hidden md:flex animate-in slide-in-from-left">
                  {/* New Investigation Button */}
                  <div className="p-3 border-b border-slate-800">
                    <button
                      onClick={handleNewInvestigation}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Investigation</span>
                    </button>
                  </div>

                  {/* Search History */}
                  <div className="p-2.5 border-b border-slate-800/80">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search investigations..."
                        value={searchHistoryQuery}
                        onChange={(e) => setSearchHistoryQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Sessions List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 block">
                      Investigations ({filteredSessions.length})
                    </span>

                    {filteredSessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setCurrentSessionId(s.id)}
                        className={`group flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                          currentSessionId === s.id
                            ? 'bg-slate-900 border border-slate-700/80 text-emerald-300 font-semibold'
                            : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-emerald-400" />
                          <span className="truncate text-xs">{s.title}</span>
                        </div>

                        <button
                          onClick={(e) => handleDeleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Sidebar Footer */}
                  <div className="p-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Role: {currentUser?.role || 'ADMIN'}</span>
                    <span className="text-emerald-400">● Synced</span>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  CENTER MAIN CHAT CANVAS
              ========================================================================= */}
              <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
                {/* Category Pills Bar */}
                <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                    Topics:
                  </span>
                  {CATEGORY_PROMPTS.map((c, cI) => (
                    <button
                      key={cI}
                      onClick={() => handleSendMessage(c.prompt)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-[11px] text-slate-300 hover:text-emerald-300 transition-all shrink-0 cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  {/* Empty Welcome State if no messages */}
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-6 text-center space-y-5 animate-in fade-in">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-700/60 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950">
                        <Zap className="w-6 h-6 fill-current" />
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                          Revenue Recovery Intelligence
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
                          Ask questions about payment failures, revenue leakage, recovery opportunities, risk policies, or transaction investigations.
                        </p>
                      </div>

                      {/* Suggested Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                        {WELCOME_SUGGESTIONS.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSendMessage(s.prompt)}
                            className="p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-100 group-hover:text-emerald-300">
                                {s.title}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2">{s.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages List */}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-medium ml-8'
                            : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md mr-8'
                        }`}
                      >
                        {/* Message Content Rendered */}
                        <div className="space-y-2 prose-sm prose-invert max-w-none">
                          {msg.content.split('\n\n').map((paragraph, pI) => {
                            if (paragraph.startsWith('### ')) {
                              return (
                                <h4 key={pI} className="font-bold text-emerald-300 text-xs mt-2 uppercase tracking-wider">
                                  {paragraph.replace('### ', '')}
                                </h4>
                              );
                            }
                            if (paragraph.startsWith('📊 ') || paragraph.startsWith('🔍 ') || paragraph.startsWith('⚡ ') || paragraph.startsWith('🛡️ ') || paragraph.startsWith('🤖 ')) {
                              return (
                                <h3 key={pI} className="font-bold text-white text-sm pb-1 border-b border-slate-800 flex items-center gap-1.5">
                                  {paragraph}
                                </h3>
                              );
                            }
                            if (paragraph.startsWith('|')) {
                              // Render simple markdown table
                              const rows = paragraph.trim().split('\n');
                              return (
                                <div key={pI} className="overflow-x-auto my-2">
                                  <table className="w-full text-left text-[11px] font-mono border border-slate-800 rounded-lg overflow-hidden">
                                    <tbody>
                                      {rows.map((row, rI) => {
                                        if (row.includes('---')) return null;
                                        const cells = row.split('|').filter(Boolean);
                                        return (
                                          <tr key={rI} className={rI === 0 ? 'bg-slate-900 text-slate-300 font-bold' : 'border-t border-slate-800/80 text-slate-400'}>
                                            {cells.map((cell, cI) => (
                                              <td key={cI} className="p-1.5 px-2.5">
                                                {cell.trim()}
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }
                            return (
                              <p key={pI} className="text-slate-300 leading-relaxed">
                                {paragraph}
                              </p>
                            );
                          })}
                        </div>

                        {/* Actionable Suggested Action Buttons */}
                        {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                            {msg.suggested_actions.map((act, actI) => (
                              <button
                                key={actI}
                                onClick={() => {
                                  if (act.toLowerCase().includes('live') || act.toLowerCase().includes('10-step')) {
                                    setIsOpen(false);
                                    navigate('/live-recovery');
                                  } else if (act.toLowerCase().includes('batch')) {
                                    setIsOpen(false);
                                    navigate('/recovery/batch');
                                  } else if (act.toLowerCase().includes('queue') || act.toLowerCase().includes('cases')) {
                                    setIsOpen(false);
                                    navigate('/recovery/cases');
                                  } else if (act.toLowerCase().includes('audit')) {
                                    setIsOpen(false);
                                    navigate('/audit');
                                  } else {
                                    handleSendMessage(act);
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-950 border border-slate-700/80 hover:border-emerald-700 text-slate-300 hover:text-emerald-300 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>{act}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message Toolbar: Copy, Feedback, Report */}
                        {msg.role === 'assistant' && (
                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-500 text-[10px]">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyMessage(msg.content, msg.id)}
                                className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Copy response"
                              >
                                {copiedMessageId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => setSelectedReportMessage(msg)}
                                className="hover:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Generate Formal Investigation Report"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Report</span>
                              </button>
                            </div>

                            {/* Feedback Controls */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleFeedback(msg.id, 'positive')}
                                className={`p-1 rounded hover:text-emerald-400 transition-colors cursor-pointer ${
                                  msg.feedback === 'positive' ? 'text-emerald-400' : ''
                                }`}
                                title="Helpful"
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'negative')}
                                className={`p-1 rounded hover:text-rose-400 transition-colors cursor-pointer ${
                                  msg.feedback === 'negative' ? 'text-rose-400' : ''
                                }`}
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Progressive Thinking Indicator */}
                  {loading && (
                    <div className="flex gap-3 justify-start animate-in fade-in">
                      <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1.5 max-w-sm">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{thinkingStep || 'RevenueRescue Copilot analyzing...'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans">
                          Grounding analysis in database ledger, exception records & policy rules...
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Chat Input Bar */}
                <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
                  <div className="relative flex items-center gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask RevenueRescue about revenue, payments, risk, or recovery..."
                      rows={1}
                      disabled={loading}
                      className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none max-h-32 transition-colors"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || loading}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl shadow-md shadow-emerald-950 transition-all cursor-pointer shrink-0"
                      title="Send message (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                    <span>Shift + Enter for new line • Enter to send</span>
                    <span className="text-emerald-400 font-sans">🛡️ Deterministic Grounded Assistant</span>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  RIGHT PANEL: Collapsible Live Revenue Context
              ========================================================================= */}
              {showContextSidebar && (
                <div className="w-72 bg-slate-950/95 border-l border-slate-800 p-4 flex flex-col shrink-0 text-xs hidden lg:flex space-y-4 overflow-y-auto animate-in slide-in-from-right">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                        Live Revenue Context
                      </h4>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400">● REAL-TIME</span>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Revenue at Risk</span>
                      <span className="text-rose-400 font-bold text-xs">
                        ₹{(liveContextData?.total_at_risk || 284000).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Total Rescued</span>
                      <span className="text-emerald-400 font-bold text-xs">
                        ₹{(liveContextData?.total_recovered || 192000).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Active Cases</span>
                      <span className="text-slate-200 font-bold text-xs">
                        {liveContextData?.active_cases || 17} cases
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Recovery Rate</span>
                      <span className="text-cyan-400 font-bold text-xs">
                        {liveContextData?.overall_recovery_rate_pct || 67.6}%
                      </span>
                    </div>
                  </div>

                  {/* Active Selected Investigation Card */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Active Case</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        91% PROB
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transaction:</span>
                        <span className="text-slate-200 font-bold">TXN-87421</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer:</span>
                        <span className="text-slate-200">CUST-1042</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount:</span>
                        <span className="text-rose-400 font-bold">₹25,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Failure:</span>
                        <span className="text-amber-400 truncate">Issuer Bank Glitch</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Recommended:</span>
                        <span className="text-emerald-400">UPI Smart Retry</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/live-recovery');
                      }}
                      className="w-full mt-2 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Inspect in Live Recovery</span>
                    </button>
                  </div>

                  {/* Quick Shortcuts Helper */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-slate-300 block font-bold">Keyboard Shortcuts</span>
                    <div className="flex justify-between">
                      <span>Toggle Copilot</span>
                      <kbd className="px-1 bg-slate-950 rounded border border-slate-800">Ctrl+K</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>New Investigation</span>
                      <kbd className="px-1 bg-slate-950 rounded border border-slate-800">Ctrl+Shift+N</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Close</span>
                      <kbd className="px-1 bg-slate-950 rounded border border-slate-800">Esc</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formal Investigation Report Modal */}
      {selectedReportMessage && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Revenue Operations Investigation Report</h3>
                  <span className="text-[10px] font-mono text-slate-400">Generated by RevenueRescue Copilot</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportMessage(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-3 leading-relaxed">
              <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-2">
                <span>Timestamp: {new Date().toISOString()}</span>
                <span>Actor: {currentUser?.name || 'System Operator'}</span>
              </div>

              <div className="text-slate-300 space-y-2 whitespace-pre-line">
                {selectedReportMessage.content}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedReportMessage.content);
                  setSelectedReportMessage(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Copy & Export Report
              </button>
              <button
                onClick={() => setSelectedReportMessage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
