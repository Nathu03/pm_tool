import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, Users } from 'lucide-react';
import { projectsApi } from '../services/api';
import clsx from 'clsx';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#06b6d4'];

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const create = useMutation({
    mutationFn: () => projectsApi.create({ name, description, color }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">Create Project</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
            <input className="input" placeholder="My awesome project" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What is this project about?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={clsx('w-6 h-6 rounded-full transition-transform', color === c ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110' : 'hover:scale-105')} style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });

  const remove = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card animate-pulse h-32 bg-slate-800" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No projects yet</p>
          <p className="text-slate-600 text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects as any[]).map((p) => (
            <div key={p.id} className="card group hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: p.color + '25', borderColor: p.color + '40' }}>
                  <FolderKanban className="w-4.5 h-4.5" style={{ color: p.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{p.slug}</p>
                </div>
                <button onClick={() => remove.mutate(p.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1" title="Delete project">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {p.description && <p className="text-sm text-slate-400 mb-3 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {p._count?.members ?? 0} members
                </div>
                <Link to={`/projects/${p.id}/kanban`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Open board →</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
