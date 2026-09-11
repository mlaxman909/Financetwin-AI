import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Ripple,
  TechOrbitDisplay,
  AnimatedForm,
  BoxReveal,
  IconConfig,
} from '../components/ui/modern-animated-sign-in';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/recovery';

  const { login, switchUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Orbiting Icons for Left Side Display with Dark Blue & White Theme
  const orbitIcons: IconConfig[] = [
    {
      component: () => (
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/60 flex items-center justify-center text-white shadow-lg shadow-white/20 backdrop-blur-md">
          <Zap className="w-5 h-5 text-white" />
        </div>
      ),
      className: 'size-[40px]',
      duration: 18,
      delay: 0,
      radius: 95,
      path: true,
      reverse: false,
    },
    {
      component: () => (
        <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-200/70 flex items-center justify-center text-white shadow-lg shadow-blue-200/25 backdrop-blur-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      ),
      className: 'size-[40px]',
      duration: 18,
      delay: 9,
      radius: 95,
      path: false,
      reverse: false,
    },
    {
      component: () => (
        <div className="w-12 h-12 rounded-2xl bg-white/15 border-2 border-white/80 flex items-center justify-center text-white shadow-xl shadow-white/30 backdrop-blur-md">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
      ),
      className: 'size-[50px]',
      duration: 26,
      delay: 0,
      radius: 160,
      path: true,
      reverse: true,
    },
    {
      component: () => (
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/25 border-2 border-indigo-200/70 flex items-center justify-center text-white shadow-xl shadow-indigo-200/25 backdrop-blur-md">
          <Cpu className="w-6 h-6 text-white" />
        </div>
      ),
      className: 'size-[50px]',
      duration: 26,
      delay: 13,
      radius: 160,
      path: false,
      reverse: true,
    },
    {
      component: () => (
        <div className="w-12 h-12 rounded-2xl bg-blue-400/20 border-2 border-blue-100/80 flex items-center justify-center text-white shadow-xl shadow-blue-100/30 backdrop-blur-md">
          <Layers className="w-6 h-6 text-white" />
        </div>
      ),
      className: 'size-[55px]',
      duration: 34,
      delay: 0,
      radius: 230,
      path: true,
      reverse: false,
    },
    {
      component: () => (
        <div className="w-12 h-12 rounded-2xl bg-sky-400/20 border-2 border-sky-200/80 flex items-center justify-center text-white shadow-xl shadow-sky-200/30 backdrop-blur-md">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      ),
      className: 'size-[55px]',
      duration: 34,
      delay: 17,
      radius: 230,
      path: false,
      reverse: false,
    },
  ];

  const handleRoleSelect = (roleKey: 'operator' | 'manager' | 'admin', roleEmail: string) => {
    setSelectedRole(roleKey);
    setEmail(roleEmail);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await login(cleanEmail, password);
    setIsLoading(false);

    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Authentication failed.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    switchUser(userEmail);
    // Give switchUser a moment to fetch the token and set state
    setTimeout(() => {
      setIsLoading(false);
      navigate(rolePath);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 font-sans relative overflow-hidden selection:bg-emerald-600 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Split-Screen Layout */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/90 backdrop-blur-xl relative z-10 overflow-hidden grid grid-cols-1 lg:grid-cols-12">

        {/* Left Side: Product Intro */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-600/30">
                RR
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-100 tracking-tight block leading-none">
                  RevenueRescue <span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mt-0.5 font-bold">
                  Autonomous Recovery Agent
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Detect. Decide. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Recover Lost Revenue.
                </span>
              </h2>

              <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                {[
                  { num: '1', color: 'emerald', text: <><strong className="text-slate-100">Detect revenue at risk:</strong> Continuous scanning of failed payments, cart drop-offs, and unpaid invoices.</> },
                  { num: '2', color: 'teal', text: <><strong className="text-slate-100">Understand why it happened:</strong> AI diagnosis pinpointing root causes with verified confidence.</> },
                  { num: '3', color: 'cyan', text: <><strong className="text-slate-100">Choose the right intervention:</strong> Smart Retries, Recovery Links, and Reminders within policy bounds.</> },
                  { num: '4', color: 'blue', text: <><strong className="text-slate-100">Recover what would be lost:</strong> Transform write-offs into settled revenue with SHA-256 audit trails.</> },
                ].map(({ num, color, text }) => (
                  <div key={num} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full bg-${color}-950 border border-${color}-800 flex items-center justify-center shrink-0 mt-0.5 text-${color}-400 font-bold text-[10px]`}>
                      {num}
                    </div>
                    <div>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

      {/* Top Header Minimalist */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between border-b border-blue-900/40 backdrop-blur-md bg-[#070c18]/70">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
            RR
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            RevenueRescue <span className="text-blue-400">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/recovery" className="text-blue-200/70 hover:text-white transition-colors hidden sm:block">
            Command Center
          </Link>
          <Link to="/live-recovery" className="text-blue-200/70 hover:text-white transition-colors hidden sm:block">
            Live Stream
          </Link>
          <Link to="/signup" className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/25">
            Create Account
          </Link>
        </div>
      </header>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6 flex flex-col justify-between">
          <div>
            {/* Demo persona quick-access */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Quick Demo Access</h3>
                <p className="text-xs text-slate-400 mt-0.5">Jump in as a pre-configured enterprise role</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                3 ROLES
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <button type="button" onClick={() => handleDemoSelect('operator.aarav@revenuerescue.ai', '/operator-queue')} disabled={isLoading}
                className="p-3 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 rounded-xl text-left transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-md bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-[10px]">OP</span>
                  <span className="text-[9px] font-mono text-blue-400 font-semibold uppercase">Operator</span>
                </div>
                <div className="font-bold text-xs text-slate-200 group-hover:text-blue-300 truncate">Aarav Mehta</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">Triage, investigation & execution</div>
              </button>

              <button type="button" onClick={() => handleDemoSelect('manager.priya@revenuerescue.ai', '/recovery')} disabled={isLoading}
                className="p-3 bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-700/60 rounded-xl text-left transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-md bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 font-bold text-[10px]">MG</span>
                  <span className="text-[9px] font-mono text-amber-400 font-semibold uppercase">Manager</span>
                </div>
                <div className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate">Priya Sharma</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">Approvals & policy simulations</div>
              </button>

              <button type="button" onClick={() => handleDemoSelect('admin.arjun@revenuerescue.ai', '/recovery')} disabled={isLoading}
                className="p-3 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-700/60 rounded-xl text-left transition-all cursor-pointer group shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-[10px]">AD</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">Admin</span>
                </div>
                <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-300 truncate">Arjun Rao</div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">Guardrails & global config</div>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-mono">or sign in to your account</span>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 mb-4 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-mono text-rose-300">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </BoxReveal>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to Recovery Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-4">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1">
                <span>Create Account</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800/80">
            Protected by SOC-2 Type II standards & deterministic policy guardrails.
          </div>
        </div>
      </div>
    </div>
  );
}
