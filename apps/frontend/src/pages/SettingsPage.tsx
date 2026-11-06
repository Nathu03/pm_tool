import { Key, Users, Workflow } from 'lucide-react';
export default function SettingsPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Settings</h1>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Key className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">AI Configuration</h2></div>
        <div className="space-y-3">
          <div><label className="block text-xs text-slate-400 mb-1">OpenAI API Key</label><input className="input" type="password" placeholder="sk-…" /></div>
          <div><label className="block text-xs text-slate-400 mb-1">AI Provider</label><select className="input"><option>OpenAI (GPT-4o)</option><option>DeepSeek</option><option>Grok</option><option>Claude</option></select></div>
          <button className="btn-primary">Save</button>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">User Management</h2></div>
        <button className="btn-secondary">Manage Users</button>
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><Workflow className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">Workflow Statuses</h2></div>
        <div className="flex flex-wrap gap-2">{['Backlog','To Do','In Progress','UAT','AI Review','QA/BA','Completed'].map((s)=><span key={s} className="badge bg-slate-700 text-slate-300">{s}</span>)}</div>
      </div>
    </div>
  );
}
