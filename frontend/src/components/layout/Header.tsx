import React, { useState } from 'react';
import { Play, RotateCw, Zap, ShieldCheck, Menu, ChevronDown, User, Check, ShieldAlert } from 'lucide-react';
import { recoveryApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({ title, onRefresh, onOpenMobileMenu }: HeaderProps) {
  const { currentUser, availableUsers, switchUser, hasPermission } = useAuth();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const canRunBatch = hasPermission('can_run_recovery_batch');
  const canDetect = hasPermission('can_run_recovery_detection');
  const canRunEngine = canRunBatch || canDetect;

  const handleRunRecoveryEngine = async () => {
    if (!canRunEngine) {
      setMessage(`Action Denied: Your role (${currentUser.role}) does not have recovery engine privileges.`);
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    setRunning(true);
    setMessage(null);
    try {
      if (canRunBatch) {
        const res = await recoveryApi.runBatch();
        setMessage(
          `⚡ Recovery Engine Ran! Recovered: ₹${Number(res.total_recovered).toLocaleString('en-IN')} (${res.cases_recovered}/${res.batch_size} cases rescued • ${res.recovery_rate_pct}% recovery rate)`
        );
      } else {
        const res = await recoveryApi.detectCases();
        setMessage(`⚡ Risk Detection Active! Successfully detected ${res.count} new cases from failure pipelines.`);
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage(`Recovery Execution Failed: ${err.message}`);
    } finally {
      setRunning(false);
      setTimeout(() => setMessage(null), 8000);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'RECOVERY_ADMIN':
        return 'bg-blue-900/80 text-white border-blue-600';
      case 'RECOVERY_MANAGER':
        return 'bg-indigo-950/80 text-blue-200 border-indigo-700';
      case 'RECOVERY_OPERATOR':
      default:
        return 'bg-sky-950/80 text-sky-200 border-sky-800';
    }
  };


  return (
    <header className="h-16 bg-[#091228]/95 backdrop-blur-md border-b border-blue-900/40 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 relative">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-blue-300 hover:text-white hover:bg-blue-950 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight truncate">
          {title}
        </h2>
        
        {message && (
          <div className="hidden md:flex bg-emerald-950/90 border border-emerald-500/50 text-xs px-3.5 py-1.5 rounded-xl text-emerald-300 font-semibold items-center gap-2 shadow-xl shadow-emerald-950/50 animate-in fade-in">
            <Zap className="w-4 h-4 animate-pulse text-emerald-400 shrink-0 fill-emerald-400/20" />
            <span className="truncate">{message}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {/* Interactive Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs transition-all shadow-sm group cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="font-bold text-slate-200 block leading-tight text-xs">
                {currentUser.name}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-semibold">
                  Switch Demo Persona
                </span>
                <span className="text-xs text-slate-300 font-medium mt-0.5 block">
                  Experience Role-Based Perspectives
                </span>
              </div>
              <div className="py-1 space-y-1">
                {availableUsers.map((u) => {
                  const isSelected = u.email === currentUser.email;
                  return (
                    <button
                      key={u.email}
                      onClick={() => {
                        switchUser(u.email);
                        setShowRoleMenu(false);
                        if (onRefresh) onRefresh();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/20 border border-emerald-500/40 text-white font-semibold'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 truncate">{u.name}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${getRoleBadgeColor(u.role)}`}>
                            {u.role}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono block truncate mt-0.5">
                          {u.email}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Safety Gate Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs">FMR Safety: <strong className="text-slate-100 font-bold">Active</strong></span>
        </div>

        {/* Refresh Action if provided */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="hidden sm:flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Run Recovery Action Button */}
        <button
          onClick={handleRunRecoveryEngine}
          disabled={running || !canRunEngine}
          title={canRunEngine ? "Execute Revenue Recovery Engine" : `Run Disabled for ${currentUser.role}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            canRunEngine
              ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-emerald-950/40 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          } disabled:opacity-50`}
        >
          {running ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          <span>{running ? 'Recovering...' : 'Run Recovery Engine'}</span>
        </button>
      </div>
    </header>
  );
}
