import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trello } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { user, accessToken } = await authApi.login(email, password);
      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch { setError('Invalid email or password'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4"><Trello className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">TaskFlow AI</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your workspace</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
            <div><label className="block text-xs font-medium text-slate-400 mb-1">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
