import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import { tasksApi, usersApi } from '../services/api';
import clsx from 'clsx';

const STATUSES = ['BACKLOG','TODO','IN_PROGRESS','UAT','AI_REVIEW','QA_BA_REVIEW','COMPLETED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

export default function CreateTaskModal({ projectId, defaultStatus = 'BACKLOG', onClose }: { projectId: string; defaultStatus?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', acceptanceCriteria: '', priority: 'MEDIUM', status: defaultStatus, dueDate: '', estimatedHours: '', assigneeIds: [] as string[] });

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });

  const create = useMutation({
    mutationFn: () => tasksApi.create(projectId, { ...form, estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined, dueDate: form.dueDate || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks', projectId] }); onClose(); },
  });

  const toggleAssignee = (id: string) => {
    setForm((f) => ({ ...f, assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter((x) => x !== id) : [...f.assigneeIds, id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-400" /> Create Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Title <span className="text-red-400">*</span></label>
            <input className="input" placeholder="Short, descriptive title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What needs to be done?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Acceptance Criteria</label>
            <textarea className="input resize-none" rows={3} placeholder="When is this task done?" value={form.acceptanceCriteria} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Est. Hours</label>
              <input className="input" type="number" min="0" placeholder="0" value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} />
            </div>
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {users.map((u: any) => (
                  <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                    className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all', form.assigneeIds.includes(u.id) ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500')}>
                    <div className="w-4 h-4 rounded-full bg-indigo-500/40 flex items-center justify-center text-[9px] font-bold">{u.fullName[0]}</div>
                    {u.fullName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!form.title.trim() || create.isPending}>
            {create.isPending ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
