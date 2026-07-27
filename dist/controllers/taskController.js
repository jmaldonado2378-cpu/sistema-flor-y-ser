"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
class TaskController {
    taskService;
    constructor(taskService) {
        this.taskService = taskService;
    }
    /**
     * POST /api/v1/tasks
     * Crea una nueva Tarea Operativa en el sistema.
     */
    create = async (req, res) => {
        try {
            const { title, type } = req.body;
            if (!title || !type) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'Los campos "title" (título) y "type" (tipo de tarea) son obligatorios.'
                });
                return;
            }
            const validTypes = ['FRACTIONING', 'PACKAGING', 'CLEANING', 'GENERAL'];
            if (!validTypes.includes(type)) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: `El tipo de tarea "${type}" no es válido. Tipos admitidos: ${validTypes.join(', ')}`
                });
                return;
            }
            const task = await this.taskService.createTask(req.body);
            res.status(201).json({
                status: 'SUCCESS',
                message: 'Tarea operativa creada exitosamente.',
                data: task
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al crear la tarea operativa.'
            });
        }
    };
    /**
     * GET /api/v1/tasks
     * Obtiene el listado completo de tareas operativas con opción de filtros.
     */
    getAll = async (req, res) => {
        try {
            const { type, status, priority, assignedTo, orderId, productId, search, limit, offset } = req.query;
            const result = await this.taskService.getTasks({
                type: type,
                status: status,
                priority: priority,
                assignedTo: assignedTo,
                orderId: orderId,
                productId: productId,
                search: search,
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined
            });
            res.json({
                status: 'SUCCESS',
                data: result.tasks,
                total: result.total
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al obtener la lista de tareas operativas.'
            });
        }
    };
    /**
     * GET /api/v1/tasks/kanban/board
     * Obtiene la estructura del Tablero Kanban Operativo (columnas por estado).
     */
    getKanbanBoard = async (req, res) => {
        try {
            const board = await this.taskService.getKanbanBoard();
            res.json({
                status: 'SUCCESS',
                message: 'Tablero Kanban Operativo recuperado correctamente.',
                data: board
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al obtener el tablero Kanban Operativo.'
            });
        }
    };
    /**
     * GET /api/v1/tasks/sales-kanban/board
     * Obtiene el Tablero Kanban de Ventas/Pedidos (5 columnas: RECEIVED, IN_PREPARATION, READY_FOR_DELIVERY, IN_DELIVERY, DELIVERED).
     */
    getSalesKanbanBoard = async (req, res) => {
        try {
            const salesBoard = await this.taskService.getSalesKanbanBoard();
            res.json({
                status: 'SUCCESS',
                message: 'Tablero Kanban de Ventas recuperado correctamente.',
                data: salesBoard
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al obtener el tablero Kanban de Ventas.'
            });
        }
    };
    /**
     * GET /api/v1/tasks/:id
     * Obtiene una Tarea Operativa por su ID.
     */
    getById = async (req, res) => {
        try {
            const { id } = req.params;
            const task = await this.taskService.getTaskById(id);
            res.json({
                status: 'SUCCESS',
                data: task
            });
        }
        catch (error) {
            res.status(404).json({
                error: 'NOT_FOUND',
                message: error.message || 'Tarea operativa no encontrada.'
            });
        }
    };
    /**
     * PUT /api/v1/tasks/:id
     * Actualiza los datos generales de una Tarea Operativa.
     */
    update = async (req, res) => {
        try {
            const { id } = req.params;
            const updatedTask = await this.taskService.updateTask(id, req.body);
            res.json({
                status: 'SUCCESS',
                message: 'Tarea operativa actualizada correctamente.',
                data: updatedTask
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al actualizar la tarea operativa.'
            });
        }
    };
    /**
     * PATCH /api/v1/tasks/:id/status
     * Mueve una tarea en el tablero Kanban modificando su estado operativo.
     */
    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: 'El campo "status" es obligatorio para actualizar el estado Kanban.'
                });
                return;
            }
            const validStatuses = [
                'PENDING_FRACTIONING',
                'PACKAGING_IN_PROGRESS',
                'QUALITY_CONTROL',
                'COMPLETED'
            ];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    error: 'BAD_REQUEST',
                    message: `El estado "${status}" no es válido. Estados permitidos: ${validStatuses.join(', ')}`
                });
                return;
            }
            const updatedTask = await this.taskService.updateTaskStatus(id, req.body);
            res.json({
                status: 'SUCCESS',
                message: 'Estado de la tarea operativa actualizado en el tablero Kanban.',
                data: updatedTask
            });
        }
        catch (error) {
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Error al actualizar el estado Kanban de la tarea.'
            });
        }
    };
    /**
     * DELETE /api/v1/tasks/:id
     * Elimina una Tarea Operativa del sistema.
     */
    delete = async (req, res) => {
        try {
            const { id } = req.params;
            await this.taskService.deleteTask(id);
            res.json({
                status: 'SUCCESS',
                message: `Tarea operativa con ID ${id} eliminada correctamente.`
            });
        }
        catch (error) {
            res.status(404).json({
                error: 'NOT_FOUND',
                message: error.message || 'Error al eliminar la tarea operativa.'
            });
        }
    };
}
exports.TaskController = TaskController;
