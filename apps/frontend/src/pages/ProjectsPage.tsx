import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { FolderKanban, ArrowRight, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.list });
  if (isLoading) return <div className="text-slate-400 text-sm">Loading…</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Projects</h1>
        <button className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Project</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((p: any) => (
          <button key={p.id} onClick={() => navigate(`/projects/${p.id}/board`)} className="card text-left hover:border-indigo-500/50 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: p.color + '33' }}><FolderKanban className="w-5 h-5" style={{ color: p.color }} /></div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
            {p.description && <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>}
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">{p._count?.tasks || 0} tasks</span>
              <span className="text-xs text-slate-500">{p._count?.members || 0} members</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
