import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { CheckCircle2, Clock, AlertCircle, Bot, Eye, Layers, Users, TrendingUp, AlertTriangle } from 'lucide-react';

const STAT_CONFIGS = [
  { key: 'total',      label: 'Total Tasks',  icon: Layers,       color: 'text-slate-400',   bg: 'bg-slate-500/20',    border: 'border-slate-500/30' },
  { key: 'inProgress', label: 'In Progress',  icon: Clock,        color: 'text-amber-400',   bg: 'bg-amber-500/10',    border: 'border-amber-500/20' },
  { key: 'uat',        label: 'UAT',          icon: Eye,          color: 'text-orange-400',  bg: 'bg-orange-500/10',   border: 'border-orange-500/20' },
  { key: 'aiReview',   label: 'AI Review',    icon: Bot,          color: 'text-purple-400',  bg: 'bg-purple-500/10',   border: 'border-purple-500/20' },
  { key: 'qaBaReview', label: 'QA / BA',      icon: Eye,          color: 'text-pink-400',    bg: 'bg-pink-500/10',     border: 'border-pink-500/20' },
  { key: 'completed',  label: 'Completed',    icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20' },
  { key: 'blocked',    label: 'Blocked',      icon: AlertCircle,  color: 'text-red-400',     bg: 'bg-red-500/10',      border: 'border-red-500/20' },
  { key: 'overdue',    label: 'Overdue',      icon: AlertTriangle,color: 'text-rose-400',    bg: 'bg-rose-500/10',     border: 'border-rose-500/20' },
];

// Progress bar color map — avoids dynamic class interpolation
const PROGRESS_BG: Record<string, string> = {
  'text-amber-400': 'bg-amber-400',
  'text-orange-400': 'bg-orange-400',
  'text-purple-400': 'bg-purple-400',
  'text-pink-400': 'bg-pink-400',
  'text-emerald-400': 'bg-emerald-400',
  'text-red-400': 'bg-red-400',
  'text-rose-400': 'bg-rose-400',
  'text-slate-400': 'bg-slate-400',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse h-28" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const total = data.total || 1;
  const completionRate = Math.round(((data.completed || 0) / total) * 100);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">{completionRate}%</span>
          <span className="text-xs text-slate-500">completion rate</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CONFIGS.map(({ key, label, icon: Icon, color, bg, border }) => (
          <div key={key} className={`card border ${border} ${bg}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{(data as any)[key] ?? 0}</p>
            {key !== 'total' && data.total > 0 && (
              <div className="mt-2">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${PROGRESS_BG[color] || 'bg-slate-400'}`}
                    style={{ width: `${Math.round(((data as any)[key] || 0) / data.total * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">{Math.round(((data as any)[key] || 0) / data.total * 100)}% of total</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Team Performance</h2>
          <span className="text-xs text-slate-500 ml-auto">Active / In Progress</span>
        </div>
        {(data.teamPerformance || []).length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-6 italic">No team data available</p>
        ) : (
          <div className="space-y-3">
            {(data.teamPerformance || []).map((m: any) => (
              <div key={m.id} className="flex items-center gap-4 py-3 border-t border-slate-700/60 first:border-0">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
                  {m.fullName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{m.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">@{m.username}</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="text-center"><p className="text-xs font-bold text-slate-200">{m.activeTasks}</p><p className="text-[9px] text-slate-500">Active</p></div>
                  <div className="text-center"><p className="text-xs font-bold text-amber-400">{m.inProgress}</p><p className="text-[9px] text-slate-500">Working</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
