import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';
import { Settings, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const changePass = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => { setMsg({ type: 'success', text: 'Password changed successfully.' }); setCurrentPassword(''); setNewPassword(''); setConfirm(''); },
    onError: (e: any) => setMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to change password.' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    changePass.mutate();
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" /> Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account preferences</p>
      </div>
      <div className="max-w-md space-y-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Full Name</p>
              <p className="text-sm text-slate-200">{user?.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Email</p>
              <p className="text-sm text-slate-200">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Username</p>
              <p className="text-sm text-slate-200">@{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Role</p>
              <p className="text-sm text-slate-200">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /> Change Password</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Current Password</label>
              <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">New Password</label>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Confirm New Password</label>
              <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {msg && (
              <p className={`text-sm px-3 py-2 rounded-lg border ${
                msg.type === 'success' ? 'text-green-300 bg-green-900/20 border-green-800/40' : 'text-red-300 bg-red-900/20 border-red-800/40'
              }`}>{msg.text}</p>
            )}
            <button className="btn-primary w-full" type="submit" disabled={changePass.isPending}>
              {changePass.isPending ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
