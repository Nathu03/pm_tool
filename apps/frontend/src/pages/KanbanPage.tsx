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
  { status: 'BACKLOG',      label: 'Backlog',     colorClass: 'bg-slate-500',   headerClass: 'text-slate-400' },
  { status: 'TODO',         label: 'To Do',       colorClass: 'bg-blue-500',    headerClass: 'text-blue-400' },
  { status: 'IN_PROGRESS',  label: 'In Progress', colorClass: 'bg-amber-500',   headerClass: 'text-amber-400' },
  { status: 'UAT',          label: 'UAT',         colorClass: 'bg-orange-500',  headerClass: 'text-orange-400' },
  { status: 'AI_REVIEW',    label: 'AI Review',   colorClass: 'bg-purple-500',  headerClass: 'text-purple-400' },
  { status: 'QA_BA_REVIEW', label: 'QA / BA',     colorClass: 'bg-pink-500',    headerClass: 'text-pink-400' },
  { status: 'COMPLETED',    label: 'Done',        colorClass: 'bg-emerald-500', headerClass: 'text-emerald-400' },
];

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-yellow-400',
  LOW:      'bg-slate-400',
};
const PRIORITY_TEXT: Record<string, string> = {
  CRITICAL: 'text-red-400',
  HIGH:     'text-orange-400',
  MEDIUM:   'text-yellow-400',
  LOW:      'text-slate-400',
};

function TaskCard({ task, onClick, isOverlay = false }: { task: any; onClick: () => void; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.25 : 1 };
  const p = task.priority || 'MEDIUM';
  const assignees = task.assignees || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx('task-card', isOverlay && 'shadow-2xl ring-1 ring-indigo-500/50 rotate-1 scale-105')}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono text-slate-500">{task.taskNumber}</span>
        <div className="flex items-center gap-1.5">
          <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', PRIORITY_DOT[p])} />
          <span className={clsx('text-[10px] font-medium', PRIORITY_TEXT[p])}>{p}</span>
        </div>
      </div>
      <p className="text-sm text-slate-200 font-medium leading-snug mb-3 line-clamp-3 min-h-[42px]">{task.title}</p>
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/70">
        <div className="flex -space-x-1">
          {assignees.slice(0, 3).map((a: any) => (
            <div key={a.user?.id} title={a.user?.fullName} className="w-5 h-5 rounded-full bg-indigo-500/40 border-2 border-slate-800 flex items-center justify-center text-[9px] font-bold text-indigo-300">
              {a.user?.fullName?.[0]?.toUpperCase()}
            </div>
          ))}
          {assignees.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[9px] text-slate-400">+{assignees.length - 3}</div>
          )}
        </div>
        {task.dueDate && (
          <span className={clsx('text-[10px]', new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-slate-500')}>
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
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
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tasksApi.update(projectId!, id, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = qc.getQueryData(['tasks', projectId]);
      qc.setQueryData(['tasks', projectId], (old: any[]) =>
        (old || []).map((t) => t.id === id ? { ...t, status } : t),
      );
      return { previous };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      qc.setQueryData(['tasks', projectId], ctx?.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const found = (tasks as any[]).find((t: any) => t.id === e.active.id);
    setActiveTask(found || null);
  }, [tasks]);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const targetCol = COLUMNS.find((c) => c.status === over.id);
    if (targetCol) {
      const draggedTask = (tasks as any[]).find((t: any) => t.id === active.id);
      if (draggedTask && draggedTask.status !== targetCol.status) {
        updateMutation.mutate({ id: String(active.id), status: targetCol.status });
      }
      return;
    }
    const targetTask = (tasks as any[]).find((t: any) => t.id === over.id);
    if (targetTask && active.id !== over.id) {
      const draggedTask = (tasks as any[]).find((t: any) => t.id === active.id);
      if (draggedTask && draggedTask.status !== targetTask.status) {
        updateMutation.mutate({ id: String(active.id), status: targetTask.status });
      }
    }
  }, [tasks, updateMutation]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col p-5">
        <div className="flex gap-4">
          {COLUMNS.map((c) => (
            <div key={c.status} className="kanban-col">
              <div className="h-6 bg-slate-700/50 rounded mb-3 animate-pulse" />
              <div className="kanban-col-body">
                {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-700/50 rounded-lg animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white">Kanban Board</h1>
            <p className="text-xs text-slate-500 mt-0.5">{(tasks as any[]).length} tasks · drag to change status</p>
          </div>
          <button onClick={() => setCreateStatus('BACKLOG')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 h-full pb-3">
              {COLUMNS.map((col) => {
                const colTasks = (tasks as any[]).filter((t: any) => t.status === col.status);
                return (
                  <div key={col.status} className="kanban-col flex flex-col">
                    <div className="flex items-center gap-2 mb-2 px-1 flex-shrink-0">
                      <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', col.colorClass)} />
                      <span className={clsx('text-xs font-semibold uppercase tracking-wide flex-1', col.headerClass)}>{col.label}</span>
                      <span className="text-[10px] text-slate-600 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{colTasks.length}</span>
                      <button onClick={() => setCreateStatus(col.status)} className="text-slate-600 hover:text-indigo-400 transition-colors" title={`Add to ${col.label}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <SortableContext id={col.status} items={colTasks.map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="kanban-col-body flex-1">
                        {colTasks.map((task: any) => (
                          <TaskCard key={task.id} task={task} onClick={() => setPreviewTask(task)} />
                        ))}
                        {colTasks.length === 0 && (
                          <div className="flex items-center justify-center text-xs text-slate-700 italic py-8 select-none">Drop here</div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeTask && <TaskCard task={activeTask} onClick={() => {}} isOverlay />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      {previewTask && <TaskPreviewModal taskId={previewTask.id} projectId={projectId!} onClose={() => setPreviewTask(null)} />}
      {createStatus && <CreateTaskModal projectId={projectId!} defaultStatus={createStatus} onClose={() => setCreateStatus(null)} />}
    </>
  );
}
