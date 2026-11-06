import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Users, Workflow, Plus, X, Shield } from 'lucide-react';
import { usersApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const ROLES = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEAD', 'DEVELOPER', 'QA_BA'] as const;
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-600/20 text-red-300 border-red-600/40',
  PROJECT_MANAGER: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  TEAM_LEAD: 'bg-blue-600/20 text-blue-300 border-blue-600/40',
  DEVELOPER: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  QA_BA: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
};

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', username: '', fullName: '', password: '', role: 'DEVELOPER' });
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to create user'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Create User</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="johndoe" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!form.email || !form.username || !form.fullName || !form.password || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Key className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">AI Configuration</h2></div>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">OpenAI API Key</label><input className="input" type="password" placeholder="sk-…" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">AI Provider</label><select className="input"><option>OpenAI (GPT-4o)</option><option>DeepSeek</option><option>Grok</option><option>Claude</option></select></div>
          <button className="btn-primary text-xs">Save Configuration</button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">User Management</h2><span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{users.length}</span></div>
          {isAdmin && <button onClick={() => setShowCreateUser(true)} className="btn-primary text-xs flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> New User</button>}
        </div>
        <div className="space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl border border-slate-700/60">
              <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">{u.fullName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{u.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              {isAdmin && u.id !== currentUser?.id ? (
                <select
                  value={u.role}
                  onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                  className={clsx('text-xs px-2 py-1 rounded-full border bg-transparent cursor-pointer', ROLE_COLORS[u.role])}
                >
                  {ROLES.map((r) => <option key={r} value={r} className="bg-slate-800 text-slate-200">{r.replace(/_/g, ' ')}</option>)}
                </select>
              ) : (
                <span className={clsx('badge border text-xs', ROLE_COLORS[u.role])}>{u.role.replace(/_/g, ' ')}</span>
              )}
              {isAdmin && u.id !== currentUser?.id && (
                <button onClick={() => { if (confirm(`Deactivate ${u.fullName}?`)) deactivate.mutate(u.id); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded">Deactivate</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Workflow className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">Workflow Statuses</h2></div>
        <div className="flex flex-wrap gap-2">
          {['Backlog', 'To Do', 'In Progress', 'UAT', 'AI Review', 'QA/BA Review', 'Completed', 'Blocked', 'Reopened'].map((s) => (
            <span key={s} className="badge bg-slate-700 text-slate-300 border border-slate-600">{s}</span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Status transitions enforced: BACKLOG → TODO → IN_PROGRESS → UAT → AI_REVIEW → QA_BA_REVIEW → COMPLETED</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">Role Permissions</h2></div>
        <div className="space-y-2">
          {[
            { role: 'ADMIN', perms: 'Full access: manage users, projects, settings, all tasks' },
            { role: 'PROJECT_MANAGER', perms: 'Manage projects, assign tasks, view all reports' },
            { role: 'TEAM_LEAD', perms: 'Manage team tasks, approve status transitions, code review' },
            { role: 'DEVELOPER', perms: 'Create & update own tasks, link commits, comment' },
            { role: 'QA_BA', perms: 'Review QA_BA tasks, approve for completion, add test notes' },
          ].map(({ role, perms }) => (
            <div key={role} className="flex items-start gap-3 py-2 border-t border-slate-700 first:border-0">
              <span className={clsx('badge border text-[10px] flex-shrink-0 mt-0.5', ROLE_COLORS[role])}>{role.replace(/_/g, ' ')}</span>
              <p className="text-xs text-slate-400">{perms}</p>
            </div>
          ))}
        </div>
      </div>

      {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} />}
    </div>
  );
}
