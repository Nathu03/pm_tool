import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp, Zap } from 'lucide-react';

const STAT_CARDS = [
  { key: 'total',       label: 'Total Tasks',    icon: CheckCircle,   color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { key: 'inProgress',  label: 'In Progress',    icon: Clock,         color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { key: 'uat',         label: 'UAT',            icon: TrendingUp,    color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { key: 'aiReview',    label: 'AI Review',      icon: Zap,           color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { key: 'qaBaReview',  label: 'QA/BA Review',   icon: Users,         color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  { key: 'completed',   label: 'Completed',      icon: CheckCircle,   color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  { key: 'blocked',     label: 'Blocked',        icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10' },
  { key: 'overdue',     label: 'Overdue',        icon: AlertTriangle, color: 'text-rose-400',   bg: 'bg-rose-500/10' },
];

function StatSkeleton() {
  return <div className="card animate-pulse"><div className="h-16 bg-slate-700/50 rounded" /></div>;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.getStats() });

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Project overview and team performance</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)
          : STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
            <div key={key} className="card flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{(stats as any)?.[key] ?? 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))
        }
      </div>
      {stats?.teamPerformance && stats.teamPerformance.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Team Performance</h2>
          <div className="space-y-2">
            {stats.teamPerformance.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                  {m.fullName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{m.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">@{m.username}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-white">{m.activeTasks}</p>
                  <p className="text-[10px] text-slate-500">active tasks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
