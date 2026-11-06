import { GitBranch, Github, AlertCircle } from 'lucide-react';
const providers = [
  { name: 'GitHub', icon: Github, description: 'Connect GitHub repos, track commits and PRs.' },
  { name: 'Bitbucket', icon: GitBranch, description: 'Connect Bitbucket repos and branches.' },
  { name: 'GitLab', icon: GitBranch, description: 'Connect GitLab repos and merge requests.' },
];
export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Integrations</h1>
      <div className="card border-yellow-600/30 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-300">Webhook endpoint: <code className="text-indigo-400 bg-slate-700 px-1.5 py-0.5 rounded text-xs">POST /api/v1/webhooks/github</code>. Include task number in commit messages: <code className="text-indigo-400 bg-slate-700 px-1.5 py-0.5 rounded text-xs">PROJ-42 fix bug</code></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div key={p.name} className="card"><div className="flex items-center gap-3 mb-3"><p.icon className="w-6 h-6 text-slate-300" /><h3 className="text-sm font-semibold text-white">{p.name}</h3></div><p className="text-xs text-slate-400 mb-4">{p.description}</p><button className="btn-secondary w-full">Connect</button></div>
        ))}
      </div>
    </div>
  );
}
