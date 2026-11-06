import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services/api';

export default function TeamPage() {
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Team</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u: any) => (
          <div key={u.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300">{u.fullName[0]}</div>
            <div><p className="text-sm font-semibold text-white">{u.fullName}</p><p className="text-xs text-slate-400">@{u.username}</p><p className="text-xs text-slate-500 mt-0.5">{u.role}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
