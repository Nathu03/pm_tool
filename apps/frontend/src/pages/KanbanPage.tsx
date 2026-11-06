import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import { Plus } from 'lucide-react';

const COLUMNS = [
  { status: 'BACKLOG', label: 'Backlog', color: 'bg-slate-500' },
  { status: 'TODO', label: 'To Do', color: 'bg-blue-500' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { status: 'UAT', label: 'UAT', color: 'bg-orange-500' },
  { status: 'AI_REVIEW', label: 'AI Review', color: 'bg-purple-500' },
  { status: 'QA_BA_REVIEW', label: 'QA/BA', color: 'bg-pink-500' },
  { status: 'COMPLETED', label: 'Done', color: 'bg-emerald-500' },
];

const PRIORITY_COLORS: Record<string, string> = { CRITICAL: 'text-red-400', HIGH: 'text-orange-400', MEDIUM: 'text-yellow-400', LOW: 'text-slate-400' };

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => tasksApi.list(projectId!), enabled: !!projectId });
  if (isLoading) return <div className="text-slate-400 text-sm">Loading board…</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Kanban Board</h1>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Task</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(({ status, label, color }) => {
          const col = tasks.filter((t: any) => t.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3"><span className={`w-2 h-2 rounded-full ${color}`} /><span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{label}</span><span className="ml-auto text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{col.length}</span></div>
              <div className="space-y-2 min-h-[100px]">
                {col.map((task: any) => (
                  <div key={task.id} className="card cursor-pointer hover:border-indigo-500/50 transition-colors">
                    <div className="flex justify-between gap-2 mb-2"><span className="text-xs text-slate-500 font-mono">{task.taskNumber}</span><span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></div>
                    <p className="text-sm text-slate-200 font-medium line-clamp-2">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
