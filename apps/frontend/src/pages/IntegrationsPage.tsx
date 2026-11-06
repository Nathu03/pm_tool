import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch, Github, AlertCircle, Plus, X, ExternalLink,
  CheckCircle2, Link, GitCommit, GitPullRequest, RefreshCw,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { projectsApi, gitApi } from '../services/api';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const PROVIDERS = [
  {
    key: 'GITHUB',
    name: 'GitHub',
    icon: Github,
    color: 'text-white',
    bg: 'bg-slate-700',
    border: 'border-slate-600',
    webhookPath: '/api/v1/webhooks/github',
    webhookEvents: ['push', 'pull_request'],
    description: 'Auto-link commits and PRs to tasks via task number in commit message.',
    placeholder: { clone: 'https://github.com/org/repo.git', web: 'https://github.com/org/repo' },
  },
  {
    key: 'BITBUCKET',
    name: 'Bitbucket',
    icon: GitBranch,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-700/40',
    webhookPath: '/api/v1/webhooks/bitbucket',
    webhookEvents: ['repo:push', 'pullrequest:created', 'pullrequest:updated'],
    description: 'Connect Bitbucket repos. Auto-link via smart commit syntax.',
    placeholder: { clone: 'https://bitbucket.org/workspace/repo.git', web: 'https://bitbucket.org/workspace/repo' },
  },
  {
    key: 'GITLAB',
    name: 'GitLab',
    icon: GitBranch,
    color: 'text-orange-400',
    bg: 'bg-orange-900/20',
    border: 'border-orange-700/40',
    webhookPath: '/api/v1/webhooks/gitlab',
    webhookEvents: ['Push Hook', 'Merge Request Hook'],
    description: 'Connect GitLab repos and track merge requests.',
    placeholder: { clone: 'https://gitlab.com/group/repo.git', web: 'https://gitlab.com/group/repo' },
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={clsx('text-[10px] px-2 py-1 rounded flex-shrink-0 transition-all', copied ? 'bg-emerald-700/40 text-emerald-300' : 'bg-slate-700 text-slate-400 hover:text-slate-200')}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function ConnectModal({ provider, projects, onClose }: { provider: typeof PROVIDERS[0]; projects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ projectId: projects[0]?.id || '', name: '', cloneUrl: '', webUrl: '', defaultBranch: 'main' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = `${window.location.origin}${provider.webhookPath}`;

  const connect = useMutation({
    mutationFn: () => gitApi.addRepository(form.projectId, { name: form.name, provider: provider.key, cloneUrl: form.cloneUrl, webUrl: form.webUrl || undefined, defaultBranch: form.defaultBranch }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repositories'] }); setSaved(true); setTimeout(onClose, 1800); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to connect repository'),
  });

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center border', provider.bg, provider.border)}>
              <provider.icon className={clsx('w-4 h-4', provider.color)} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Connect {provider.name} Repository</h2>
              <p className="text-[10px] text-slate-500">Link a repo to auto-track commits and PRs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1"><X className="w-4 h-4" /></button>
        </div>
        {saved ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white">Repository connected!</p>
            <p className="text-xs text-slate-500">Commits mentioning task numbers will auto-link.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Link to Project</label>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>)}
              </select>
              {form.projectId && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Commits like <code className="text-indigo-400">{projects.find((p: any) => p.id === form.projectId)?.slug}-42 fix bug</code> will auto-link
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository Name</label>
                <input className="input" placeholder="my-app" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Default Branch</label>
                <input className="input" placeholder="main" value={form.defaultBranch} onChange={(e) => setForm({ ...form, defaultBranch: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Clone URL</label>
              <input className="input font-mono text-xs" placeholder={provider.placeholder.clone} value={form.cloneUrl} onChange={(e) => setForm({ ...form, cloneUrl: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Web URL <span className="text-slate-600 font-normal">(optional)</span></label>
              <input className="input font-mono text-xs" placeholder={provider.placeholder.web} value={form.webUrl} onChange={(e) => setForm({ ...form, webUrl: e.target.value })} />
            </div>
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Link className="w-3.5 h-3.5 text-indigo-400" />
                <p className="text-xs font-semibold text-slate-300">Webhook Setup</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">1. Copy this URL into {provider.name} webhook settings</p>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
                  <code className="text-[10px] text-indigo-300 font-mono flex-1 break-all">{webhookUrl}</code>
                  <CopyButton text={webhookUrl} />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">2. Subscribe to events:</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.webhookEvents.map((e) => (
                    <span key={e} className="text-[10px] px-2 py-0.5 bg-indigo-600/20 border border-indigo-600/30 text-indigo-300 rounded-full font-mono">{e}</span>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500">3. Set Content-Type to <code className="text-indigo-400">application/json</code></p>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => connect.mutate()} disabled={!form.name.trim() || !form.cloneUrl.trim() || !form.projectId || connect.isPending}>
                {connect.isPending ? (
                  <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</span>
                ) : 'Connect Repository'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RepoCard({ repo, onCreateTask }: { repo: any; onCreateTask: (repo: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail } = useQuery({
    queryKey: ['repo-detail', repo.id],
    queryFn: () => gitApi.getRepositoryDetail(repo.id),
    enabled: expanded,
  });
  const provider = PROVIDERS.find((p) => p.key === repo.provider) || PROVIDERS[0];
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0', provider.bg, provider.border)}>
          <provider.icon className={clsx('w-4 h-4', provider.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{repo.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 border border-slate-600 text-slate-400 rounded-full">{repo.provider}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><GitBranch className="w-3 h-3" />{repo.defaultBranch}</span>
            {repo.project && <span className="text-[10px] text-slate-500">{repo.project.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {repo.webUrl && (
            <a href={repo.webUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={() => onCreateTask(repo)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Plus className="w-3 h-3" /> Create Task
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-700 divide-y divide-slate-700/60">
          <div className="p-4">
            <p className="section-label mb-3 flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> Linked Branches</p>
            {detail?.branches?.length > 0 ? (
              <div className="space-y-1.5">
                {detail.branches.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 text-xs py-1.5 px-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <GitBranch className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="font-mono text-slate-300 flex-1">{b.branchName}</span>
                    <span className="text-[10px] text-indigo-400">{b.task?.taskNumber}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-600 italic">No branches linked yet. Push commits with task numbers to auto-link.</p>}
          </div>
          <div className="p-4">
            <p className="section-label mb-3 flex items-center gap-1.5"><GitCommit className="w-3 h-3" /> Recent Commits</p>
            {detail?.commits?.length > 0 ? (
              <div className="space-y-2">
                {detail.commits.slice(0, 8).map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2 py-1">
                    <GitCommit className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{c.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-600">{c.sha?.slice(0, 7)}</span>
                        <span className="text-[10px] text-slate-600">{c.authorName}</span>
                        {c.task && <span className="text-[10px] text-indigo-400">{c.task.taskNumber}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {c.committedAt ? formatDistanceToNow(new Date(c.committedAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-600 italic">No commits tracked yet.</p>}
          </div>
          <div className="p-4">
            <p className="section-label mb-3 flex items-center gap-1.5"><GitPullRequest className="w-3 h-3" /> Pull / Merge Requests</p>
            {detail?.pullRequests?.length > 0 ? (
              <div className="space-y-2">
                {detail.pullRequests.map((pr: any) => (
                  <div key={pr.id} className="flex items-center gap-2 py-1">
                    <GitPullRequest className={clsx('w-3.5 h-3.5 flex-shrink-0', pr.state === 'open' ? 'text-emerald-400' : 'text-purple-400')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{pr.title}</p>
                      <span className="text-[10px] font-mono text-slate-600">{pr.sourceBranch} → {pr.targetBranch}</span>
                    </div>
                    <span className={clsx('badge text-[10px]', pr.state === 'open' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-purple-600/20 text-purple-300')}>{pr.state}</span>
                    {pr.url && <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300"><ExternalLink className="w-3 h-3" /></a>}
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-slate-600 italic">No pull requests tracked yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTaskFromRepoModal({ repo, projects, onClose }: { repo: any; projects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', projectId: repo.projectId || projects[0]?.id || '', branchName: '' });
  const create = useMutation({
    mutationFn: async () => {
      const { tasksApi: tApi, gitApi: gApi } = await import('../services/api');
      const task = await tApi.create(form.projectId, { title: form.title, description: form.description, priority: form.priority, status: 'TODO' });
      if (form.branchName && task.id) await gApi.linkBranch(task.id, repo.id, form.branchName);
      return task;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose(); },
  });
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-sm font-bold text-white">Create Task from Repository</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">{repo.name} ({repo.provider})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input className="input" placeholder="e.g. Implement OAuth login" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea className="input" rows={3} placeholder="What needs to be done?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Project</label>
              <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['LOW','MEDIUM','HIGH','CRITICAL'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Link Branch <span className="text-slate-600">(optional)</span></label>
            <input className="input font-mono text-xs" placeholder="feature/my-branch" value={form.branchName} onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
          </div>
          <div className="bg-slate-800/60 rounded-lg border border-slate-700 p-3">
            <p className="text-[10px] text-slate-500">After creating, include the task number in commits to auto-track:</p>
            <code className="text-[10px] text-indigo-300 mt-1 block">git commit -m "PROJ-XX {form.title || 'implement feature'}"</code>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!form.title.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [connectProvider, setConnectProvider] = useState<string | null>(null);
  const [createTaskRepo, setCreateTaskRepo] = useState<any>(null);
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() });
  const { data: repositories = [], isLoading, refetch } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => gitApi.listRepositories(),
    refetchInterval: 60000,
  });
  const activeProvider = PROVIDERS.find((p) => p.key === connectProvider);
  const reposByProvider = PROVIDERS.map((p) => ({ ...p, repos: (repositories as any[]).filter((r: any) => r.provider === p.key) }));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Git Integrations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{(repositories as any[]).length} repositories connected across {projects.length} projects</p>
        </div>
        <button onClick={() => refetch()} className="btn-ghost flex items-center gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>
      <div className="card border-indigo-600/20 bg-indigo-600/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-300">How auto-linking works</p>
            <p className="text-xs text-slate-400">Include your task number in any commit message. The webhook auto-links that commit to the task.</p>
            <code className="text-[11px] text-indigo-300 bg-slate-800 px-2 py-1 rounded font-mono border border-slate-700 inline-block mt-1">
              git commit -m "PROJ-42 fix payment calculation"
            </code>
          </div>
        </div>
      </div>
      {reposByProvider.map(({ key, name, icon: Icon, color, bg, border, repos, description }) => (
        <div key={key} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border', bg, border)}>
                <Icon className={clsx('w-4 h-4', color)} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">{name}</h2>
                <p className="text-[10px] text-slate-500">{description}</p>
              </div>
            </div>
            <button onClick={() => setConnectProvider(key)} className="btn-secondary text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Connect Repo
            </button>
          </div>
          {repos.length > 0 ? (
            <div className="space-y-2 ml-11">
              {repos.map((r: any) => <RepoCard key={r.id} repo={r} onCreateTask={setCreateTaskRepo} />)}
            </div>
          ) : (
            <div className="ml-11 border border-dashed border-slate-700 rounded-xl p-5 text-center">
              <p className="text-xs text-slate-600 italic">No {name} repositories connected yet.</p>
              <button onClick={() => setConnectProvider(key)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors">Connect your first repo →</button>
            </div>
          )}
        </div>
      ))}
      {activeProvider && <ConnectModal provider={activeProvider} projects={projects} onClose={() => setConnectProvider(null)} />}
      {createTaskRepo && <CreateTaskFromRepoModal repo={createTaskRepo} projects={projects} onClose={() => setCreateTaskRepo(null)} />}
    </div>
  );
}
