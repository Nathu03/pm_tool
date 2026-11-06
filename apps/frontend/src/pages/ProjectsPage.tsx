import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { FolderKanban, ArrowRight, Plus, X } from 'lucide-react';
import clsx from 'clsx';

const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] });
  const create = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); onClose(); },
  });
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Project Name</label>
            <input className="input" placeholder="e.g. Mobile App v2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea className="input" rows={2} placeholder="What is this project about?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })} className={clsx('w-7 h-7 rounded-full transition-all', form.color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'hover:scale-110')} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>{create.isPending ? 'Creating…' : 'Create Project'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });

  if (isLoading) return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map((i) => <div key={i} className="card h-40 animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Projects</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Project</button>
      </div>
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium mb-1">No projects yet</p>
          <p className="text-sm text-slate-600 mb-5">Create your first project to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <button key={p.id} onClick={() => navigate(`/projects/${p.id}/board`)} className="card text-left hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (p.color || '#6366f1') + '22', border: `1px solid ${p.color || '#6366f1'}44` }}>
                  <FolderKanban className="w-5 h-5" style={{ color: p.color || '#6366f1' }} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
              {p.description && <p className="text-xs text-slate-400 line-clamp-2 mb-3">{p.description}</p>}
              <div className="flex gap-3 pt-3 border-t border-slate-700/70 mt-auto">
                <span className="text-xs text-slate-500">{p._count?.tasks || 0} tasks</span>
                <span className="text-xs text-slate-500">{p._count?.members || 0} members</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
