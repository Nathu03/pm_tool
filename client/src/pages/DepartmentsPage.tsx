import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, usersApi } from '../services/api';
import { Building2, Plus, Users, Crown, Shield, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import clsx from 'clsx';

function CreateDepartmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId] = useState('');

  const create = useMutation({
    mutationFn: () => departmentsApi.create({ name, description, leaderId: leaderId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">Create Department</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
            <input className="input" placeholder="Engineering" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
            <textarea className="input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Department Leader</label>
            <select className="input" value={leaderId} onChange={(e) => setLeaderId(e.target.value)}>
              <option value="">— None —</option>
              {(users as any[]).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
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

function DepartmentCard({ dept }: { dept: any }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const [addingMember, setAddingMember] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [addingSubLeader, setAddingSubLeader] = useState(false);
  const [subLeaderId, setSubLeaderId] = useState('');

  const addMember = useMutation({
    mutationFn: (userId: string) => departmentsApi.addMember(dept.id, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setAddingMember(false); setMemberId(''); },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => departmentsApi.removeMember(dept.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  const addSubLeader = useMutation({
    mutationFn: (userId: string) => departmentsApi.addSubLeader(dept.id, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); setAddingSubLeader(false); setSubLeaderId(''); },
  });

  const removeSubLeader = useMutation({
    mutationFn: (userId: string) => departmentsApi.removeSubLeader(dept.id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });

  const memberIds = new Set((dept.members || []).map((m: any) => m.id));
  const subLeaderIds = new Set((dept.subLeaders || []).map((s: any) => s.userId));

  const availableForMember = (users as any[]).filter((u) => !memberIds.has(u.id) && u.id !== dept.lead?.id);
  const availableForSubLeader = (users as any[]).filter((u) => !subLeaderIds.has(u.id) && u.id !== dept.lead?.id);

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{dept.name}</h3>
          {dept.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{dept.description}</p>}
          <div className="flex items-center gap-4 mt-2">
            {dept.lead && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <Crown className="w-3 h-3" /> {dept.lead.fullName}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="w-3 h-3" /> {(dept.members || []).length} members
            </div>
            {(dept.subLeaders || []).length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-blue-300">
                <Shield className="w-3 h-3" /> {dept.subLeaders.length} sub-leaders
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-200 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
          {(dept.subLeaders || []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Shield className="w-3 h-3" /> Sub-Leaders</p>
                <button onClick={() => setAddingSubLeader(true)} className="text-xs text-indigo-400 hover:text-indigo-300"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-1.5">
                {dept.subLeaders.map((s: any) => (
                  <div key={s.userId} className="flex items-center gap-2 group">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300">{s.user?.fullName?.[0]}</div>
                    <span className="text-sm text-slate-300">{s.user?.fullName}</span>
                    <span className="text-[10px] text-slate-600">{s.user?.role?.replace(/_/g, ' ')}</span>
                    <button onClick={() => removeSubLeader.mutate(s.userId)} className="ml-auto text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {addingSubLeader && (
            <div className="flex gap-2">
              <select className="input text-xs flex-1" value={subLeaderId} onChange={(e) => setSubLeaderId(e.target.value)}>
                <option value="">Select user</option>
                {availableForSubLeader.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
              <button className="btn-primary text-xs px-3" onClick={() => addSubLeader.mutate(subLeaderId)} disabled={!subLeaderId}>Add</button>
              <button className="btn-secondary text-xs" onClick={() => setAddingSubLeader(false)}>Cancel</button>
            </div>
          )}
          {!addingSubLeader && (
            <button onClick={() => setAddingSubLeader(true)} className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add sub-leader
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Users className="w-3 h-3" /> Members</p>
            </div>
            <div className="space-y-1.5">
              {(dept.members || []).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 group">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300">{m.fullName?.[0]}</div>
                  <span className="text-sm text-slate-300">{m.fullName}</span>
                  <span className="text-[10px] text-slate-600">{m.role?.replace(/_/g, ' ')}</span>
                  <button onClick={() => removeMember.mutate(m.id)} className="ml-auto text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              {(dept.members || []).length === 0 && <p className="text-xs text-slate-600 italic">No members yet</p>}
            </div>
            {addingMember ? (
              <div className="flex gap-2 mt-2">
                <select className="input text-xs flex-1" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">Select user</option>
                  {availableForMember.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
                <button className="btn-primary text-xs px-3" onClick={() => addMember.mutate(memberId)} disabled={!memberId}>Add</button>
                <button className="btn-secondary text-xs" onClick={() => setAddingMember(false)}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingMember(true)} className="mt-2 text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add member
              </button>
            )}
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
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Departments</h1>
          <p className="text-sm text-slate-400 mt-0.5">{(departments as any[]).length} department{(departments as any[]).length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Department
        </button>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse h-24" />)}</div>
      ) : (departments as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No departments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(departments as any[]).map((d) => <DepartmentCard key={d.id} dept={d} />)}
        </div>
      )}
      {showCreate && <CreateDepartmentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
