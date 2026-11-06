import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, MessageSquare, GitBranch, Send, CornerDownRight, Edit2, Trash2 } from 'lucide-react';
import { tasksApi, commentsApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  BACKLOG: 'bg-slate-600/40 text-slate-300 border-slate-600',
  TODO: 'bg-blue-600/20 text-blue-300 border-blue-600/40',
  IN_PROGRESS: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
  UAT: 'bg-orange-600/20 text-orange-300 border-orange-600/40',
  AI_REVIEW: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
  QA_BA_REVIEW: 'bg-pink-600/20 text-pink-300 border-pink-600/40',
  COMPLETED: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40',
  BLOCKED: 'bg-red-600/20 text-red-300 border-red-600/40',
};

const NEXT_STATUS: Record<string, string[]> = {
  BACKLOG: ['TODO'],
  TODO: ['IN_PROGRESS', 'BACKLOG'],
  IN_PROGRESS: ['UAT', 'BLOCKED', 'TODO'],
  UAT: ['AI_REVIEW', 'IN_PROGRESS'],
  AI_REVIEW: ['QA_BA_REVIEW', 'IN_PROGRESS'],
  QA_BA_REVIEW: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: ['REOPENED'],
  BLOCKED: ['IN_PROGRESS'],
  REOPENED: ['TODO'],
};

function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={clsx(sizeClass, 'rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0')}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function CommentItem({ comment, taskId, depth = 0 }: { comment: any; taskId: string; depth?: number }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const addReply = useMutation({
    mutationFn: () => commentsApi.create(taskId, replyText, comment.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', taskId] }); setReplying(false); setReplyText(''); },
  });
  const editComment = useMutation({
    mutationFn: () => commentsApi.update(comment.id, editText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', taskId] }); setEditing(false); },
  });
  const deleteComment = useMutation({
    mutationFn: () => commentsApi.remove(comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  return (
    <div className={clsx('flex gap-3', depth > 0 && 'ml-8 mt-2')}>
      {depth > 0 && <CornerDownRight className="w-3 h-3 text-slate-600 mt-3 flex-shrink-0" />}
      <Avatar name={comment.author?.fullName || '?'} size={depth === 0 ? 7 : 6} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-200">{comment.author?.fullName}</span>
          <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          {comment.editedAt && <span className="text-[10px] text-slate-600 italic">edited</span>}
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea className="input text-xs resize-none" rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary text-xs py-1 px-3" onClick={() => editComment.mutate()} disabled={editComment.isPending}>Save</button>
              <button className="btn-secondary text-xs py-1 px-3" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.body}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          {depth < 3 && (
            <button onClick={() => setReplying(!replying)} className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors">
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
          {user?.id === comment.authorId && (
            <>
              <button onClick={() => setEditing(true)} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => deleteComment.mutate()} className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          )}
        </div>
        {replying && (
          <div className="mt-2 flex gap-2">
            <input className="input text-xs flex-1" placeholder="Write a reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addReply.mutate()} />
            <button className="btn-primary px-3 py-1" onClick={() => addReply.mutate()} disabled={!replyText.trim()}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {(comment.replies || []).map((r: any) => (
          <CommentItem key={r.id} comment={r} taskId={taskId} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}

export default function TaskPreviewModal({ taskId, projectId, onClose }: { taskId: string; projectId: string; onClose: () => void }) {
  const [newComment, setNewComment] = useState('');
  const qc = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => tasksApi.update(projectId, taskId, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', taskId] }); qc.invalidateQueries({ queryKey: ['tasks', projectId] }); },
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create(taskId, newComment),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', taskId] }); setNewComment(''); },
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : task ? (
          <>
            <div className="flex items-start gap-3 p-5 border-b border-slate-700 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">{task.taskNumber}</span>
                  <span className={clsx('badge border text-xs', STATUS_STYLES[task.status])}>{task.status.replace(/_/g, ' ')}</span>
                </div>
                <h2 className="text-base font-bold text-white leading-snug">{task.title}</h2>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {NEXT_STATUS[task.status]?.length > 0 && (
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-700 bg-slate-800/50 flex-shrink-0 flex-wrap">
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Move to:</span>
                {NEXT_STATUS[task.status].map((s) => (
                  <button key={s} onClick={() => updateStatus.mutate(s)} disabled={updateStatus.isPending}
                    className={clsx('text-xs px-3 py-1 rounded-full border transition-all hover:opacity-80', STATUS_STYLES[s])}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-6">
                {task.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">{task.description}</p>
                  </div>
                )}

                {task.acceptanceCriteria && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Acceptance Criteria</h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">{task.acceptanceCriteria}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[['Priority', task.priority], ['Due Date', task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'], ['Est. Hours', task.estimatedHours ?? '—'], ['Actual Hours', task.actualHours ?? '—']].map(([label, value]) => (
                    <div key={label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">{label}</p>
                      <p className="text-sm font-medium text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>

                {task.assignees?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assignees</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((a: any) => (
                        <div key={a.user.id} className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
                          <Avatar name={a.user.fullName} size={5} />
                          <span className="text-xs text-slate-300">{a.user.fullName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.branches?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" /> Branches</h3>
                    <div className="space-y-1">
                      {task.branches.map((b: any) => (
                        <div key={b.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700/50">
                          <GitBranch className="w-3 h-3 text-slate-500" />
                          <span className="text-xs font-mono text-slate-300">{b.branchName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Comments ({task.comments?.length || 0})
                  </h3>
                  <div className="space-y-4 mb-4">
                    {(task.comments || []).map((c: any) => (
                      <CommentItem key={c.id} comment={c} taskId={taskId} />
                    ))}
                    {!task.comments?.length && (
                      <p className="text-xs text-slate-600 italic text-center py-4">No comments yet. Be the first!</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <textarea
                      className="input text-sm flex-1 resize-none"
                      rows={2}
                      placeholder="Add a comment…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment.mutate(); }}
                    />
                    <button className="btn-primary px-3 self-end" onClick={() => addComment.mutate()} disabled={!newComment.trim() || addComment.isPending}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Ctrl+Enter to submit</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">Task not found</div>
        )}
      </div>
    </div>
  );
}
