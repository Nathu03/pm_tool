import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, GitBranch, MessageSquare } from 'lucide-react';
import { tasksApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'bg-slate-600/40 text-slate-300',
  TODO: 'bg-blue-600/20 text-blue-300',
  IN_PROGRESS: 'bg-amber-600/20 text-amber-300',
  UAT: 'bg-orange-600/20 text-orange-300',
  AI_REVIEW: 'bg-purple-600/20 text-purple-300',
  QA_BA_REVIEW: 'bg-pink-600/20 text-pink-300',
  COMPLETED: 'bg-emerald-600/20 text-emerald-300',
  BLOCKED: 'bg-red-600/20 text-red-300',
};

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const { data: task, isLoading } = useQuery({ queryKey: ['task', taskId], queryFn: () => tasksApi.get(taskId!), enabled: !!taskId });

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!task) return (
    <div className="h-full flex items-center justify-center text-slate-500">Task not found</div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500">{task.taskNumber}</span>
              <span className={clsx('badge text-xs', STATUS_COLORS[task.status])}>{task.status.replace(/_/g, ' ')}</span>
              <span className="text-xs text-slate-500">{task.priority} priority</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{task.title}</h1>
          </div>
          {task.description && (
            <div className="card">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
          )}
          {task.acceptanceCriteria && (
            <div className="card">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Acceptance Criteria</h2>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{task.acceptanceCriteria}</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['Due Date', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'], ['Est. Hours', task.estimatedHours ?? '—'], ['Actual Hours', task.actualHours ?? '—'], ['Created', formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })]].map(([label, value]) => (
              <div key={String(label)} className="card">
                <p className="text-[10px] text-slate-500 uppercase mb-1">{label}</p>
                <p className="text-sm font-medium text-slate-200">{value}</p>
              </div>
            ))}
          </div>
          {task.assignees?.length > 0 && (
            <div className="card">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assignees</h2>
              <div className="flex flex-wrap gap-2">
                {task.assignees.map((a: any) => (
                  <div key={a.user.id} className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300">{a.user.fullName?.[0]}</div>
                    <span className="text-xs text-slate-300">{a.user.fullName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {task.branches?.length > 0 && (
            <div className="card">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Branches</h2>
              <div className="space-y-2">
                {task.branches.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                    <GitBranch className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-mono text-slate-300">{b.branchName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {task.comments?.length > 0 && (
            <div className="card">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Comments ({task.comments.length})
              </h2>
              <div className="space-y-3">
                {task.comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">{c.author?.fullName?.[0]}</div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-200">{c.author?.fullName}</span>
                        <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
