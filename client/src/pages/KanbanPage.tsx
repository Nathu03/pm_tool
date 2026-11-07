import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical } from 'lucide-react';
import { tasksApi } from '../services/api';
import TaskPreviewModal from '../components/TaskPreviewModal';
import CreateTaskModal from '../components/CreateTaskModal';
import clsx from 'clsx';

const COLUMNS: { id: string; label: string; color: string }[] = [
  { id: 'BACKLOG',     label: 'Backlog',     color: 'bg-slate-500' },
  { id: 'TODO',        label: 'To Do',       color: 'bg-blue-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500' },
  { id: 'UAT',         label: 'UAT',         color: 'bg-orange-500' },
  { id: 'AI_REVIEW',   label: 'AI Review',   color: 'bg-purple-500' },
  { id: 'QA_BA_REVIEW',label: 'QA/BA',       color: 'bg-pink-500' },
  { id: 'COMPLETED',   label: 'Done',        color: 'bg-emerald-500' },
  { id: 'BLOCKED',     label: 'Blocked',     color: 'bg-red-500' },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400', HIGH: 'text-orange-400', MEDIUM: 'text-yellow-400', LOW: 'text-slate-400',
};

function TaskCard({ task, onClick }: { task: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('task-card cursor-pointer', isDragging && 'opacity-40 shadow-xl ring-1 ring-indigo-500')}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-slate-500 mb-1">{task.taskNumber}</p>
          <p className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">{task.title}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={clsx('text-[10px] font-semibold uppercase', PRIORITY_COLORS[task.priority])}>{task.priority}</span>
            {task.assignees?.length > 0 && (
              <div className="flex -space-x-1">
                {task.assignees.slice(0, 3).map((a: any) => (
                  <div key={a.user.id} className="w-4.5 h-4.5 rounded-full bg-indigo-500/40 ring-1 ring-slate-800 flex items-center justify-center text-[8px] font-bold text-indigo-200">{a.user.fullName?.[0]}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ status, label, color, tasks, onAddTask, onTaskClick }: { status: string; label: string; color: string; tasks: any[]; onAddTask: () => void; onTaskClick: (id: string) => void }) {
  return (
    <div className="kanban-col min-w-[220px] w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{label}</span>
        <span className="ml-auto text-xs text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[40px]">
          {tasks.map((t) => <TaskCard key={t.id} task={t} onClick={() => onTaskClick(t.id)} />)}
        </div>
      </SortableContext>
      <button onClick={onAddTask} className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 border border-dashed border-slate-700 hover:border-slate-500 transition-all">
        <Plus className="w-3.5 h-3.5" /> Add task
      </button>
    </div>
  );
}

export default function KanbanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewTaskId, setPreviewTaskId] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', projectId], queryFn: () => tasksApi.list(projectId!), enabled: !!projectId });

  const moveTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksApi.update(projectId!, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  });

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    const task = (tasks as any[]).find((t) => t.id === active.id);
    if (!task) return;
    const targetStatus = COLUMNS.find((c) => c.id === overId)?.id ?? (tasks as any[]).find((t) => t.id === overId)?.status;
    if (targetStatus && targetStatus !== task.status) {
      moveTask.mutate({ id: task.id, status: targetStatus });
    }
  };

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = (tasks as any[]).filter((t) => t.status === col.id);
    return acc;
  }, {} as Record<string, any[]>);

  const activeTask = activeId ? (tasks as any[]).find((t) => t.id === activeId) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-base font-bold text-white">Kanban Board</h1>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setCreateStatus('BACKLOG')}>
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full p-5">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                status={col.id}
                label={col.label}
                color={col.color}
                tasks={tasksByStatus[col.id] || []}
                onAddTask={() => setCreateStatus(col.id)}
                onTaskClick={(id) => setPreviewTaskId(id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="task-card opacity-90 shadow-2xl rotate-1 scale-105">
                <p className="text-xs font-mono text-slate-500 mb-1">{activeTask.taskNumber}</p>
                <p className="text-sm font-medium text-slate-200">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
      {previewTaskId && projectId && (
        <TaskPreviewModal taskId={previewTaskId} projectId={projectId} onClose={() => setPreviewTaskId(null)} />
      )}
      {createStatus && projectId && (
        <CreateTaskModal projectId={projectId} defaultStatus={createStatus} onClose={() => setCreateStatus(null)} />
      )}
    </div>
  );
}
