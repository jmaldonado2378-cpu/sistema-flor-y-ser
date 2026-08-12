import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckSquare, Plus, ChevronRight, Trash2, Calendar, User } from 'lucide-react';
import { useKanbanBoard, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
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
  { id: 'PENDING_FRACTIONING', title: '📌 Pendiente de Fraccionado', nextStatus: 'PACKAGING_IN_PROGRESS', nextLabel: 'Pasar a Empaque' },
  { id: 'PACKAGING_IN_PROGRESS', title: '📦 Empaque en Proceso', nextStatus: 'QUALITY_CONTROL', nextLabel: 'Pasar a Calidad' },
  { id: 'QUALITY_CONTROL', title: '🔍 Control de Calidad', nextStatus: 'COMPLETED', nextLabel: 'Completar Tarea' },
  { id: 'COMPLETED', title: '✅ Completadas', nextStatus: null, nextLabel: null },
];

export const TasksKanbanPage: React.FC<TasksKanbanPageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: boardData, isLoading, isError, refetch } = useKanbanBoard();
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      type: 'FRACTIONING',
      priority: 'MEDIUM',
      assignedTo: 'María Clara (Empaque)',
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

  // Helper to normalize board structure
  const getTasksByColumn = (colId: string) => {
    if (!boardData) return [];

    // Case 1: Backend returns an Object { PENDING_FRACTIONING: [...], ... }
    if (!Array.isArray(boardData) && typeof boardData === 'object') {
      const list = boardData[colId] || [];
      return Array.isArray(list) ? list : [];
    }

    // Case 2: Backend returns an Array of task items [ { id, status }, ... ]
    if (Array.isArray(boardData)) {
      return boardData.filter((t: any) => t.status === colId);
    }

    return [];
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
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <CheckSquare className="text-primary-sage" />
            Tablero Kanban de Tareas Operativas
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Planificación y seguimiento del trabajo en depósito, empaque y sanitización
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nueva Tarea
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 text-text-muted">Cargando tablero kanban operativo...</div>
      ) : isError ? (
        <div className="card text-center py-12 text-terracotta">
          Error al cargar tareas operativas.{' '}
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {KANBAN_COLUMNS.map((col) => {
            const tasks = getTasksByColumn(col.id);

            return (
              <div key={col.id} className="card min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col bg-bg-linen border p-0 overflow-hidden">
                <div className="p-3 bg-white border-b flex justify-between items-center">
                  <h3 className="text-sm font-bold text-text-dark">{col.title}</h3>
                  <span className="badge gray text-xs font-semibold">{tasks.length}</span>
                </div>

                <div className="p-3 flex flex-col gap-3 flex-grow overflow-y-auto" style={{ minHeight: '380px', maxHeight: '650px' }}>
                  {tasks.map((task: any) => (
                    <div key={task.id} className="card p-3 border bg-white shadow-sm hover:shadow transition flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className={`badge ${getPriorityBadgeClass(task.priority)} text-xs`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <span className="badge gray text-xs">{getTypeLabel(task.type)}</span>
                      </div>

                      <h4 className="font-semibold text-sm text-text-dark">{task.title}</h4>

                      {task.description && (
                        <p className="text-xs text-text-muted">{task.description}</p>
                      )}

                      <div className="flex flex-col gap-1 text-xs text-text-muted border-t pt-2 mt-1">
                        <div className="flex items-center gap-1">
                          <User size={13} className="text-primary-sage" />
                          <span>{task.assignedTo || 'Sin asignar'}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-text-muted" />
                            <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-AR')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t mt-1 gap-2">
                        {col.nextStatus ? (
                          <button
                            onClick={() => updateStatus.mutate({ id: task.id, status: col.nextStatus! }, { onSuccess: () => refetch() })}
                            disabled={updateStatus.isPending}
                            className="btn btn-primary btn-sm flex-1 text-xs flex items-center justify-center gap-1"
                          >
                            <span>{col.nextLabel}</span>
                            <ChevronRight size={14} />
                          </button>
                        ) : (
                          <span className="text-xs text-primary-sage font-medium flex-1 text-center">✅ Finalizada</span>
                        )}

                        <button
                          onClick={() => deleteTask.mutate(task.id, { onSuccess: () => refetch() })}
                          className="btn btn-secondary btn-sm text-terracotta"
                          title="Eliminar tarea"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {tasks.length === 0 && (
                    <div className="py-12 text-center text-xs text-text-muted">
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
                <option value="Administrador General">Administrador General</option>
                <option value="Juan Pablo">Juan Pablo</option>
                <option value="Maria Emilia">Maria Emilia</option>
                <option value="Rocio Quevedo">Rocio Quevedo</option>
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
