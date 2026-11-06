import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import {
  Calendar, Plus, X, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, BarChart3, FileText,
  AlertCircle, Umbrella, Download, History, User,
} from 'lucide-react';
import clsx from 'clsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from 'date-fns';

// ─── Config ─────────────────────────────────────────────────────────────────

const LEAVE_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; pill: string }> = {
  ANNUAL:        { label: 'Annual Leave',      color: 'text-blue-300',    bg: 'bg-blue-500/20',    border: 'border-blue-500/30',    pill: 'bg-blue-500/30 text-blue-200' },
  SICK:          { label: 'Sick Leave',         color: 'text-red-300',     bg: 'bg-red-500/20',     border: 'border-red-500/30',     pill: 'bg-red-500/30 text-red-200' },
  CASUAL:        { label: 'Casual Leave',       color: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', pill: 'bg-emerald-500/30 text-emerald-200' },
  SHORT:         { label: 'Short Leave',        color: 'text-amber-300',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30',   pill: 'bg-amber-500/30 text-amber-200' },
  MATERNITY:     { label: 'Maternity Leave',    color: 'text-pink-300',    bg: 'bg-pink-500/20',    border: 'border-pink-500/30',    pill: 'bg-pink-500/30 text-pink-200' },
  PATERNITY:     { label: 'Paternity Leave',    color: 'text-indigo-300',  bg: 'bg-indigo-500/20',  border: 'border-indigo-500/30',  pill: 'bg-indigo-500/30 text-indigo-200' },
  UNPAID:        { label: 'Unpaid Leave',       color: 'text-slate-300',   bg: 'bg-slate-500/20',   border: 'border-slate-500/30',   pill: 'bg-slate-500/30 text-slate-200' },
  COMPENSATORY:  { label: 'Compensatory',       color: 'text-orange-300',  bg: 'bg-orange-500/20',  border: 'border-orange-500/30',  pill: 'bg-orange-500/30 text-orange-200' },
  BEREAVEMENT:   { label: 'Bereavement Leave',  color: 'text-purple-300',  bg: 'bg-purple-500/20',  border: 'border-purple-500/30',  pill: 'bg-purple-500/30 text-purple-200' },
  OTHER:         { label: 'Other',              color: 'text-slate-400',   bg: 'bg-slate-600/20',   border: 'border-slate-600/30',   pill: 'bg-slate-600/30 text-slate-300' },
};

const ALL_LEAVE_TYPES = Object.keys(LEAVE_TYPE_CONFIG);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  PENDING:   { label: 'Pending',   color: 'text-amber-300',   bg: 'bg-amber-500/20',   Icon: Clock },
  APPROVED:  { label: 'Approved',  color: 'text-emerald-300', bg: 'bg-emerald-500/20', Icon: CheckCircle2 },
  REJECTED:  { label: 'Rejected',  color: 'text-red-300',     bg: 'bg-red-500/20',     Icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-400',   bg: 'bg-slate-500/20',   Icon: X },
};

// ─── Toast ────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={clsx(
      'fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-2 duration-300',
      type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-200' : 'bg-red-900/90 border-red-700 text-red-200',
    )}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('bg-slate-800 animate-pulse rounded-xl', className)} />;
}

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.Icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────

function ApplyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (msg: string) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '', handoverNote: '', backupEmployeeId: '', backupNote: '' });
  const [error, setError] = useState('');
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list() });
  const me = useAuthStore((s) => s.user);
  const teammates = (users as any[]).filter((u: any) => u.id !== me?.id && u.isActive);

  const submit = useMutation({
    mutationFn: () => leaveApi.createRequest(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      onSuccess('Leave request submitted successfully!');
      onClose();
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit request'),
  });

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
              <Umbrella className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Apply for Leave</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Leave Type</label>
            <select className="input" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              {ALL_LEAVE_TYPES.map((t) => <option key={t} value={t}>{LEAVE_TYPE_CONFIG[t].label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
              <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
              <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} min={form.startDate || new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Reason <span className="text-red-400">*</span></label>
            <textarea className="input" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Handover Notes</label>
            <textarea className="input" rows={2} value={form.handoverNote} onChange={(e) => setForm({ ...form, handoverNote: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Backup Employee</label>
            <select className="input" value={form.backupEmployeeId} onChange={(e) => setForm({ ...form, backupEmployeeId: e.target.value })}>
              <option value="">Select backup employee (optional)</option>
              {teammates.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          {form.backupEmployeeId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Backup Notes</label>
              <textarea className="input" rows={2} placeholder="Notes for the backup employee…" value={form.backupNote} onChange={(e) => setForm({ ...form, backupNote: e.target.value })} />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={() => submit.mutate()} disabled={!form.startDate || !form.endDate || !form.reason.trim() || submit.isPending}>
              {submit.isPending ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────

function RejectModal({ requestId, onClose, onSuccess }: { requestId: string; onClose: () => void; onSuccess: (msg: string) => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const reject = useMutation({
    mutationFn: () => leaveApi.reject(requestId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      onSuccess('Leave request rejected.');
      onClose();
    },
  });
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-sm font-bold text-white">Reject Leave Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <textarea className="input" rows={3} placeholder="Reason for rejection…" value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-danger flex-1" onClick={() => reject.mutate()} disabled={!note.trim() || reject.isPending}>
              {reject.isPending ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── My Leaves Tab ───────────────────────────────────────────────────────────

function MyLeavesTab({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const qc = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  const { data: requests = [], isLoading: loadingReqs } = useQuery({ queryKey: ['my-leaves'], queryFn: () => leaveApi.getMyRequests() });
  const { data: balances = [], isLoading: loadingBal } = useQuery({ queryKey: ['leave-balance'], queryFn: () => leaveApi.getMyBalance() });

  const cancel = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      toast('Leave request cancelled.');
    },
  });

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Balance — {new Date().getFullYear()}</h3>
          <button onClick={() => setShowApply(true)} className="btn-primary text-xs flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Apply for Leave</button>
        </div>
        {loadingBal ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(balances as any[]).filter((b) => ['ANNUAL','SICK','CASUAL','COMPENSATORY'].includes(b.leaveType)).map((b: any) => {
              const cfg = LEAVE_TYPE_CONFIG[b.leaveType];
              const total = (b.allocated || 0) + (b.carryForward || 0);
              const remaining = Math.max(0, total - (b.used || 0) - (b.pending || 0));
              const pct = total > 0 ? Math.min(100, Math.round(((b.used || 0) / total) * 100)) : 0;
              return (
                <div key={b.leaveType} className={clsx('rounded-xl p-4 border', cfg.bg, cfg.border)}>
                  <p className={clsx('text-[10px] font-semibold uppercase tracking-wide mb-2', cfg.color)}>{cfg.label}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">{remaining}</span>
                    <span className="text-xs text-slate-400">/ {total} days</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div className={clsx('h-full rounded-full transition-all duration-500', cfg.bg.replace('/20', '/60'))} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-500">Used: {b.used || 0}</span>
                    {(b.pending || 0) > 0 && <span className="text-[10px] text-amber-400">Pending: {b.pending}</span>}
                    {(b.carryForward || 0) > 0 && <span className="text-[10px] text-cyan-400">CF: {b.carryForward}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requests list */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">My Requests</h3>
        {loadingReqs ? (
          <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (requests as any[]).length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center">
            <Umbrella className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No leave requests yet</p>
            <button onClick={() => setShowApply(true)} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors">Apply for leave →</button>
          </div>
        ) : (
          <div className="space-y-2">
            {(requests as any[]).map((r: any) => {
              const cfg = LEAVE_TYPE_CONFIG[r.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
              return (
                <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0', cfg.bg, cfg.border)}>
                    <Calendar className={clsx('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={clsx('text-xs font-semibold', cfg.color)}>{cfg.label}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400">{r.days} day{r.days !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-xs text-slate-500">{format(parseISO(r.startDate), 'dd MMM')} – {format(parseISO(r.endDate), 'dd MMM yyyy')}</p>
                    {r.rejectionNote && <p className="text-xs text-red-400 mt-0.5">Rejected: {r.rejectionNote}</p>}
                    {r.backupEmployee && <p className="text-xs text-slate-500 mt-0.5">Backup: {r.backupEmployee.fullName}</p>}
                  </div>
                  <StatusBadge status={r.status} />
                  {['PENDING','APPROVED'].includes(r.status) && (
                    <button onClick={() => { if (confirm('Cancel this leave request?')) cancel.mutate(r.id); }} className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded">Cancel</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showApply && <ApplyModal onClose={() => setShowApply(false)} onSuccess={(m) => toast(m)} />}
    </div>
  );
}

// ─── Team Calendar Tab ────────────────────────────────────────────────────────

function TeamCalendarTab() {
  const [date, setDate] = useState(new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['leave-calendar', year, month],
    queryFn: () => leaveApi.getCalendar(year, month),
  });

  const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
  const startPad = startOfMonth(date).getDay();

  function getEventsForDay(day: Date) {
    return (events as any[]).filter((e: any) => {
      const s = parseISO(e.startDate); const en = parseISO(e.endDate);
      return day >= s && day <= en;
    });
  }

  const today = new Date();
  const todayEvents = getEventsForDay(today);

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{format(date, 'MMMM yyyy')}</h3>
          <div className="flex gap-1">
            <button onClick={() => setDate(new Date(year, month - 2, 1))} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setDate(new Date())} className="px-3 py-1.5 text-xs rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">Today</button>
            <button onClick={() => setDate(new Date(year, month, 1))} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Calendar grid */}
        {isLoading ? <Skeleton className="h-96" /> : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-700">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-slate-500 uppercase py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="border-b border-r border-slate-700/50 h-28" />)}
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div key={day.toISOString()} className={clsx('border-b border-r border-slate-700/50 h-28 p-1.5 overflow-hidden', isWeekend && 'bg-slate-800/60', isToday(day) && 'bg-indigo-600/10 ring-1 ring-inset ring-indigo-600/30')}>
                    <span className={clsx('text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1', isToday(day) ? 'bg-indigo-600 text-white' : isWeekend ? 'text-slate-600' : 'text-slate-400')}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e: any) => {
                        const lt = LEAVE_TYPE_CONFIG[e.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
                        return (
                          <div key={e.id} className={clsx('text-[9px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1', lt.pill)} title={`${e.user?.fullName} — ${lt.label}`}>
                            <span className="w-3.5 h-3.5 rounded-full bg-current/30 flex-shrink-0 flex items-center justify-center text-[8px] font-bold opacity-80">{e.user?.fullName?.[0]}</span>
                            {e.user?.fullName?.split(' ')[0]}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-[9px] text-slate-500 px-1">+{dayEvents.length - 3}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {ALL_LEAVE_TYPES.map((t) => {
            const cfg = LEAVE_TYPE_CONFIG[t];
            return (
              <span key={t} className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', cfg.pill)}>{cfg.label}</span>
            );
          })}
        </div>
      </div>

      {/* Sidebar: who's away */}
      <div className="w-56 flex-shrink-0">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Away Today</h4>
        {todayEvents.length === 0 ? (
          <p className="text-xs text-slate-600">No one on leave today</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((e: any) => {
              const cfg = LEAVE_TYPE_CONFIG[e.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 flex-shrink-0">
                    {e.user?.fullName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">{e.user?.fullName}</p>
                    <p className={clsx('text-[10px]', cfg.color)}>{cfg.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-5 mb-3">This Month</h4>
        <div className="space-y-2">
          {(events as any[]).slice(0, 8).map((e: any) => {
            const cfg = LEAVE_TYPE_CONFIG[e.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
            return (
              <div key={e.id} className={clsx('rounded-lg px-2.5 py-2 border', cfg.bg, cfg.border)}>
                <p className="text-xs font-medium text-slate-200 truncate">{e.user?.fullName}</p>
                <p className="text-[10px] text-slate-500">{format(parseISO(e.startDate), 'dd MMM')} – {format(parseISO(e.endDate), 'dd MMM')}</p>
                <p className={clsx('text-[10px]', cfg.color)}>{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Approvals Tab ──────────────────────────────────────────────────────────

function ApprovalsTab({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const qc = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['all-leaves'], queryFn: () => leaveApi.getAllRequests({ status: 'PENDING' }) });

  const { data: expandedUserReqs = [] } = useQuery({
    queryKey: ['user-leaves', expandedId],
    queryFn: () => {
      const req = (requests as any[]).find((r: any) => r.id === expandedId);
      return req ? leaveApi.getAllRequests({ userId: req.userId }) : Promise.resolve([]);
    },
    enabled: !!expandedId,
  });

  const approve = useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-leaves'] });
      qc.invalidateQueries({ queryKey: ['leave-balance'] });
      toast('Leave request approved!', 'success');
    },
  });

  if (isLoading) return <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="flex gap-5">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-white">Pending Approvals</h3>
          <span className="text-xs bg-amber-500/20 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">{(requests as any[]).length}</span>
        </div>
        {(requests as any[]).length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">All caught up! No pending requests.</p>
          </div>
        ) : (requests as any[]).map((r: any) => {
          const cfg = LEAVE_TYPE_CONFIG[r.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className={clsx('bg-slate-800 border rounded-xl p-4 cursor-pointer transition-colors', isExpanded ? 'border-indigo-600/40' : 'border-slate-700')} onClick={() => setExpandedId(isExpanded ? null : r.id)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
                  {r.user?.fullName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{r.user?.fullName}</span>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border', cfg.bg, cfg.color, cfg.border)}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{format(parseISO(r.startDate), 'dd MMM')} – {format(parseISO(r.endDate), 'dd MMM yyyy')} · <span className="font-medium text-slate-300">{r.days} days</span></p>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">{format(parseISO(r.createdAt), 'dd MMM')}</span>
              </div>
              <div className="bg-slate-700/40 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-slate-300">{r.reason}</p>
                {r.handoverNote && <p className="text-[11px] text-slate-500 mt-1">Handover: {r.handoverNote}</p>}
                {r.backupEmployee && <p className="text-[11px] text-slate-500 mt-1">Backup: {r.backupEmployee.fullName}</p>}
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => approve.mutate(r.id)} disabled={approve.isPending} className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => setRejectId(r.id)} className="btn-danger text-xs py-1.5 flex-1 flex items-center justify-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side panel: employee leave history */}
      {expandedId && (
        <div className="w-72 flex-shrink-0 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Employee History
          </h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {(expandedUserReqs as any[]).map((r: any) => {
              const cfg = LEAVE_TYPE_CONFIG[r.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
              return (
                <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx('text-[10px] font-semibold', cfg.color)}>{cfg.label}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-slate-400">{format(parseISO(r.startDate), 'dd MMM')} – {format(parseISO(r.endDate), 'dd MMM')} · {r.days}d</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rejectId && <RejectModal requestId={rejectId} onClose={() => setRejectId(null)} onSuccess={(m) => toast(m)} />}
    </div>
  );
}

// ─── Balances Tab ────────────────────────────────────────────────────────────

function BalancesTab() {
  const { data: balances = [], isLoading } = useQuery({ queryKey: ['all-balances'], queryFn: () => leaveApi.getAllBalances() });
  const byUser = (balances as any[]).reduce((acc: any, b: any) => {
    if (!acc[b.userId]) acc[b.userId] = { user: b.user, balances: [] };
    acc[b.userId].balances.push(b);
    return acc;
  }, {});

  if (isLoading) return <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Team Leave Balances — {new Date().getFullYear()}</h3>
      {Object.values(byUser).map((entry: any) => (
        <div key={entry.user.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300">{entry.user.fullName[0]}</div>
            <div>
              <p className="text-sm font-semibold text-white">{entry.user.fullName}</p>
              <p className="text-xs text-slate-500">@{entry.user.username} · {entry.user.role?.replace(/_/g,' ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {entry.balances.map((b: any) => {
              const cfg = LEAVE_TYPE_CONFIG[b.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
              const avail = Math.max(0, b.allocated + b.carryForward - b.used - b.pending);
              return (
                <div key={b.leaveType} className={clsx('rounded-lg p-2.5 border', cfg.bg, cfg.border)}>
                  <p className={clsx('text-[9px] font-semibold uppercase tracking-wide', cfg.color)}>{cfg.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-white">{avail}</span>
                    <span className="text-[10px] text-slate-500">/{b.allocated + b.carryForward}</span>
                  </div>
                  {b.pending > 0 && <p className="text-[9px] text-amber-400 mt-0.5">{b.pending} pending</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ isManager }: { isManager: boolean }) {
  const me = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState({ status: '', leaveType: '', year: String(new Date().getFullYear()) });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['leave-history', isManager, filters],
    queryFn: () => isManager ? leaveApi.getAllRequests(filters) : leaveApi.getMyRequests(filters),
  });

  const exportCSV = useCallback(() => {
    const header = 'Employee,Leave Type,Start Date,End Date,Days,Status,Approved By,Applied On';
    const rows = (requests as any[]).map((r: any) =>
      [
        r.user?.fullName || '',
        LEAVE_TYPE_CONFIG[r.leaveType]?.label || r.leaveType,
        format(parseISO(r.startDate), 'dd/MM/yyyy'),
        format(parseISO(r.endDate), 'dd/MM/yyyy'),
        r.days,
        r.status,
        r.approver?.fullName || '',
        format(parseISO(r.createdAt), 'dd/MM/yyyy'),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `leave-history-${filters.year}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [requests, filters.year]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select className="input text-xs py-1.5 w-32" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select className="input text-xs py-1.5 w-36" value={filters.leaveType} onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}>
          <option value="">All Types</option>
          {ALL_LEAVE_TYPES.map((t) => <option key={t} value={t}>{LEAVE_TYPE_CONFIG[t].label}</option>)}
        </select>
        <select className="input text-xs py-1.5 w-24" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
          {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={exportCSV} className="btn-secondary text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export CSV</button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (requests as any[]).length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-xl p-10 text-center">
          <History className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No leave history found</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Employee','Type','Dates','Days','Status','Approved By','Applied On'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(requests as any[]).map((r: any, i: number) => {
                const cfg = LEAVE_TYPE_CONFIG[r.leaveType] || LEAVE_TYPE_CONFIG.OTHER;
                return (
                  <tr key={r.id} className={clsx('border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors', i % 2 === 0 && 'bg-slate-800/20')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300">{r.user?.fullName?.[0]}</div>
                        <span className="text-sm text-slate-200">{r.user?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={clsx('text-xs px-2 py-0.5 rounded-full', cfg.pill)}>{cfg.label}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{format(parseISO(r.startDate), 'dd MMM')} – {format(parseISO(r.endDate), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 font-medium">{r.days}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.approver?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{format(parseISO(r.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeavePage() {
  const [tab, setTab] = useState('my');
  const user = useAuthStore((s) => s.user);
  const isManager = ['ADMIN','PROJECT_MANAGER','TEAM_LEAD'].includes(user?.role || '');
  const [toastMsg, setToastMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const toast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const TABS = [
    { key: 'my',       label: 'My Leaves',    icon: FileText },
    { key: 'calendar', label: 'Team Calendar', icon: Calendar },
    ...(isManager ? [{ key: 'approvals', label: 'Approvals', icon: CheckCircle2 }, { key: 'balances', label: 'Balances', icon: BarChart3 }] : []),
    { key: 'history',  label: 'History',       icon: History },
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage time off, approvals, and team availability</p>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-slate-800/60 p-1 rounded-xl border border-slate-700 w-fit flex-shrink-0 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'my'       && <MyLeavesTab toast={toast} />}
        {tab === 'calendar' && <TeamCalendarTab />}
        {tab === 'approvals'&& isManager && <ApprovalsTab toast={toast} />}
        {tab === 'balances' && isManager && <BalancesTab />}
        {tab === 'history'  && <HistoryTab isManager={isManager} />}
      </div>

      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    </div>
  );
}
