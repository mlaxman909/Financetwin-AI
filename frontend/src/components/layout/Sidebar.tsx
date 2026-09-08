import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitCompare,
  ShieldAlert,
  Sliders,
  Activity,
  BookOpen,
  Calculator,
  LogOut,
  ShieldCheck,
  X,
  UserCheck,
  FileText,
  Zap,
  RotateCw,
  FolderKanban,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { useAuth, DEMO_PERSONAS } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { currentUser, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const handleSignOut = () => {
    logout();
    if (onClose) onClose();
    navigate('/');
  };

  // Grouped Navigation per Master Prompt Section 29
  const navigationSections = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Recovery Command Center', path: '/recovery', icon: Zap }
      ]
    },
    {
      group: 'RECOVERY',
      items: [
        { name: 'AI Priority Queue', path: '/recovery/priority', icon: Sparkles },
        { name: 'Live 10-Step Recovery', path: '/live-recovery', icon: PlayCircle },
        { name: 'Recovery Cases', path: '/recovery/cases', icon: FolderKanban },
        { name: 'Autonomous Recovery', path: '/recovery/batch', icon: RotateCw }
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Revenue Leakage', path: '/leakage', icon: GitCompare },
        { name: 'Recovery Intelligence', path: '/intelligence', icon: Activity },
        { name: 'Anomaly Patterns', path: '/anomalies', icon: ShieldAlert }
      ]
    },
    {
      group: 'CONTROL',
      items: [
        { name: 'Policy Guardrails', path: '/governance', icon: Sliders },
        { name: 'Recovery Simulator', path: '/simulator', icon: Calculator }
      ]
    },
    {
      group: 'GOVERNANCE',
      items: [
        { name: 'Audit Trail', path: '/audit', icon: FileText }
      ]
    }
  ];

  const getRoleTheme = (role: UserRole) => {
    switch (role) {
      case 'RECOVERY_ADMIN':
        return { bg: 'bg-emerald-950/80', border: 'border-emerald-800', text: 'text-emerald-400', badge: 'ADMIN' };
      case 'RECOVERY_MANAGER':
        return { bg: 'bg-amber-950/80', border: 'border-amber-800', text: 'text-amber-400', badge: 'MANAGER' };
      case 'RECOVERY_OPERATOR':
      default:
        return { bg: 'bg-blue-950/80', border: 'border-blue-800', text: 'text-blue-400', badge: 'OPERATOR' };
    }
  };

  const theme = getRoleTheme(currentUser.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => navigate('/recovery')}>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-sm tracking-wider shadow-md shadow-emerald-500/20">
              RR
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 leading-none tracking-tight">RevenueRescue AI</h1>
              <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider block mt-1 font-semibold">
                Autonomous Recovery
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Categorized Navigation links */}
        <nav className="flex-1 px-3.5 py-4 space-y-4 overflow-y-auto">
          {navigationSections.map((sec) => (
            <div key={sec.group} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                {sec.group}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-slate-800/90 text-emerald-400 border-l-2 border-emerald-500 pl-2.5 shadow-sm font-bold'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Bottom Safety, Active Persona & Switch Demo Role Action */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${theme.bg} ${theme.text} flex items-center justify-center font-bold text-sm border ${theme.border}`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-200 block truncate">{currentUser.name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${theme.bg} ${theme.text} ${theme.border}`}>
                    {theme.badge}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono block truncate mt-0.5">{currentUser.email}</span>
              </div>
            </div>

            {/* Switch Demo Role Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch Demo Role</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {showRoleSwitcher && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => {
                        switchUser(p.role);
                        setShowRoleSwitcher(false);
                        if (p.role === 'RECOVERY_OPERATOR') {
                          navigate('/operator-queue');
                        } else {
                          navigate('/recovery');
                        }
                      }}
                      className={`w-full p-2.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        currentUser.role === p.role ? 'bg-slate-900 text-emerald-400 font-bold' : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.title}</div>
                      </div>
                      {currentUser.role === p.role && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dedicated Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-rose-950/40 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="px-3 py-2 bg-slate-950/50 rounded-xl border border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Guardrail Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-emerald-400 font-bold">BOUNDED</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
