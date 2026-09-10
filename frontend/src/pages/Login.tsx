import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CanvasRevealEffect, MiniNavbar } from '../components/ui/sign-in-flow-1';

interface LoginProps {
  initialModeProp?: 'login' | 'register';
}

export default function Login({ initialModeProp }: LoginProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const determinedMode = initialModeProp || (searchParams.get('mode') === 'register' ? 'register' : 'login');
  
  const { login: authLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(determinedMode);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  // 2FA / Code Step state
  const [step, setStep] = useState<'form' | 'code' | 'success'>('form');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
      
      if (index === 5 && value) {
        const isComplete = newCode.every((digit) => digit.length === 1);
        if (isComplete) {
          triggerSuccessTransition(email || 'operator.aarav@revenuerescue.ai');
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const triggerSuccessTransition = async (userEmail: string) => {
    setReverseCanvasVisible(true);
    setTimeout(() => {
      setInitialCanvasVisible(false);
    }, 60);

    try {
      await authLogin(userEmail);
      setTimeout(() => {
        setStep('success');
      }, 1000);
    } catch {
      setError('Authentication failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (authMethod === 'otp') {
      setStep('code');
      return;
    }

    setIsLoading(true);
    try {
      const ok = await authLogin(cleanEmail);
      if (ok) {
        setReverseCanvasVisible(true);
        setTimeout(() => {
          setInitialCanvasVisible(false);
          setStep('success');
        }, 600);
      } else {
        setIsLoading(false);
        setError('Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Authentication error.');
    }
  };

  const handleDemoSelect = async (userEmail: string, rolePath: string, personaKey: string) => {
    setActivePersona(personaKey);
    setEmail(userEmail);
    setIsLoading(true);
    setError(null);
    try {
      await authLogin(userEmail);
      setReverseCanvasVisible(true);
      setTimeout(() => {
        setIsLoading(false);
        navigate(rolePath);
      }, 500);
    } catch {
      setIsLoading(false);
      setError('Demo authentication failed.');
    }
  };

  const handleFinalRedirect = () => {
    const targetEmail = (email || '').toLowerCase();
    if (targetEmail.includes('aarav') || targetEmail.includes('operator')) {
      navigate('/operator-queue');
    } else {
      navigate('/recovery');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-600 selection:text-white">
      {/* Dynamic 3D Matrix Shader Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3.5}
              containerClassName="bg-slate-950"
              colors={[
                [16, 185, 129], // Emerald
                [20, 184, 166], // Teal
                [6, 182, 212]   // Cyan
              ]}
              dotSize={4}
              reverse={false}
            />
          </div>
        )}
        
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4.5}
              containerClassName="bg-slate-950"
              colors={[
                [16, 185, 129],
                [52, 211, 153],
                [167, 243, 208]
              ]}
              dotSize={5}
              reverse={true}
            />
          </div>
        )}

        {/* Ambient Radial Vignette & Glow Overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(11,15,25,0.45)_0%,_rgba(11,15,25,0.96)_100%)] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Floating Animated Header Navigation */}
      <MiniNavbar />

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 pt-24 sm:pt-28">
        <div className="w-full max-w-5xl bg-slate-900/85 border border-slate-800/80 rounded-3xl shadow-2xl shadow-black/80 backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all duration-300">
          
          {/* Left Column: Mission Control & Value Proposition */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-emerald-950/30 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-500/25">
                  RR
                </div>
                <div>
                  <span className="font-black text-lg text-slate-100 tracking-tight block leading-none">
                    RevenueRescue <span className="text-emerald-400">AI</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mt-1 font-bold">
                    Autonomous Recovery Engine
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-mono text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Razorpay Buildathon Release
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Detect. Decide. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                    Recover Lost Revenue.
                  </span>
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Real-time autonomous intelligence converting failed transactions, churn anomalies, and billing drop-offs into settled pipeline with cryptographic proof.
                </p>

                {/* Micro-Features */}
                <div className="space-y-2.5 pt-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/40">
                    <div className="w-5 h-5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 font-bold text-[10px]">
                      1
                    </div>
                    <div>
                      <strong className="text-slate-100">Deterministic Diagnosis:</strong> AI classifies card network, UPI & invoice root causes with confidence scoring.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/40">
                    <div className="w-5 h-5 rounded-lg bg-teal-950/80 border border-teal-700/60 flex items-center justify-center shrink-0 mt-0.5 text-teal-400 font-bold text-[10px]">
                      2
                    </div>
                    <div>
                      <strong className="text-slate-100">Bounded Execution:</strong> Smart Retries, Dynamic WhatsApp links & payment routing under strict guardrails.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/40">
                    <div className="w-5 h-5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 font-bold text-[10px]">
                      3
                    </div>
                    <div>
                      <strong className="text-slate-100">Immutable Audit Trail:</strong> Every autonomous action signed with SHA-256 state hashing for compliance.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Policy Guardrails Enforced</span>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                SOC-2 Type II
              </span>
            </div>
          </div>

          {/* Right Column: Dynamic Steps (Form / 2FA / Success) */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {step === 'form' && (
                <motion.div
                  key="login-form-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Persona Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">1-Click Enterprise Role Sign In</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Explore RevenueRescue AI with pre-configured role permissions</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-bold">
                      DEMO PERSONAS
                    </span>
                  </div>

                  {/* 3 Interactive Enterprise Role Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Role 1: Aarav */}
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('operator.aarav@revenuerescue.ai', '/operator-queue', 'operator')}
                      disabled={isLoading}
                      className={`p-3 bg-slate-950/90 border rounded-2xl text-left transition-all cursor-pointer group shadow-sm relative overflow-hidden ${
                        activePersona === 'operator'
                          ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                          : 'border-slate-800 hover:border-blue-700/60 hover:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-bold text-[10px]">
                          OP
                        </span>
                        <span className="text-[9px] font-mono text-blue-400 font-semibold uppercase">Operator</span>
                      </div>
                      <div className="font-bold text-xs text-slate-200 group-hover:text-blue-300 truncate">
                        Aarav Mehta
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        Triage queue, execution & exceptions
                      </div>
                    </button>

                    {/* Role 2: Priya */}
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('manager.priya@revenuerescue.ai', '/recovery', 'manager')}
                      disabled={isLoading}
                      className={`p-3 bg-slate-950/90 border rounded-2xl text-left transition-all cursor-pointer group shadow-sm relative overflow-hidden ${
                        activePersona === 'manager'
                          ? 'border-amber-500 bg-amber-950/30 ring-1 ring-amber-500'
                          : 'border-slate-800 hover:border-amber-700/60 hover:bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                          MG
                        </span>
                        <span className="text-[9px] font-mono text-amber-400 font-semibold uppercase">Manager</span>
                      </div>
                      <div className="font-bold text-xs text-slate-200 group-hover:text-amber-300 truncate">
                        Priya Sharma
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        Exposure metrics & policy approvals
                      </div>
                    </button>

                    {/* Role 3: Arjun */}
                    <button
                      type="button"
                      onClick={() => handleDemoSelect('admin.arjun@revenuerescue.ai', '/recovery', 'admin')}
                      disabled={isLoading}
                      className={`p-3 bg-slate-950/90 border rounded-2xl text-left transition-all cursor-pointer group shadow-sm relative overflow-hidden ${
                        activePersona === 'admin'
                          ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                          : 'border-slate-800 hover:border-emerald-700/60 hover:bg-emerald-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                          AD
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase">Admin</span>
                      </div>
                      <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-300 truncate">
                        Arjun Rao
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        Autonomous runner & full guardrails
                      </div>
                    </button>
                  </div>

                  {/* Divider with Method Toggle */}
                  <div className="relative flex items-center justify-between py-1">
                    <div className="border-t border-slate-800 flex-1" />
                    <span className="px-3 text-[11px] text-slate-400 font-mono">or enter work credentials</span>
                    <div className="border-t border-slate-800 flex-1" />
                  </div>

                  {/* Error Feedback */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs font-mono text-rose-300"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Standard Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">Work Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="operator.aarav@revenuerescue.ai"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-300">
                          {authMethod === 'password' ? 'Password' : 'Authentication Method'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setAuthMethod(authMethod === 'password' ? 'otp' : 'password')}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono transition-colors cursor-pointer"
                        >
                          {authMethod === 'password' ? 'Switch to 2FA Code' : 'Switch to Password'}
                        </button>
                      </div>

                      {authMethod === 'password' ? (
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Demo: any password or blank"
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-emerald-400" />
                            <span>Instant 6-Digit 2FA Code will be requested</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">READY</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-50 mt-1 cursor-pointer"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Authenticating Access...</span>
                        </div>
                      ) : (
                        <>
                          <span>{authMethod === 'password' ? 'Sign In to Recovery Portal' : 'Send 2FA Security Code'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 'code' && (
                <motion.div
                  key="code-step-view"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-center py-4"
                >
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">Security 2FA Verification</h3>
                    <p className="text-xs text-slate-400">
                      Enter the 6-digit access code dispatched to <span className="text-emerald-400 font-mono font-medium">{email || 'your email'}</span>
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="relative rounded-2xl py-3.5 px-4 border border-slate-800 bg-slate-950/90 max-w-sm mx-auto shadow-inner">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {code.map((digit, i) => (
                          <div key={i} className="flex items-center">
                            <input
                              ref={(el) => {
                                codeInputRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleCodeChange(i, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(i, e)}
                              className="w-9 sm:w-10 h-11 text-center text-lg font-mono font-bold bg-slate-900 border border-slate-700/60 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-400 transition-colors"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span>Didn't receive code?</span>
                    <button
                      type="button"
                      onClick={() => setCode(['8', '4', '2', '9', '1', '0'])}
                      className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold underline cursor-pointer"
                    >
                      Autofill Demo Code (842910)
                    </button>
                  </div>

                  <div className="flex w-full gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                        setCode(['', '', '', '', '', '']);
                      }}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-5 py-3 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSuccessTransition(email || 'operator.aarav@revenuerescue.ai')}
                      className={`flex-1 rounded-xl text-xs font-bold py-3 transition-all duration-300 ${
                        code.every((d) => d !== '')
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/30 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Verify & Access Command Center
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success-step-view"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/15">
                      <Check className="w-8 h-8 text-emerald-400 stroke-[3]" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Identity Cryptographically Verified</h3>
                    <p className="text-xs text-emerald-400 font-mono">
                      Deterministic session token issued & policy bounds active
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left space-y-2 max-w-sm mx-auto text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Authenticated User:</span>
                      <span className="text-slate-200 font-semibold">{email || 'Recovery Specialist'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Audit Checksum:</span>
                      <span className="text-emerald-400">SHA-256 / VALID</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Platform Guardrails:</span>
                      <span className="text-teal-400">100% ENFORCED</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalRedirect}
                    className="w-full max-w-sm mx-auto py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/30 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Enter Autonomous Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center text-[10px] text-slate-500 font-mono pt-4 border-t border-slate-800/80">
              Protected by SOC-2 Type II standards & deterministic policy guardrails.
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 py-3 text-center text-[11px] text-slate-500 font-mono">
        RevenueRescue AI © 2026 • Autonomous Recovery & Multi-Agent Financial Architecture
      </footer>
    </div>
  );
}
