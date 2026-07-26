import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';
import { Shield, Key, Mail, Lock, LogIn, UserPlus, CheckCircle2, AlertCircle, Database, Sparkles, User, ArrowRight, RefreshCw, Send } from 'lucide-react';

interface AuthPageProps {
  onAuthenticated: (role: UserRole, user: any) => void;
  activeRole: UserRole;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated, activeRole }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [otpCode, setOtpCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userRole = (session.user.user_metadata?.role as UserRole) || 'customer';
        onAuthenticated(userRole, session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userRole = (session.user.user_metadata?.role as UserRole) || selectedRole || 'customer';
        onAuthenticated(userRole, session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthenticated, selectedRole]);

  // Demo Fast-Login helper
  const handleQuickDemoLogin = (role: UserRole) => {
    setSelectedRole(role);
    const mockUser = {
      id: `demo-${role}-${Date.now()}`,
      email: `${role}@flowbite.com`,
      user_metadata: { role, full_name: `Demo ${role.toUpperCase()}` },
    };
    onAuthenticated(role, mockUser);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      // Fallback for environment without live Supabase credentials
      handleQuickDemoLogin(selectedRole);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      const userRole = (data.user.user_metadata?.role as UserRole) || selectedRole;
      setSuccessMsg(`Welcome back! Redirecting to ${userRole.toUpperCase()} Dashboard...`);
      setTimeout(() => {
        onAuthenticated(userRole, data.user);
      }, 800);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      handleQuickDemoLogin(selectedRole);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      setSuccessMsg(`Account created successfully! An OTP / verification email has been dispatched to ${email}. Redirecting to OTP Verification...`);
      setTimeout(() => {
        setMode('otp');
      }, 1200);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isConfigured) {
      handleQuickDemoLogin(selectedRole);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      const userRole = (data.user.user_metadata?.role as UserRole) || selectedRole;
      setSuccessMsg(`Email & OTP verified! Redirecting to ${userRole.toUpperCase()} Dashboard...`);
      setTimeout(() => {
        onAuthenticated(userRole, data.user);
      }, 800);
    } else {
      setSuccessMsg('OTP verified successfully!');
    }
    setLoading(false);
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg(null);
    if (!isConfigured) {
      handleQuickDemoLogin(selectedRole);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          role: selectedRole,
        },
      },
    });
    if (error) setErrorMsg(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            F
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">FlowBite Authentication</h1>
          <p className="text-xs text-slate-500">
            Role-Based Access Control for Multi-Tenant Restaurant Operations
          </p>
        </div>

        {/* Status Indicator */}
        <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${isConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              {isConfigured ? 'Connected to Supabase PostgreSQL Auth' : 'Demo Sandbox Mode Active'}
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white shadow-2xs">
            {isConfigured ? 'Live Supabase' : 'Fast Pass'}
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${mode === 'signup' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition-all ${mode === 'otp' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Verify OTP
          </button>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-slate-700">
            Target Workspace Role ({selectedRole.toUpperCase()})
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'customer', label: 'Customer', desc: 'Order & QR Scan' },
              { id: 'kitchen', label: 'Kitchen Staff', desc: 'KDS Prep Display' },
              { id: 'staff', label: 'Restaurant Staff', desc: 'Floor Plan & Waitlist' },
              { id: 'manager', label: 'Manager / Admin', desc: 'Telemetry & AI' },
            ].map((roleObj) => (
              <button
                key={roleObj.id}
                type="button"
                onClick={() => setSelectedRole(roleObj.id as UserRole)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedRole === roleObj.id
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <p className="font-extrabold text-xs">{roleObj.label}</p>
                <p className={`text-[10px] ${selectedRole === roleObj.id ? 'text-slate-300' : 'text-slate-500'}`}>
                  {roleObj.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="user@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Chef Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="alex@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Secure Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:border-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Registering...' : `Create ${selectedRole.toUpperCase()} Account`}</span>
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email for Verification</label>
              <input
                type="email"
                required
                placeholder="user@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">6-Digit Verification Token / OTP</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-mono font-bold tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Submit OTP Token'}</span>
            </button>
          </form>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-[10px] text-slate-400 uppercase font-extrabold"><span className="bg-white px-2">Third Party OAuth</span></div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleOAuth}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-2xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
          </svg>
          <span>Sign in with Google OAuth</span>
        </button>

        {/* Instant Fast-Pass Demo Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-2 text-center">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Quick Sandbox Role Pass (Instant Access)
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
            <button
              onClick={() => handleQuickDemoLogin('customer')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200"
            >
              Customer
            </button>
            <button
              onClick={() => handleQuickDemoLogin('kitchen')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg border border-amber-200"
            >
              Kitchen
            </button>
            <button
              onClick={() => handleQuickDemoLogin('staff')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200"
            >
              Staff
            </button>
            <button
              onClick={() => handleQuickDemoLogin('manager')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg border border-purple-200"
            >
              Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
