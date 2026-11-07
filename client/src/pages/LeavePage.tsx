import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { Calendar, Plus, Download, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO, getDay } from 'date-fns';
import clsx from 'clsx';

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual Leave', color: 'bg-blue-500' },
  { value: 'SICK', label: 'Sick Leave', color: 'bg-red-500' },
  { value: 'CASUAL', label: 'Casual Leave', color: 'bg-yellow-500' },
  { value: 'SHORT', label: 'Short Leave', color: 'bg-orange-500' },
  { value: 'MATERNITY', label: 'Maternity Leave', color: 'bg-pink-500' },
  { value: 'PATERNITY', label: 'Paternity Leave', color: 'bg-cyan-500' },
  { value: 'UNPAID', label: 'Unpaid Leave', color: 'bg-slate-500' },
  { value: 'COMPENSATORY', label: 'Compensatory Leave', color: 'bg-purple-500' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave', color: 'bg-gray-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-teal-500' },
];

const TYPE_COLOR: Record<string, string> = Object.fromEntries(LEAVE_TYPES.map((t) => [t.value, t.color]));

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40',
  APPROVED: 'bg-green-600/20 text-green-300 border-green-600/40',
  REJECTED: 'bg-red-600/20 text-red-300 border-red-600/40',
  CANCELLED: 'bg-slate-600/20 text-slate-300 border-slate-600/40',
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={clsx('fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right-5',
      type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200')}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><XCircle className="w-4 h-4" /></button>
    </div>
  );
}

function LeaveRequestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (msg: string) => void }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const { data: approvers = [] } = useQuery({ queryKey: ['deptApprovers', user?.id], queryFn: () => leaveApi.getDeptApprovers(user!.id), enabled: !!user?.id });

  const [form, setForm] = useState({
    leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '',
    backupEmployeeId: '', backupNote: '', handoverNote: '', approverId: '',
  });

  const submit = useMutation({
    mutationFn: () => leaveApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myLeaves'] }); qc.invalidateQueries({ queryKey: ['leaveBalance'] }); onSuccess('Leave request submitted!'); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-base font-bold text-white">New Leave Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Leave Type</label>
            <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
              <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Reason</label>
            <textarea className="input resize-none" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Backup Employee</label>
            <select className="input" value={form.backupEmployeeId} onChange={(e) => setForm({ ...form, backupEmployeeId: e.target.value })}>
              <option value="">— None —</option>
              {(users as any[]).filter((u) => u.id !== user?.id).map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          {form.backupEmployeeId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Backup Note</label>
              <textarea className="input resize-none" rows={2} placeholder="Instructions for backup employee" value={form.backupNote} onChange={(e) => setForm({ ...form, backupNote: e.target.value })} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Handover Note</label>
            <textarea className="input resize-none" rows={2} placeholder="Tasks to handover" value={form.handoverNote} onChange={(e) => setForm({ ...form, handoverNote: e.target.value })} />
          </div>
          {(approvers as any[]).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Approver</label>
              <select className="input" value={form.approverId} onChange={(e) => setForm({ ...form, approverId: e.target.value })}>
                <option value="">— Auto-assign —</option>
                {(approvers as any[]).map((a) => <option key={a.id} value={a.id}>{a.fullName} ({a.approverType})</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-700">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => submit.mutate()} disabled={!form.startDate || !form.endDate || submit.isPending}>
            {submit.isPending ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamCalendar() {
  const [month, setMonth] = useState(new Date());
  const { data: calEvents = [] } = useQuery({ queryKey: ['leaveCalendar', format(month, 'yyyy-MM')], queryFn: () => leaveApi.getCalendar(format(month, 'yyyy-MM-01'), format(endOfMonth(month), 'yyyy-MM-dd')) });

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(startOfMonth(month));

  const eventsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const e of calEvents as any[]) {
      const s = parseISO(e.startDate);
      const end = parseISO(e.endDate);
      const range = eachDayOfInterval({ start: s, end: end });
      for (const d of range) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    }
    return map;
  }, [calEvents]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="btn-ghost p-2"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setMonth(new Date())} className="btn-secondary text-xs px-3 py-1">Today</button>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="btn-ghost p-2"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-700/50 rounded-lg overflow-hidden">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="bg-slate-900 h-28" />)}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const events = eventsByDay[key] || [];
          return (
            <div key={key} className={clsx('bg-slate-900 h-28 p-1.5 overflow-hidden', isToday(day) && 'ring-1 ring-inset ring-indigo-500')}>
              <span className={clsx('text-xs font-medium block mb-1', isToday(day) ? 'text-indigo-400 font-bold' : 'text-slate-400')}>{format(day, 'd')}</span>
              <div className="space-y-0.5 overflow-hidden">
                {events.slice(0, 3).map((e, i) => (
                  <div key={i} className={clsx('text-[9px] leading-tight px-1 py-0.5 rounded truncate font-medium text-white', TYPE_COLOR[e.leaveType] || 'bg-slate-600')} title={`${e.user?.fullName}: ${e.leaveType}`}>
                    {e.user?.fullName?.split(' ')[0]}
                  </div>
                ))}
                {events.length > 3 && <div className="text-[9px] text-slate-500 px-1">+{events.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {LEAVE_TYPES.slice(0, 6).map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${t.color}`} />
            <span className="text-[10px] text-slate-400">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyLeaves({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { data: leaves = [], isLoading } = useQuery({ queryKey: ['myLeaves'], queryFn: () => leaveApi.getMyRequests() });
  const { data: balance } = useQuery({ queryKey: ['leaveBalance'], queryFn: () => leaveApi.getMyBalance() });

  const cancel = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myLeaves'] }); qc.invalidateQueries({ queryKey: ['leaveBalance'] }); onSuccess('Leave request cancelled.'); },
  });

  const exportCSV = () => {
    const rows = [(leaves as any[]).map((l) => [l.leaveType, l.startDate, l.endDate, l.status, l.reason].join(','))];
    const blob = new Blob([['Type,Start,End,Status,Reason', ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-leaves.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      {balance && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(balance as any[]).map((b) => {
            const type = LEAVE_TYPES.find((t) => t.value === b.leaveType);
            return (
              <div key={b.leaveType} className="card text-center">
                <div className={`w-6 h-6 rounded-full ${type?.color || 'bg-slate-500'} mx-auto mb-2`} />
                <p className="text-lg font-bold text-white">{b.remaining}</p>
                <p className="text-[10px] text-slate-500">{type?.label || b.leaveType}</p>
                <p className="text-[9px] text-slate-600">{b.used}/{b.total} used</p>
              </div>
            );
          })}
        </div>
      )}
      {!balance && isLoading && (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">My Leave Requests</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export CSV</button>
          <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => setShowModal(true)}><Plus className="w-3.5 h-3.5" /> New Request</button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>
      ) : (leaves as any[]).length === 0 ? (
        <div className="text-center py-10 text-slate-500">No leave requests yet</div>
      ) : (
        <div className="space-y-2">
          {(leaves as any[]).map((l) => {
            const typeInfo = LEAVE_TYPES.find((t) => t.value === l.leaveType);
            return (
              <div key={l.id} className="card flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${typeInfo?.color || 'bg-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{typeInfo?.label || l.leaveType}</span>
                    <span className={clsx('badge border text-[10px]', STATUS_STYLES[l.status])}>{l.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(l.startDate), 'MMM d')} – {format(parseISO(l.endDate), 'MMM d, yyyy')}</p>
                  {l.reason && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{l.reason}</p>}
                  {l.backupEmployee && <p className="text-[10px] text-slate-600 mt-0.5">Backup: {l.backupEmployee.fullName}</p>}
                  {l.rejectionNote && <p className="text-[10px] text-red-400 mt-0.5">Rejected: {l.rejectionNote}</p>}
                </div>
                {l.status === 'PENDING' && (
                  <button onClick={() => cancel.mutate(l.id)} className="text-xs text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showModal && <LeaveRequestModal onClose={() => setShowModal(false)} onSuccess={onSuccess} />}
    </div>
  );
}

function ApprovalsTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['allLeaveRequests'], queryFn: () => leaveApi.getAllRequests() });

  const approve = useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['allLeaveRequests'] }); onSuccess('Leave request approved!'); },
  });

  const reject = useMutation({
    mutationFn: (id: string) => leaveApi.reject(id, rejectionNote),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['allLeaveRequests'] }); setRejectId(null); setRejectionNote(''); onSuccess('Leave request rejected.'); },
  });

  const pending = (requests as any[]).filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Pending Approvals ({pending.length})</h3>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-20" />)}</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-10 text-slate-500"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" /> No pending approvals</div>
      ) : (
        pending.map((r) => {
          const typeInfo = LEAVE_TYPES.find((t) => t.value === r.leaveType);
          return (
            <div key={r.id} className="card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                  {r.user?.fullName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{r.user?.fullName}</span>
                    <span className="text-xs text-slate-400">{typeInfo?.label || r.leaveType}</span>
                  </div>
                  <p className="text-xs text-slate-500">{format(parseISO(r.startDate), 'MMM d')} – {format(parseISO(r.endDate), 'MMM d, yyyy')}</p>
                  {r.reason && <p className="text-xs text-slate-400 mt-1">{r.reason}</p>}
                  {r.backupEmployee && <p className="text-[10px] text-slate-500 mt-0.5">Backup: {r.backupEmployee.fullName}</p>}
                </div>
              </div>
              {rejectId === r.id ? (
                <div className="space-y-2">
                  <input className="input text-xs" placeholder="Rejection reason (optional)" value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} />
                  <div className="flex gap-2">
                    <button className="btn-danger text-xs flex-1" onClick={() => reject.mutate(r.id)} disabled={reject.isPending}>Confirm Reject</button>
                    <button className="btn-secondary text-xs" onClick={() => setRejectId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button className="btn-primary text-xs flex items-center gap-1.5 flex-1" onClick={() => approve.mutate(r.id)} disabled={approve.isPending}>
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button className="btn-danger text-xs flex items-center gap-1.5 flex-1" onClick={() => setRejectId(r.id)}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function BalancesTab() {
  const { data: balances = [], isLoading } = useQuery({ queryKey: ['allBalances'], queryFn: () => leaveApi.getAllBalances() });

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-16" />)}</div>;

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const b of balances as any[]) {
      if (!map[b.userId]) map[b.userId] = [];
      map[b.userId].push(b);
    }
    return map;
  }, [balances]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([userId, bs]) => (
        <div key={userId} className="card">
          <p className="text-sm font-semibold text-white mb-3">{bs[0]?.user?.fullName || userId}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {bs.map((b) => {
              const type = LEAVE_TYPES.find((t) => t.value === b.leaveType);
              return (
                <div key={b.leaveType} className="bg-slate-800/60 rounded-lg p-2 text-center">
                  <div className={`w-4 h-4 rounded-full ${type?.color || 'bg-slate-500'} mx-auto mb-1`} />
                  <p className="text-sm font-bold text-white">{b.remaining}</p>
                  <p className="text-[9px] text-slate-500">{type?.label || b.leaveType}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {Object.keys(grouped).length === 0 && <div className="text-center py-10 text-slate-500">No balances found</div>}
    </div>
  );
}

function HistoryTab() {
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['allLeaveRequests'], queryFn: () => leaveApi.getAllRequests() });

  const exportCSV = () => {
    const rows = (requests as any[]).map((r) => [r.user?.fullName, r.leaveType, r.startDate, r.endDate, r.status].join(','));
    const blob = new Blob([['Name,Type,Start,End,Status', ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leave-history.csv'; a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">All Requests ({(requests as any[]).length})</h3>
        <button className="btn-secondary text-xs flex items-center gap-1.5" onClick={exportCSV}><Download className="w-3.5 h-3.5" /> Export CSV</button>
      </div>
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-14" />)}</div>
      ) : (
        <div className="space-y-2">
          {(requests as any[]).map((r) => {
            const typeInfo = LEAVE_TYPES.find((t) => t.value === r.leaveType);
            return (
              <div key={r.id} className="card flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeInfo?.color || 'bg-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{r.user?.fullName}</span>
                    <span className="text-[10px] text-slate-500">{typeInfo?.label || r.leaveType}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{format(parseISO(r.startDate), 'MMM d')} – {format(parseISO(r.endDate), 'MMM d, yyyy')}</p>
                </div>
                <span className={clsx('badge border text-[10px]', STATUS_STYLES[r.status])}>{r.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'my', label: 'My Leaves', icon: Clock },
  { id: 'calendar', label: 'Team Calendar', icon: Calendar },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle },
  { id: 'balances', label: 'Balances', icon: CheckCircle },
  { id: 'history', label: 'History', icon: Calendar },
];

export default function LeavePage() {
  const [tab, setTab] = useState('my');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white mb-4">Leave Management</h1>
        <div className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={clsx('px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all',
                tab === id ? 'text-indigo-300 border-indigo-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200')}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'my' && <MyLeaves onSuccess={(msg) => showToast(msg)} />}
        {tab === 'calendar' && <TeamCalendar />}
        {tab === 'approvals' && <ApprovalsTab onSuccess={(msg) => showToast(msg)} />}
        {tab === 'balances' && <BalancesTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}
