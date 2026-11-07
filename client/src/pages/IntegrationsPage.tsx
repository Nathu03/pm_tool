import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Plus, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { repositoriesApi } from '../services/api';
import clsx from 'clsx';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-slate-500 hover:text-slate-300 p-1 transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function AddRepoModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', fullName: '', cloneUrl: '', webUrl: '' });

  const add = useMutation({
    mutationFn: () => repositoriesApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['repositories'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">Add Repository</h2>
        </div>
        <div className="p-5 space-y-4">
          {[
            { key: 'name', label: 'Repository Name', placeholder: 'my-repo' },
            { key: 'fullName', label: 'Full Name', placeholder: 'owner/my-repo' },
            { key: 'cloneUrl', label: 'Clone URL', placeholder: 'https://github.com/owner/repo.git' },
            { key: 'webUrl', label: 'Web URL', placeholder: 'https://github.com/owner/repo' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
              <input className="input" placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => add.mutate()} disabled={!form.name || add.isPending}>
            {add.isPending ? 'Adding…' : 'Add Repository'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const { data: repos = [], isLoading } = useQuery({ queryKey: ['repositories'], queryFn: () => repositoriesApi.list() });

  const remove = useMutation({
    mutationFn: (id: string) => repositoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repositories'] }),
  });

  const webhookBase = window.location.origin;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Integrations</h1>
          <p className="text-sm text-slate-400 mt-0.5">Connect your Git repositories</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Repository
        </button>
      </div>
      <div className="mb-6 card bg-slate-800/50">
        <h3 className="text-sm font-semibold text-white mb-3">Webhook Configuration</h3>
        <p className="text-xs text-slate-400 mb-3">Configure these webhook URLs in your repository settings to receive push events.</p>
        {['github', 'bitbucket', 'gitlab'].map((provider) => (
          <div key={provider} className="mb-2">
            <p className="text-[10px] text-slate-500 uppercase mb-1">{provider}</p>
            <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
              <code className="text-xs text-slate-300 flex-1 truncate font-mono">{webhookBase}/api/webhooks/{provider}/{'<repositoryId>'}</code>
              <CopyButton text={`${webhookBase}/api/webhooks/${provider}/<repositoryId>`} />
            </div>
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-20" />)}</div>
      ) : (repos as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <GitBranch className="w-10 h-10 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No repositories connected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(repos as any[]).map((r) => (
            <div key={r.id} className="card group hover:border-slate-600 transition-colors">
              <div className="flex items-start gap-3">
                <GitBranch className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{r.name}</h3>
                    {r.webUrl && (
                      <a href={r.webUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{r.fullName}</p>
                  {r.defaultBranch && <p className="text-xs text-slate-600 mt-1">Default: {r.defaultBranch}</p>}
                </div>
                <button onClick={() => remove.mutate(r.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddRepoModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
