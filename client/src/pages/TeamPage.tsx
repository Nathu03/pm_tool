import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../services/api';
import { UserCheck, UserX, Shield } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  PROJECT_MANAGER: 'bg-blue-600/20 text-blue-300 border-blue-600/40',
  DEVELOPER: 'bg-green-600/20 text-green-300 border-green-600/40',
  QA: 'bg-orange-600/20 text-orange-300 border-orange-600/40',
  BUSINESS_ANALYST: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/40',
  VIEWER: 'bg-slate-600/20 text-slate-300 border-slate-600/40',
};

const ROLES = ['ADMIN','PROJECT_MANAGER','DEVELOPER','QA','BUSINESS_ANALYST','VIEWER'];

export default function TeamPage() {
  const qc = useQueryClient();
  const { user: me } = useAuthStore();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Team</h1>
        <p className="text-sm text-slate-400 mt-0.5">{(users as any[]).length} members</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {(users as any[]).map((u) => (
            <div key={u.id} className={clsx('card flex items-center gap-4', !u.isActive && 'opacity-50')}>
              <div className="w-9 h-9 rounded-full bg-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
                {u.fullName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
              </div>
              <span className={clsx('badge border text-[10px]', ROLE_COLORS[u.role] ?? ROLE_COLORS.VIEWER)}>{u.role?.replace(/_/g, ' ')}</span>
              {me?.role === 'ADMIN' && u.id !== me.id && (
                <div className="flex items-center gap-2">
                  <select
                    className="input text-xs py-1 px-2"
                    value={u.role}
                    onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value })}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                  <button
                    onClick={() => deactivate.mutate(u.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                    title={u.isActive ? 'Deactivate' : 'Deactivated'}
                  >
                    {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
