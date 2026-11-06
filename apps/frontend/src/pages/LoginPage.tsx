import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trello, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, accessToken } = await authApi.login(email, password);
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-xl shadow-indigo-900/50">
            <Trello className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TaskFlow AI</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your workspace</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
            <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">TaskFlow AI · Project Management Platform</p>
      </div>
    </div>
  );
}
