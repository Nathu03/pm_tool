import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { CheckCircle2, Clock, AlertCircle, Bot, Eye, ListTodo, Layers, Users } from 'lucide-react';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardApi.getStats() });
  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card animate-pulse h-24" />)}</div>;
  if (!data) return null;
  const cards = [
    { label: 'Total', value: data.total, icon: Layers },
    { label: 'In Progress', value: data.inProgress, icon: Clock },
    { label: 'UAT', value: data.uat, icon: Eye },
    { label: 'AI Review', value: data.aiReview, icon: Bot },
    { label: 'QA/BA', value: data.qaBaReview, icon: Eye },
    { label: 'Completed', value: data.completed, icon: CheckCircle2 },
    { label: 'Blocked', value: data.blocked, icon: AlertCircle },
    { label: 'Overdue', value: data.overdue, icon: AlertCircle },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card"><div className="flex items-center justify-between mb-3"><span className="text-xs text-slate-400">{label}</span><Icon className="w-4 h-4 text-slate-400" /></div><p className="text-2xl font-bold text-white">{value ?? 0}</p></div>
        ))}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">Team Performance</h2></div>
        {(data.teamPerformance || []).map((m: any) => (
          <div key={m.id} className="flex items-center justify-between py-2 border-t border-slate-700 first:border-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">{m.fullName[0]}</div>
              <div><p className="text-sm font-medium text-slate-200">{m.fullName}</p><p className="text-xs text-slate-500">@{m.username}</p></div>
            </div>
            <div className="flex gap-4">
              <div className="text-right"><p className="text-xs text-slate-400">Active</p><p className="text-sm font-semibold text-white">{m.activeTasks}</p></div>
              <div className="text-right"><p className="text-xs text-slate-400">In Progress</p><p className="text-sm font-semibold text-blue-400">{m.inProgress}</p></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
