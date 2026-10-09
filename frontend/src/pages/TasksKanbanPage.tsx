import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckSquare, Plus, ChevronRight, ChevronLeft, Trash2, Calendar, User as UserIcon, Lock, Unlock, Search, RotateCcw } from 'lucide-react';
import { useKanbanBoard, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';

interface TasksKanbanPageProps {
  onTabChange?: (tab: string) => void;
}

const taskSchema = z.object({
  title: z.string().min(1, 'El título de la tarea es requerido'),
  type: z.enum(['FRACTIONING', 'PACKAGING', 'CLEANING', 'GENERAL']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  assignedTo: z.string().min(1, 'El operario asignado es requerido'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const KANBAN_COLUMNS = [
  { 
    id: 'PENDING_FRACTIONING', 
    title: '📌 Pendiente de Fraccionado', 
    prevStatus: null,
    prevLabel: null,
    nextStatus: 'PACKAGING_IN_PROGRESS', 
    nextLabel: 'A Empaque' 
  },
  { 
    id: 'PACKAGING_IN_PROGRESS', 
    title: '📦 Empaque en Proceso', 
    prevStatus: 'PENDING_FRACTIONING',
    prevLabel: 'Fraccionado',
    nextStatus: 'QUALITY_CONTROL', 
    nextLabel: 'A Calidad' 
  },
  { 
    id: 'QUALITY_CONTROL', 
    title: '🔍 Control de Calidad', 
    prevStatus: 'PACKAGING_IN_PROGRESS',
    prevLabel: 'Empaque',
    nextStatus: 'COMPLETED', 
    nextLabel: 'Completar' 
  },
  { 
    id: 'COMPLETED', 
    title: '✅ Completadas', 
    prevStatus: 'QUALITY_CONTROL',
    prevLabel: 'Reabrir Calidad',
    nextStatus: null, 
    nextLabel: null 
  },
];

export const TasksKanbanPage: React.FC<TasksKanbanPageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, users } = useAuth();
  const [collaborativeMode, setCollaborativeMode] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: boardData, isLoading, isError, refetch } = useKanbanBoard();
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const canUserMoveTask = (task: any) => {
    if (!user) return true;
    
    // 1. Administrador siempre tiene permiso total para organizar el tablero
    if (user.role === 'ADMIN') return true;

    // 2. En modo colaborativo (por defecto), el equipo operativo puede mover tareas del flujo
    if (collaborativeMode) return true;

    const assigned = (task.assignedTo || task.assignee || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const loggedUser = (user.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!assigned || assigned === 'sin asignar') return true;

    // Comparación por palabras (tokens)
    const taskTokens = assigned.split(/[^a-z0-9]+/).filter((t: string) => t.length > 2);
    const userTokens = loggedUser.split(/[^a-z0-9]+/).filter((t: string) => t.length > 2);

    return taskTokens.some((t: string) => userTokens.includes(t)) ||
           userTokens.some((t: string) => taskTokens.includes(t));
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      type: 'FRACTIONING',
      priority: 'MEDIUM',
      assignedTo: user?.name || 'Emilia Maldonado Hernandez',
      dueDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const onSubmit = (data: TaskFormValues) => {
    createTask.mutate({
      ...data,
      status: 'PENDING_FRACTIONING'
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        reset();
        refetch();
      }
    });
  };

  const normalizeStatus = (status: string) => {
    if (!status) return 'PENDING_FRACTIONING';
    const s = status.toUpperCase().trim();
    if (s === 'IN_PROGRESS' || s === 'PACKAGING_IN_PROGRESS') return 'PACKAGING_IN_PROGRESS';
    if (s === 'PENDING' || s === 'PENDING_FRACTIONING') return 'PENDING_FRACTIONING';
    if (s === 'QUALITY_CONTROL' || s === 'CONTROL') return 'QUALITY_CONTROL';
    if (s === 'COMPLETED' || s === 'FINALIZADO') return 'COMPLETED';
    return 'PENDING_FRACTIONING';
  };

  // Normaliza y extrae todas las tareas sin importar si vienen en array u objeto agrupado
  const getTasksByColumn = (colId: string) => {
    if (!boardData) return [];

    let raw: any = boardData;
    if (raw && typeof raw === 'object' && 'data' in raw && raw.data !== null && (typeof raw.data === 'object' || Array.isArray(raw.data))) {
      raw = raw.data;
    }

    let allTasks: any[] = [];

    // Caso 1: Objeto agrupado { PENDING_FRACTIONING: [...], PACKAGING_IN_PROGRESS: [...], ... }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      Object.entries(raw).forEach(([statusKey, val]: [string, any]) => {
        if (Array.isArray(val)) {
          val.forEach((item: any) => {
            allTasks.push({
              ...item,
              status: item.status || statusKey
            });
          });
        }
      });
    }
    // Caso 2: Array de columnas o array plano
    else if (Array.isArray(raw)) {
      if (raw.length > 0 && Array.isArray((raw[0] as any)?.items)) {
        raw.forEach((col: any) => {
          if (Array.isArray(col.items)) {
            col.items.forEach((item: any) => {
              allTasks.push({
                ...item,
                status: item.status || col.id
              });
            });
          }
        });
      } else {
        allTasks = [...raw];
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      allTasks = allTasks.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return allTasks.filter((t: any) => normalizeStatus(t.status) === colId);
  };

  const handleMoveStatus = (taskId: string, targetStatus: string) => {
    updateStatus.mutate(
      { id: taskId, status: targetStatus },
      { 
        onSuccess: () => refetch(),
        onError: (err: any) => {
          console.error('Error al mover tarea:', err);
          alert(`No se pudo mover la tarea: ${err.message || 'Error en el servidor'}`);
        }
      }
    );
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleMoveStatus(taskId, targetStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'terracotta';
      case 'MEDIUM': return 'gray';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'ALTA';
      case 'MEDIUM': return 'MEDIA';
      case 'LOW': return 'BAJA';
      default: return 'NORMAL';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'FRACTIONING': return 'Fraccionado';
      case 'PACKAGING': return 'Empaque';
      case 'CLEANING': return 'Limpieza';
      case 'GENERAL': return 'General';
      default: return type || 'Operativa';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <CheckSquare className="text-primary-sage" />
            Tablero Kanban de Tareas Operativas
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Planificación y seguimiento de fraccionado, empaque, calidad y depósito. Arrastra las tarjetas o usa los botones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar tareas o responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 pr-3 py-1.5 text-xs w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setCollaborativeMode(!collaborativeMode)}
            className={`btn btn-sm flex items-center gap-1.5 text-xs ${collaborativeMode ? 'btn-secondary text-green-800 border-green-300' : 'btn-secondary text-slate-700'}`}
            title="Alternar entre modo colaborativo (todo el equipo puede mover) y modo estricto (solo responsable asignado)"
          >
            {collaborativeMode ? <Unlock size={14} className="text-green-600" /> : <Lock size={14} />}
            <span>{collaborativeMode ? 'Modo Colaborativo (Abierto)' : 'Solo Responsable'}</span>
          </button>

          <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5" title="Actualizar tablero">
            <RotateCcw size={14} />
            <span>Refrescar</span>
          </button>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus size={16} />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-16 text-text-muted">Cargando tablero kanban operativo...</div>
      ) : isError ? (
        <div className="card text-center py-12 text-terracotta">
          <p className="font-semibold mb-2">Error al cargar tareas operativas.</p>
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm">Reintentar</button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const tasks = getTasksByColumn(col.id);

            return (
              <div 
                key={col.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="card min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col bg-bg-linen border p-0 overflow-hidden shadow-xs"
              >
                <div className="p-3 bg-white border-b flex justify-between items-center">
                  <h3 className="text-xs font-bold text-text-dark uppercase tracking-wider">{col.title}</h3>
                  <span className="badge gray text-xs font-semibold px-2 py-0.5 rounded-full">{tasks.length}</span>
                </div>

                <div className="p-3 flex flex-col gap-3 flex-grow overflow-y-auto" style={{ minHeight: '420px', maxHeight: '680px' }}>
                  {tasks.map((task: any) => {
                    const isAllowedToMove = canUserMoveTask(task);

                    return (
                      <div 
                        key={task.id} 
                        draggable={isAllowedToMove}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`card p-3 border bg-white shadow-sm hover:shadow transition flex flex-col gap-2 ${isAllowedToMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`badge ${getPriorityBadgeClass(task.priority)} text-[10px] font-bold`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <span className="badge gray text-[10px]">{getTypeLabel(task.type)}</span>
                        </div>

                        <h4 className="font-semibold text-sm text-text-dark">{task.title}</h4>

                        {task.description && (
                          <p className="text-xs text-text-muted line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-col gap-1 text-xs text-text-muted border-t pt-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={13} className="text-primary-sage flex-shrink-0" />
                            <span className="font-semibold text-text-dark truncate">{task.assignedTo || task.assignee || 'Sin asignar'}</span>
                            {isAllowedToMove ? (
                              <span className="ml-auto text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                                🟢 Habilitado
                              </span>
                            ) : (
                              <span className="ml-auto text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0" title="Activa Modo Colaborativo o inicia sesión como el responsable">
                                <Lock size={10} /> Bloqueado
                              </span>
                            )}
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Calendar size={13} className="text-text-muted flex-shrink-0" />
                              <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-AR')}</span>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción: Avanzar, Retroceder y Eliminar */}
                        <div className="flex items-center justify-between pt-2 border-t mt-1 gap-1.5">
                          {col.prevStatus && isAllowedToMove && (
                            <button
                              type="button"
                              onClick={() => handleMoveStatus(task.id, col.prevStatus!)}
                              disabled={updateStatus.isPending}
                              title={`Volver a ${col.prevLabel}`}
                              className="btn btn-secondary btn-sm text-[11px] py-1 px-2 text-text-muted hover:text-text-dark flex items-center justify-center gap-0.5"
                            >
                              <ChevronLeft size={13} />
                              <span>{col.prevLabel}</span>
                            </button>
                          )}

                          {col.nextStatus ? (
                            isAllowedToMove ? (
                              <button
                                type="button"
                                onClick={() => handleMoveStatus(task.id, col.nextStatus!)}
                                disabled={updateStatus.isPending}
                                className="btn btn-primary btn-sm flex-1 text-[11px] py-1 px-2 flex items-center justify-center gap-1"
                              >
                                <span>{col.nextLabel}</span>
                                <ChevronRight size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="btn btn-secondary btn-sm flex-1 text-[11px] py-1 px-2 flex items-center justify-center gap-1 opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
                                title="Activa el Modo Colaborativo para mover tareas de otros responsables"
                              >
                                <span>{col.nextLabel}</span>
                                <Lock size={12} />
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-green-700 font-bold flex-1 text-center py-1 bg-green-50 rounded">
                              ✅ Finalizada
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
                                deleteTask.mutate(task.id, { onSuccess: () => refetch() });
                              }
                            }}
                            className="btn btn-secondary btn-sm text-terracotta py-1 px-2"
                            title="Eliminar tarea"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {tasks.length === 0 && (
                    <div className="py-12 text-center text-xs text-text-muted border-2 border-dashed border-gray-200 rounded-lg m-1">
                      No hay tareas en esta columna
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nueva Tarea */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📋 Registrar Nueva Tarea Operativa">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Título de la Tarea *</label>
            <input 
              type="text" 
              className={`input ${errors.title ? 'has-error' : ''}`} 
              placeholder="Ej: Fraccionado de Avena Orgánica 1kg"
              {...register('title')} 
            />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Tipo de Tarea *</label>
              <select className="input" {...register('type')}>
                <option value="FRACTIONING">Fraccionado</option>
                <option value="PACKAGING">Empaque / Sellado</option>
                <option value="CLEANING">Limpieza & Higiene</option>
                <option value="GENERAL">General Depósito</option>
              </select>
            </div>

            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Prioridad *</label>
              <select className="input" {...register('priority')}>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Responsable *</label>
              <select className={`input ${errors.assignedTo ? 'has-error' : ''}`} {...register('assignedTo')}>
                {users && users.length > 0 ? (
                  users.map(u => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Emilia Maldonado Hernandez">Emilia Maldonado Hernandez</option>
                    <option value="Juan Pablo (Administrador)">Juan Pablo (Administrador)</option>
                    <option value="María Clara (Empaque)">María Clara (Empaque)</option>
                  </>
                )}
              </select>
              {errors.assignedTo && <span className="field-error">{errors.assignedTo.message}</span>}
            </div>

            <div className="form-field">
              <label className="text-sm font-medium text-text-dark mb-1 block">Fecha de Vencimiento</label>
              <input type="date" className="input" {...register('dueDate')} />
            </div>
          </div>

          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Instrucciones / Notas</label>
            <textarea className="input" placeholder="Detalles de la operación..." rows={3} {...register('notes')}></textarea>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={createTask.isPending}>
              {createTask.isPending ? 'Guardando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
