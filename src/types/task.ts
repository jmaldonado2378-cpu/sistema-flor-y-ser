/**
 * Tipos y Definiciones para el Módulo de Tareas Operativas y Kanban
 * Sistema Flor y Ser - Almacén Natural
 */

// Tipos principales de Tareas Operativas
export type TaskType = 'FRACTIONING' | 'PACKAGING' | 'CLEANING' | 'GENERAL';

// Estados del Kanban de Tareas Operativas
export type TaskKanbanStatus =
  | 'PENDING_FRACTIONING'
  | 'PACKAGING_IN_PROGRESS'
  | 'QUALITY_CONTROL'
  | 'COMPLETED';

// Nivel de Prioridad de la Tarea
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Interfaz principal para una Tarea Operativa en el sistema
 */
export interface OperationalTask {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskKanbanStatus;
  priority: TaskPriority;
  assignedTo?: string;         // Nombre o ID del responsable del equipo
  orderId?: string;            // ID del pedido asociado (si corresponde)
  productId?: string;          // ID del producto/materia prima (si corresponde)
  productName?: string;        // Nombre del producto involucrado
  quantity?: number;           // Cantidad a fraccionar o empacar
  unitOfMeasure?: string;      // Unidad de medida (kg, g, unidades, litros)
  dueDate?: string;            // Fecha límite de ejecución (ISO o YYYY-MM-DD)
  completedAt?: string;        // Fecha de finalización
  notes?: string;              // Observaciones adicionales o de control
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO para la creación de una nueva Tarea Operativa
 */
export interface CreateTaskDTO {
  title: string;
  description?: string;
  type: TaskType;
  status?: TaskKanbanStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitOfMeasure?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * DTO para la actualización completa de una Tarea Operativa
 */
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskKanbanStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitOfMeasure?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * DTO específico para el cambio de estado en el tablero Kanban
 */
export interface UpdateTaskStatusDTO {
  status: TaskKanbanStatus;
  notes?: string;
  assignedTo?: string;
}

/**
 * DTO para filtrado y búsqueda de Tareas Operativas
 */
export interface TaskFilterDTO {
  type?: TaskType;
  status?: TaskKanbanStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  orderId?: string;
  productId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Estructura de respuesta para el Tablero Kanban Operativo clasificado por columnas
 */
export type OperationalKanbanBoard = Record<TaskKanbanStatus, OperationalTask[]>;
