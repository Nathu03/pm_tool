import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../services/api';
import { Clock, GitBranch, MessageSquare } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'bg-slate-600 text-slate-200', TODO: 'bg-blue-600/30 text-blue-300', IN_PROGRESS: 'bg-yellow-600/30 text-yellow-300',
  UAT: 'bg-orange-600/30 text-orange-300', AI_REVIEW: 'bg-purple-600/30 text-purple-300', QA_BA_REVIEW: 'bg-pink-600/30 text-pink-300',
  COMPLETED: 'bg-emerald-600/30 text-emerald-300', BLOCKED: 'bg-red-600/30 text-red-300',
};

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { data: task, isLoading } = useQuery({ queryKey: ['task', taskId], queryFn: () => tasksApi.get(taskId!), enabled: !!taskId });
  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;
  if (!task) return <div className="text-slate-400 text-sm">Task not found</div>;
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2"><span className="text-xs font-mono text-slate-500">{task.taskNumber}</span><span className={`badge ${STATUS_COLORS[task.status]}`}>{task.status.replace(/_/g,' ')}</span></div>
        <h1 className="text-xl font-bold text-white">{task.title}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {task.description && <div className="card"><h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Description</h3><p className="text-sm text-slate-300 whitespace-pre-wrap">{task.description}</p></div>}
          {task.acceptanceCriteria && <div className="card"><h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Acceptance Criteria</h3><p className="text-sm text-slate-300 whitespace-pre-wrap">{task.acceptanceCriteria}</p></div>}
          <div className="card">
            <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-indigo-400" /><h3 className="text-sm font-semibold text-white">Comments ({task.comments?.length || 0})</h3></div>
            {(task.comments || []).map((c: any) => (
              <div key={c.id} className="border-t border-slate-700 py-3 first:border-0">
                <div className="flex items-center gap-2 mb-2"><div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">{c.author.fullName[0]}</div><span className="text-xs font-medium text-slate-300">{c.author.fullName}</span></div>
                <p className="text-sm text-slate-300 ml-8">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card"><h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Assignees</h3>{(task.assignees||[]).map((a:any)=>(<div key={a.user.id} className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">{a.user.fullName[0]}</div><span className="text-xs text-slate-300">{a.user.fullName}</span></div>))}</div>
          {task.branches?.length > 0 && <div className="card"><div className="flex items-center gap-2 mb-3"><GitBranch className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-semibold text-slate-400 uppercase">Branches</h3></div>{task.branches.map((b:any)=><p key={b.id} className="text-xs font-mono text-slate-300">{b.branchName}</p>)}</div>}
          <div className="card"><div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-semibold text-slate-400 uppercase">Time</h3></div><div className="space-y-1 text-xs"><div className="flex justify-between"><span className="text-slate-400">Estimated</span><span className="text-slate-300">{task.estimatedHours||'—'} hrs</span></div><div className="flex justify-between"><span className="text-slate-400">Actual</span><span className="text-slate-300">{task.actualHours||'—'} hrs</span></div></div></div>
        </div>
      </div>
    </div>
  );
}
