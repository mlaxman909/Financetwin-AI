import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  Lock,
  Cpu,
  Shield,
  Layers,
  Sparkles,
  Bot
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
  const { login: authLogin, availableUsers } = useAuth();

  const [email, setEmail] = useState('operator.aarav@revenuerescue.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'operator' | 'manager' | 'admin'>('operator');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Orbiting Icons for Left Side Display
  const orbitIcons: IconConfig[] = [
    {
      component: () => (
        <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 backdrop-blur-md">
          <Zap className="w-5 h-5 text-emerald-400" />
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
        <div className="w-9 h-9 rounded-xl bg-teal-950/90 border border-teal-500/50 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/20 backdrop-blur-md">
          <Bot className="w-5 h-5 text-teal-400" />
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
        <div className="w-11 h-11 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 backdrop-blur-md">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
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
        <div className="w-11 h-11 rounded-2xl bg-blue-950/90 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20 backdrop-blur-md">
          <Cpu className="w-6 h-6 text-blue-400" />
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
        <div className="w-12 h-12 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20 backdrop-blur-md">
          <Layers className="w-6 h-6 text-indigo-400" />
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
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-lg shadow-emerald-400/20 backdrop-blur-md">
          <Sparkles className="w-6 h-6 text-emerald-300" />
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
      setError('Please enter a valid work email.');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await authLogin(cleanEmail);
      if (ok) {
        setTimeout(() => {
          setIsLoading(false);
          if (cleanEmail.includes('aarav') || cleanEmail.includes('operator')) {
            navigate('/operator-queue');
          } else {
            navigate('/recovery');
          }
        }, 400);
      } else {
        setIsLoading(false);
        setError('Authentication failed. Verify credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication error.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authLogin('admin.arjun@revenuerescue.ai');
      setTimeout(() => {
        setIsLoading(false);
        navigate('/recovery');
      }, 400);
    } catch {
      setIsLoading(false);
      setError('Google Sign-In failed.');
    }
  };

  // Get active persona name & details
  const activeUser = availableUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
    name: email.split('@')[0],
    role: selectedRole === 'operator' ? 'RECOVERY_OPERATOR' : selectedRole === 'manager' ? 'RECOVERY_MANAGER' : 'RECOVERY_ADMIN',
    title: selectedRole === 'operator' ? 'Senior Recovery Operator' : selectedRole === 'manager' ? 'Recovery Manager' : 'System Administrator',
  };

  const formFields = [
    {
      label: 'Work Email',
      required: true,
      type: 'email' as const,
      value: email,
      placeholder: 'operator.aarav@revenuerescue.ai',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
    },
    {
      label: 'Password',
      required: true,
      type: 'password' as const,
      value: password,
      placeholder: 'Enter your password (or demo password)',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* Background ambient radial gradients */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar Minimalist */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between border-b border-slate-800/40 backdrop-blur-md bg-slate-950/40">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-emerald-500/25">
            RR
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            RevenueRescue <span className="text-emerald-400">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link to="/recovery" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Command Center
          </Link>
          <Link to="/live-recovery" className="text-slate-400 hover:text-white transition-colors hidden sm:block">
            Live Stream
          </Link>
          <Link to="/signup" className="px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-semibold hover:bg-emerald-900/60 transition-all">
            Create Account
          </Link>
        </div>
      </header>

      {/* Left Side: Modern Animated Orbit & Ripple Display */}
      <section className="hidden lg:flex w-1/2 min-h-screen relative flex-col items-center justify-center border-r border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900/50 to-emerald-950/20 p-12">
        <Ripple mainCircleSize={120} numCircles={8} />
        <TechOrbitDisplay
          iconsArray={orbitIcons}
          text="RevenueRescue AI"
          subText="Autonomous Recovery & RBAC Mission Control"
        />

        {/* Real-time Telemetry Pill */}
        <div className="absolute bottom-10 z-10 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/90 border border-slate-800/80 shadow-xl backdrop-blur-md text-xs font-mono">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Deterministic Recovery Engine:</span>
          <span className="text-emerald-400 font-bold">100% Policy Bounds Enforced</span>
        </div>
      </section>

      {/* Right Side: Animated Form with Live RBAC Switcher */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-24 relative z-10">
        
        <AnimatedForm
          header="Enterprise Sign In"
          subHeader="Choose your authenticated RBAC role or log in with corporate credentials"
          fields={formFields}
          submitButton="Sign In to Recovery Portal"
          textVariantButton="Need help? Autofill Operator Demo"
          goTo={() => handleRoleSelect('operator', 'operator.aarav@revenuerescue.ai')}
          errorField={error || undefined}
          onSubmit={handleSubmit}
          googleLogin="Sign in with Google Work Account"
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          childrenBeforeFields={
            <div className="space-y-3 pb-1">
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Select Enterprise Persona (RBAC):</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                    1-CLICK SWITCH
                  </span>
                </div>
              </BoxReveal>

              {/* 3 Quick RBAC Persona Selectors */}
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="grid grid-cols-3 gap-2">
                  {/* Operator */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('operator', 'operator.aarav@revenuerescue.ai')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'operator'
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-400 uppercase">Operator</span>
                      {selectedRole === 'operator' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-1 truncate">Aarav M.</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">Triage Queue</div>
                  </button>

                  {/* Manager */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('manager', 'manager.priya@revenuerescue.ai')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'manager'
                        ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase">Manager</span>
                      {selectedRole === 'manager' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-1 truncate">Priya S.</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">Approvals</div>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin', 'admin.arjun@revenuerescue.ai')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">Admin</span>
                      {selectedRole === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-1 truncate">Arjun R.</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">Full System</div>
                  </button>
                </div>
              </BoxReveal>

              {/* Active User Card Details (Who is logging in) */}
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      selectedRole === 'operator'
                        ? 'bg-blue-950 border border-blue-800 text-blue-400'
                        : selectedRole === 'manager'
                        ? 'bg-amber-950 border border-amber-800 text-amber-400'
                        : 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                    }`}>
                      {activeUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{activeUser.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {activeUser.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{email}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                    ✓ VERIFIED
                  </div>
                </div>
              </BoxReveal>
            </div>
          }
          childrenAfterSubmit={
            <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
              <div className="text-center space-y-2 pt-3 border-t border-slate-800/80">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                    Register Enterprise Workspace &rarr;
                  </Link>
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  SOC-2 Type II Certified • SHA-256 State Hashing Enabled
                </p>
              </div>
            </BoxReveal>
          }
        />
      </section>
    </div>
  );
}
