import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Github, AlertCircle, Plus, X, ExternalLink, CheckCircle2, Link } from 'lucide-react';
import { projectsApi, gitApi } from '../services/api';
import clsx from 'clsx';

const PROVIDERS = [
  { key: 'GITHUB', name: 'GitHub', icon: Github, color: 'text-white', bg: 'bg-slate-700', webhookPath: '/api/v1/webhooks/github', description: 'Connect GitHub repos. Commits mentioning task IDs auto-link.' },
  { key: 'BITBUCKET', name: 'Bitbucket', icon: GitBranch, color: 'text-blue-400', bg: 'bg-blue-900/30', webhookPath: '/api/v1/webhooks/bitbucket', description: 'Connect Bitbucket repos and track branches.' },
  { key: 'GITLAB', name: 'GitLab', icon: GitBranch, color: 'text-orange-400', bg: 'bg-orange-900/30', webhookPath: '/api/v1/webhooks/gitlab', description: 'Connect GitLab repos and merge requests.' },
];

function ConnectModal({ provider, projects, onClose }: { provider: typeof PROVIDERS[0]; projects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', name: '', cloneUrl: '', webUrl: '', defaultBranch: 'main' });
  const [saved, setSaved] = useState(false);

  const connect = useMutation({
    mutationFn: () => gitApi.addRepository(form.projectId, { name: form.name, provider: provider.key, cloneUrl: form.cloneUrl, webUrl: form.webUrl, defaultBranch: form.defaultBranch }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repositories'] }); setSaved(true); setTimeout(onClose, 1500); },
  });

  const webhookUrl = `${window.location.origin}${provider.webhookPath}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', provider.bg)}>
              <provider.icon className={clsx('w-5 h-5', provider.color)} />
            </div>
            <h2 className="text-base font-bold text-white">Connect {provider.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        {saved ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <p className="text-sm font-medium text-slate-200">Repository connected!</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Project</label>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Repository Name</label>
              <input className="input" placeholder="e.g. my-app" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Clone URL</label>
              <input className="input font-mono text-xs" placeholder="https://github.com/org/repo.git" value={form.cloneUrl} onChange={(e) => setForm({ ...form, cloneUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Web URL</label>
              <input className="input font-mono text-xs" placeholder="https://github.com/org/repo" value={form.webUrl} onChange={(e) => setForm({ ...form, webUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Default Branch</label>
              <input className="input" placeholder="main" value={form.defaultBranch} onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })} />
            </div>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Link className="w-3 h-3" /> Webhook URL (copy to {provider.name})</p>
              <div className="flex items-center gap-2">
                <code className="text-[10px] text-indigo-300 font-mono flex-1 break-all">{webhookUrl}</code>
                <button onClick={() => navigator.clipboard.writeText(webhookUrl)} className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-700 rounded flex-shrink-0">Copy</button>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => connect.mutate()} disabled={!form.name || !form.cloneUrl || !form.projectId || connect.isPending}>
                {connect.isPending ? 'Connecting…' : 'Connect'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const { data: repositories = [] } = useQuery({ queryKey: ['repositories'], queryFn: () => gitApi.listRepositories() });

  const activeProvider = PROVIDERS.find((p) => p.key === activeModal);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-white">Git Integrations</h1>

      <div className="card border-amber-600/30 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-slate-300 space-y-1">
          <p>Auto-link commits to tasks by including the task number in your commit message:</p>
          <code className="text-indigo-400 bg-slate-700 px-2 py-0.5 rounded text-xs">git commit -m "PROJ-42 fix payment calculation"</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const repos = repositories.filter((r: any) => r.provider === p.key);
          return (
            <div key={p.key} className="card flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', p.bg)}>
                  <p.icon className={clsx('w-5 h-5', p.color)} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                  <p className="text-[10px] text-slate-500">{repos.length} repo{repos.length !== 1 ? 's' : ''} connected</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex-1">{p.description}</p>
              {repos.length > 0 && (
                <div className="space-y-1.5">
                  {repos.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                      <GitBranch className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-300 flex-1 truncate">{r.name}</span>
                      {r.webUrl && <a href={r.webUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300"><ExternalLink className="w-3 h-3" /></a>}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setActiveModal(p.key)} className="btn-secondary w-full flex items-center justify-center gap-2 text-xs">
                <Plus className="w-3.5 h-3.5" /> Connect Repository
              </button>
            </div>
          );
        })}
      </div>

      {activeProvider && (
        <ConnectModal provider={activeProvider} projects={projects} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
