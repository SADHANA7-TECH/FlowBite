import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Shield, Key, Mail, Lock, LogIn, LogOut, CheckCircle2, AlertCircle, Database, Sparkles, ExternalLink } from 'lucide-react';
import { UserRole } from '../types';

interface SupabaseAuthModalProps {
  onClose: () => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  onClose,
  activeRole,
  onRoleChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const isConfigured = isSupabaseConfigured();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setAuthError('Supabase API credentials are not configured in environment variables.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: activeRole },
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccessMsg('Sign-up email sent! Check your inbox or proceed to login.');
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setAuthError('Supabase API credentials are not configured in environment variables.');
      return;
    }
    setLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccessMsg('Successfully logged in via Supabase Auth!');
    }
    setLoading(false);
  };

  const handleGoogleOAuth = async () => {
    if (!isConfigured) {
      setAuthError('Supabase API credentials are not configured in environment variables.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setAuthError(error.message);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setAuthSuccessMsg('Logged out from Supabase Auth.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Supabase Auth & Database Control</h2>
              <p className="text-xs text-slate-400">PostgreSQL Cloud Persistence & OAuth Gateway</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${isConfigured ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/40 border-amber-500/40 text-amber-200'}`}>
          <div className="flex items-center justify-between font-extrabold">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Supabase Status: {isConfigured ? 'Connected & Live' : 'Local Demo Mode (Fallback Active)'}</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/40">
              {isConfigured ? 'Production PG' : 'Standard In-Memory'}
            </span>
          </div>
          <p className="opacity-80">
            {isConfigured
              ? 'Using connected Supabase PostgreSQL database and Realtime channel subscriptions.'
              : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect your live Supabase cloud project.'}
          </p>
        </div>

        {/* Auth User Details or Form */}
        {currentUser ? (
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Logged in Supabase Account:</span>
              <span className="text-emerald-400 font-mono font-bold">{currentUser.email}</span>
            </div>
            <p className="text-slate-400 text-[11px]">User ID: <code className="text-slate-200">{currentUser.id}</code></p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSignOut}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Supabase</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Email & Password Authentication</span>
            </div>

            <form className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="manager@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {authError && (
                <p className="text-rose-400 text-[11px] font-semibold flex items-center space-x-1 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}

              {authSuccessMsg && (
                <p className="text-emerald-400 text-[11px] font-semibold flex items-center space-x-1 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleEmailLogin}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={handleEmailSignUp}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] text-slate-500 uppercase"><span className="bg-slate-900 px-2 font-bold">Or Continue With</span></div>
            </div>

            <button
              onClick={handleGoogleOAuth}
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
              </svg>
              <span>Sign in with Google OAuth</span>
            </button>
          </div>
        )}

        {/* Schema SQL export notice */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-extrabold text-slate-300">Deployment Blueprint:</p>
          <p>Full DDL SQL schema is available in <code className="text-amber-300">/supabase/schema.sql</code> inside the workspace for quick import into Supabase Console.</p>
        </div>
      </div>
    </div>
  );
};
