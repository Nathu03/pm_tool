import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tasksApi } from '../services/api';
import { Plus } from 'lucide-react';
import TaskPreviewModal from '../components/TaskPreviewModal';
import CreateTaskModal from '../components/CreateTaskModal';
import clsx from 'clsx';

const COLUMNS = [
  { status: 'BACKLOG', label: 'Backlog', bg: 'bg-slate-500' },
  { status: 'TODO', label: 'To Do', bg: 'bg-blue-500' },
  { status: 'IN_PROGRESS', label: 'In Progress', bg: 'bg-amber-500' },
  { status: 'UAT', label: 'UAT', bg: 'bg-orange-500' },
  { status: 'AI_REVIEW', label: 'AI Review', bg: 'bg-purple-500' },
  { status: 'QA_BA_REVIEW', label: 'QA / BA', bg: 'bg-pink-500' },
  { status: 'COMPLETED', label: 'Done', bg: 'bg-emerald-500' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  CRITICAL: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-500' },
  HIGH:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medium',   color: 'text-yellow-400', dot: 'bg-yellow-400' },
  LOW:      { label: 'Low',      color: 'text-slate-400',  dot: 'bg-slate-400' },
};

function TaskCard({ task, onClick, isDragging = false }: { task: any; onClick: () => void; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortableDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: sortableDragging ? 0.3 : 1 };
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const assignees = task.assignees || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        'group bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-pointer select-none',
        'hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-900/20 transition-all',
        isDragging && 'shadow-2xl border-indigo-500 rotate-1 scale-105',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-500 tracking-wide">{task.taskNumber}</span>
        <div className="flex items-center gap-1">
          <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', p.dot)} />
          <span className={clsx('text-[10px] font-medium', p.color)}>{p.label}</span>
        </div>
      </div>
      <p className="text-sm text-slate-200 font-medium leading-snug mb-3 line-clamp-3">{task.title}</p>
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((l: any) => (
            <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-600/30">{l.name}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-700/60">
        <div className="flex -space-x-1">
          {assignees.slice(0, 3).map((a: any) => (
            <div key={a.user.id} title={a.user.fullName} className="w-5 h-5 rounded-full bg-indigo-500/40 border border-slate-800 flex items-center justify-center text-[9px] font-bold text-indigo-300">
              {a.user.fullName[0]}
            </div>
          ))}
          {assignees.length > 3 && <div className="w-5 h-5 rounded-full bg-slate-600 border border-slate-800 flex items-center justify-center text-[9px] text-slate-400">+{assignees.length - 3}</div>}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {task.dueDate && <span className={clsx(new Date(task.dueDate) < new Date() ? 'text-red-400' : '')}>{new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
          {task._count?.comments > 0 && <span>{task._count.comments} 💬</span>}
        </div>
      </div>
    </div>
  );
}

function Column({ col, tasks, onCardClick, onAddTask }: { col: typeof COLUMNS[0]; tasks: any[]; onCardClick: (t: any) => void; onAddTask: () => void }) {
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={clsx('w-2.5 h-2.5 rounded-full', col.bg)} />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex-1">{col.label}</span>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{tasks.length}</span>
        <button onClick={onAddTask} className="text-slate-500 hover:text-indigo-400 p-0.5 rounded transition-colors" title={`Add to ${col.label}`}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 bg-slate-800/40 rounded-xl border border-slate-700/50 p-2 min-h-[120px] flex flex-col gap-2">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onCardClick(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-600 italic py-6">Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState<any>(null);
  const [previewTask, setPreviewTask] = useState<any>(null);
  const [createStatus, setCreateStatus] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.list(projectId!),
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.update(projectId!, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveTask(tasks.find((t: any) => t.id === e.active.id) || null);
  }, [tasks]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const targetCol = COLUMNS.find((c) => c.status === over.id);
    const targetTask = tasks.find((t: any) => t.id === over.id);
    const newStatus = targetCol?.status || (targetTask ? COLUMNS.find((c) => tasks.filter((t: any) => t.status === c.status).some((t: any) => t.id === over.id))?.status : null);
    if (newStatus) {
      const draggedTask = tasks.find((t: any) => t.id === active.id);
      if (draggedTask && draggedTask.status !== newStatus) {
        updateMutation.mutate({ id: String(active.id), status: newStatus });
      }
    }
  }, [tasks, updateMutation]);

  if (isLoading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((c) => <div key={c.status} className="w-72 flex-shrink-0 h-96 bg-slate-800/40 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">Kanban Board</h1>
            <p className="text-xs text-slate-500 mt-0.5">{tasks.length} tasks · drag cards to update status</p>
          </div>
          <button onClick={() => setCreateStatus('BACKLOG')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
        <div className="flex-1 overflow-x-auto pb-4">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {COLUMNS.map((col) => (
                <Column
                  key={col.status}
                  col={col}
                  tasks={tasks.filter((t: any) => t.status === col.status)}
                  onCardClick={(t) => setPreviewTask(t)}
                  onAddTask={() => setCreateStatus(col.status)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragging />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {previewTask && (
        <TaskPreviewModal
          taskId={previewTask.id}
          projectId={projectId!}
          onClose={() => setPreviewTask(null)}
        />
      )}
      {createStatus && (
        <CreateTaskModal
          projectId={projectId!}
          defaultStatus={createStatus}
          onClose={() => setCreateStatus(null)}
        />
      )}
    </>
  );
}
