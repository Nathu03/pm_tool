import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, usersApi } from '../services/api';
import { Plus, X, Users, ChevronDown, ChevronUp, Edit2, Trash2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', leaderId: '' });
  const [error, setError] = useState('');
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });

  const create = useMutation({
    mutationFn: () => departmentsApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to create department'),
  });

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white">Create Department</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name <span className="text-red-400">*</span></label>
            <input className="input" placeholder="e.g. Engineering" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Department Leader</label>
            <select className="input" value={form.leaderId} onChange={(e) => setForm({ ...form, leaderId: e.target.value })}>
              <option value="">No leader yet</option>
              {(users as any[]).filter((u: any) => u.isActive).map((u: any) => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create Department'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeptCard({ dept }: { dept: any }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [addSubLeaderId, setAddSubLeaderId] = useState('');
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list(), enabled: expanded });
  const nonMembers = (users as any[]).filter((u: any) => u.isActive && !dept.members.find((m: any) => m.id === u.id));

  const addMember = useMutation({
    mutationFn: (uid: string) => departmentsApi.addMember(dept.id, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setAddMemberId(''); },
  });
  const removeMember = useMutation({
    mutationFn: (uid: string) => departmentsApi.removeMember(dept.id, uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
  const addSubLeader = useMutation({
    mutationFn: (uid: string) => departmentsApi.addSubLeader(dept.id, uid),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setAddSubLeaderId(''); },
  });
  const removeSubLeader = useMutation({
    mutationFn: (uid: string) => departmentsApi.removeSubLeader(dept.id, uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
  const deleteDept = useMutation({
    mutationFn: () => departmentsApi.delete(dept.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{dept.name}</p>
          <p className="text-xs text-slate-500">{dept.description || 'No description'} · {dept.members.length} members</p>
        </div>
        {dept.lead && (
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-300">{dept.lead.fullName[0]}</div>
            <span className="text-xs text-slate-400">{dept.lead.fullName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this department?')) deleteDept.mutate(); }} className="text-slate-500 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700 p-4 space-y-5">
          {/* Sub-leaders */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sub-Leaders</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {dept.subLeaders.length === 0 ? <p className="text-xs text-slate-600">None assigned</p> : dept.subLeaders.map((sl: any) => (
                <span key={sl.userId} className="flex items-center gap-1.5 bg-slate-700 border border-slate-600 text-slate-300 text-xs px-2.5 py-1 rounded-full">
                  {sl.user.fullName}
                  <button onClick={() => removeSubLeader.mutate(sl.userId)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="input text-xs py-1.5 flex-1" value={addSubLeaderId} onChange={(e) => setAddSubLeaderId(e.target.value)}>
                <option value="">Add sub-leader…</option>
                {dept.members.map((m: any) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
              <button className="btn-primary text-xs py-1.5 px-3" onClick={() => addSubLeaderId && addSubLeader.mutate(addSubLeaderId)} disabled={!addSubLeaderId}>Add</button>
            </div>
          </div>

          {/* Members */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Members ({dept.members.length})</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {dept.members.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">{m.fullName[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{m.fullName}</p>
                    <p className="text-[10px] text-slate-500">{m.role}</p>
                  </div>
                  <button onClick={() => removeMember.mutate(m.id)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="input text-xs py-1.5 flex-1" value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)}>
                <option value="">Add member…</option>
                {nonMembers.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
              <button className="btn-primary text-xs py-1.5 px-3" onClick={() => addMemberId && addMember.mutate(addMemberId)} disabled={!addMemberId}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: departments = [], isLoading } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsApi.list() });

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage departments, leaders, and team members</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Department</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          [1,2,3].map((i) => <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />)
        ) : (departments as any[]).length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-16 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500">No departments yet</p>
            <button onClick={() => setShowCreate(true)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">Create the first department →</button>
          </div>
        ) : (departments as any[]).map((d: any) => <DeptCard key={d.id} dept={d} />)}
      </div>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
