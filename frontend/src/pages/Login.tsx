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

  // Active persona
  const activeUser = availableUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
    name: email.split('@')[0],
    role: selectedRole === 'operator' ? 'RECOVERY_OPERATOR' : selectedRole === 'manager' ? 'RECOVERY_MANAGER' : 'RECOVERY_ADMIN',
    title: selectedRole === 'operator' ? 'Senior Recovery Operator' : selectedRole === 'manager' ? 'Recovery Manager' : 'System Administrator',
  };

  const formFields = [
    {
      label: 'Corporate Work Email',
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
    <div className="min-h-screen w-full bg-[#070c18] text-white flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* Dark Blue & White Ambient Lighting */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px] pointer-events-none" />

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

      {/* Left Side: Modern Animated Orbit & Ripple Display */}
      <section className="hidden lg:flex w-1/2 min-h-screen relative flex-col items-center justify-center border-r border-blue-900/40 bg-gradient-to-br from-[#070c18] via-[#0a1535] to-[#0d1e4a] p-12 overflow-hidden">
        {/* Decorative subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Strong corner glows for white+blue depth */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/8 rounded-full blur-[120px] pointer-events-none" />
        <Ripple mainCircleSize={120} numCircles={9} />
        <TechOrbitDisplay
          iconsArray={orbitIcons}
          text="RevenueRescue AI"
          subText="Autonomous Recovery & RBAC Mission Control"
        />

        {/* Real-time Telemetry Status Card */}
        <div className="absolute bottom-10 z-10 flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 shadow-2xl backdrop-blur-md text-xs font-mono text-white">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-300"></span>
          </span>
          <span className="text-blue-100/90">Deterministic Recovery Engine:</span>
          <span className="text-white font-bold">100% Policy Bounds Enforced</span>
        </div>
      </section>

      {/* Right Side: Animated Form with Live RBAC Switcher in Dark Blue & White */}
      <section className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-24 relative z-10 bg-[#070c18]/80 backdrop-blur-md">
        
        <AnimatedForm
          header="Enterprise Sign In"
          subHeader="Choose your authenticated RBAC role or log in with corporate credentials"
          fields={formFields}
          submitButton="Sign In to Recovery Portal"
          textVariantButton="Need demo access? Autofill Operator (Aarav)"
          goTo={() => handleRoleSelect('operator', 'operator.aarav@revenuerescue.ai')}
          errorField={error || undefined}
          onSubmit={handleSubmit}
          googleLogin="Sign in with Google Enterprise"
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          childrenBeforeFields={
            <div className="space-y-3.5 pb-1">
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-100">Select Enterprise Persona (RBAC):</span>
                  <span className="text-[10px] font-mono font-bold text-white bg-blue-600/80 px-2.5 py-0.5 rounded-full border border-blue-400/40">
                    1-CLICK SWITCH
                  </span>
                </div>
              </BoxReveal>

              {/* 3 Quick RBAC Persona Selectors */}
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Operator */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('operator', 'operator.aarav@revenuerescue.ai')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'operator'
                        ? 'border-blue-400 bg-blue-900/50 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-blue-900/60 bg-[#0b142c] hover:border-blue-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-300 uppercase">Operator</span>
                      {selectedRole === 'operator' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    </div>
                    <div className="text-xs font-bold text-white mt-1 truncate">Aarav M.</div>
                    <div className="text-[10px] text-blue-200/70 truncate mt-0.5">Triage Queue</div>
                  </button>

                  {/* Manager */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('manager', 'manager.priya@revenuerescue.ai')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'manager'
                        ? 'border-blue-400 bg-blue-900/50 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-blue-900/60 bg-[#0b142c] hover:border-blue-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-300 uppercase">Manager</span>
                      {selectedRole === 'manager' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    </div>
                    <div className="text-xs font-bold text-white mt-1 truncate">Priya S.</div>
                    <div className="text-[10px] text-blue-200/70 truncate mt-0.5">Approvals</div>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin', 'admin.arjun@revenuerescue.ai')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'border-blue-400 bg-blue-900/50 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                        : 'border-blue-900/60 bg-[#0b142c] hover:border-blue-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-blue-300 uppercase">Admin</span>
                      {selectedRole === 'admin' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    </div>
                    <div className="text-xs font-bold text-white mt-1 truncate">Arjun R.</div>
                    <div className="text-[10px] text-blue-200/70 truncate mt-0.5">Full System</div>
                  </button>
                </div>
              </BoxReveal>

              {/* Active User Card Details */}
              <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
                <div className="p-3.5 rounded-xl bg-[#0c1630] border border-blue-900/80 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-600/30">
                      {activeUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{activeUser.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-200 font-semibold">
                          {activeUser.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-300/70 font-mono mt-0.5">{email}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-blue-300 bg-blue-950/90 px-2 py-1 rounded-md border border-blue-800/80 font-bold">
                    ✓ ACTIVE
                  </div>
                </div>
              </BoxReveal>
            </div>
          }
          childrenAfterSubmit={
            <BoxReveal boxColor="var(--skeleton)" duration={0.3} width="100%">
              <div className="text-center space-y-2 pt-3 border-t border-blue-900/60">
                <p className="text-xs text-blue-200/80">
                  Need a new enterprise tenant?{' '}
                  <Link to="/signup" className="text-white hover:text-blue-300 font-bold underline transition-colors">
                    Register Workspace &rarr;
                  </Link>
                </p>
                <p className="text-[10px] text-blue-300/50 font-mono">
                  SOC-2 Type II Certified • SHA-256 State Hashing Active
                </p>
              </div>
            </BoxReveal>
          }
        />
      </section>
    </div>
  );
}
