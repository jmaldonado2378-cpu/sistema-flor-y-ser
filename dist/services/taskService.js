"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const uuid_1 = require("uuid");
const initialTasks = [
    {
        id: 'task-1001',
        title: 'Fraccionado de Almendras Peladas 250g',
        description: 'Fraccionar saco de 10kg de materia prima a paquetes de 250g.',
        type: 'FRACTIONING',
        status: 'PENDING_FRACTIONING',
        priority: 'HIGH',
        assignedTo: 'María Clara (Depósito)',
        productId: 'rm-001',
        productName: 'Almendras Peladas Importadas',
        quantity: 10,
        unitOfMeasure: 'kg',
        dueDate: '2026-07-25',
        notes: 'Verificar higiene de la balanza antes de comenzar.',
        createdAt: '2026-07-24T10:00:00.000Z',
        updatedAt: '2026-07-24T10:00:00.000Z'
    },
    {
        id: 'task-1002',
        title: 'Empaque de Granola Artesanal 500g',
        description: 'Empacar lote recién elaborado de granola en frascos biodegradables.',
        type: 'PACKAGING',
        status: 'PACKAGING_IN_PROGRESS',
        priority: 'MEDIUM',
        assignedTo: 'Lucía Fernández',
        productId: 'fp-003',
        productName: 'Granola Artesanal Coco & Almendras',
        quantity: 25,
        unitOfMeasure: 'unidades',
        dueDate: '2026-07-24',
        notes: 'Imprimir etiquetas térmicas NIIMBOT antes del sellado.',
        createdAt: '2026-07-24T11:30:00.000Z',
        updatedAt: '2026-07-24T12:00:00.000Z'
    }
];
class TaskService {
    db;
    saleService;
    inMemoryTasks = [...initialTasks];
    isTableInitialized = false;
    fractioningService;
    constructor(db, saleService) {
        this.db = db;
        this.saleService = saleService;
    }
    setFractioningService(fractioningService) {
        this.fractioningService = fractioningService;
    }
    async ensureTableExists() {
        if (this.isTableInitialized)
            return;
        try {
            const createTableQuery = `
        CREATE TABLE IF NOT EXISTS operational_tasks (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING',
          priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
          assigned_to VARCHAR(150),
          order_id VARCHAR(64),
          product_id VARCHAR(64),
          product_name VARCHAR(255),
          quantity DECIMAL(12,3),
          unit_of_measure VARCHAR(50),
          due_date DATE,
          completed_at DATETIME,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;
            await this.db.query(createTableQuery);
            this.isTableInitialized = true;
        }
        catch (err) {
            // Fallback
        }
    }
    mapRowToTask(row) {
        return {
            id: row.id,
            title: row.title,
            description: row.description || undefined,
            type: row.type,
            status: row.status,
            priority: row.priority,
            assignedTo: row.assigned_to || undefined,
            orderId: row.order_id || undefined,
            productId: row.product_id || undefined,
            productName: row.product_name || undefined,
            quantity: row.quantity ? parseFloat(row.quantity) : undefined,
            unitOfMeasure: row.unit_of_measure || undefined,
            dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : undefined,
            completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
        };
    }
    async createTask(dto) {
        await this.ensureTableExists();
        const now = new Date().toISOString();
        const taskStatus = dto.status || 'PENDING_FRACTIONING';
        const taskPriority = dto.priority || 'MEDIUM';
        try {
            const query = `
        INSERT INTO operational_tasks (
          title, description, type, status, priority, assigned_to,
          order_id, product_id, product_name, quantity, unit_of_measure,
          due_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
            const values = [
                dto.title,
                dto.description || null,
                dto.type,
                taskStatus,
                taskPriority,
                dto.assignedTo || null,
                dto.orderId || null,
                dto.productId || null,
                dto.productName || null,
                dto.quantity || null,
                dto.unitOfMeasure || null,
                dto.dueDate || null,
                dto.notes || null
            ];
            const res = await this.db.query(query, values);
            return this.mapRowToTask(res.rows[0]);
        }
        catch (error) {
            const newTask = {
                id: `task-${(0, uuid_1.v4)().substring(0, 8)}`,
                title: dto.title,
                description: dto.description,
                type: dto.type,
                status: taskStatus,
                priority: taskPriority,
                assignedTo: dto.assignedTo,
                orderId: dto.orderId,
                productId: dto.productId,
                productName: dto.productName,
                quantity: dto.quantity,
                unitOfMeasure: dto.unitOfMeasure,
                dueDate: dto.dueDate,
                completedAt: taskStatus === 'COMPLETED' ? now : undefined,
                notes: dto.notes,
                createdAt: now,
                updatedAt: now
            };
            this.inMemoryTasks.unshift(newTask);
            return newTask;
        }
    }
    async getTasks(filter = {}) {
        await this.ensureTableExists();
        try {
            let query = `SELECT * FROM operational_tasks WHERE 1=1`;
            const values = [];
            let valIdx = 1;
            if (filter.type) {
                query += ` AND type = $${valIdx++}`;
                values.push(filter.type);
            }
            if (filter.status) {
                query += ` AND status = $${valIdx++}`;
                values.push(filter.status);
            }
            if (filter.priority) {
                query += ` AND priority = $${valIdx++}`;
                values.push(filter.priority);
            }
            if (filter.assignedTo) {
                query += ` AND assigned_to ILIKE $${valIdx++}`;
                values.push(`%${filter.assignedTo}%`);
            }
            query += ` ORDER BY created_at DESC`;
            const res = await this.db.query(query, values);
            const tasks = res.rows.map((row) => this.mapRowToTask(row));
            return { tasks, total: tasks.length };
        }
        catch (error) {
            let filtered = [...this.inMemoryTasks];
            if (filter.type)
                filtered = filtered.filter((t) => t.type === filter.type);
            if (filter.status)
                filtered = filtered.filter((t) => t.status === filter.status);
            return { tasks: filtered, total: filtered.length };
        }
    }
    async getTaskById(id) {
        const task = this.inMemoryTasks.find((t) => t.id === id);
        if (task)
            return task;
        throw new Error(`Tarea operativa con ID ${id} no encontrada.`);
    }
    async updateTask(id, dto) {
        const index = this.inMemoryTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
            this.inMemoryTasks[index] = { ...this.inMemoryTasks[index], ...dto };
            return this.inMemoryTasks[index];
        }
        throw new Error(`Tarea con ID ${id} no encontrada.`);
    }
    async updateTaskStatus(id, dto) {
        const task = await this.getTaskById(id).catch(() => null);
        if (task && dto.status === 'COMPLETED' && task.status !== 'COMPLETED' && task.type === 'FRACTIONING' && task.notes) {
            try {
                const payload = JSON.parse(task.notes);
                if (payload.rawMaterialId && payload.finalProductId && payload.inputQtyKg) {
                    if (this.fractioningService) {
                        await this.fractioningService.finalizeStockIntegration(payload);
                    }
                }
            }
            catch {
                // Notes text standard format
            }
        }
        const now = new Date().toISOString();
        if (this.db) {
            try {
                const query = `
          UPDATE operational_tasks 
          SET status = $1, completed_at = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *;
        `;
                const res = await this.db.query(query, [dto.status, id]);
                if (res.rows[0])
                    return this.mapRowToTask(res.rows[0]);
            }
            catch { }
        }
        const index = this.inMemoryTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
            this.inMemoryTasks[index].status = dto.status;
            if (dto.status === 'COMPLETED') {
                this.inMemoryTasks[index].completedAt = now;
            }
            return this.inMemoryTasks[index];
        }
        throw new Error(`Tarea con ID ${id} no encontrada.`);
    }
    async deleteTask(id) {
        const index = this.inMemoryTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
            this.inMemoryTasks.splice(index, 1);
            return true;
        }
        return false;
    }
    async getKanbanBoard() {
        const { tasks } = await this.getTasks({ limit: 500 });
        const board = {
            PENDING_FRACTIONING: [],
            PACKAGING_IN_PROGRESS: [],
            QUALITY_CONTROL: [],
            COMPLETED: []
        };
        tasks.forEach((task) => {
            if (board[task.status]) {
                board[task.status].push(task);
            }
            else {
                board.PENDING_FRACTIONING.push(task);
            }
        });
        return board;
    }
    /**
     * Obtiene el Tablero Kanban de Ventas/Pedidos
     */
    async getSalesKanbanBoard() {
        const salesBoard = {
            RECEIVED: [],
            IN_PREPARATION: [],
            READY_FOR_DELIVERY: [],
            IN_DELIVERY: [],
            DELIVERED: []
        };
        let allOrders = [];
        // Intenta obtener pedidos desde SaleService
        if (this.saleService) {
            try {
                const result = await this.saleService.getOrders();
                allOrders = result.orders || [];
            }
            catch { }
        }
        if (allOrders.length === 0) {
            try {
                const res = await this.db.query(`SELECT o.*, c.first_name, c.last_name FROM orders o
           LEFT JOIN customers c ON o.customer_id = c.id
           ORDER BY o.created_at DESC`);
                allOrders = res.rows.map((row) => ({
                    id: row.id,
                    orderNumber: row.order_number,
                    customerId: row.customer_id,
                    customerName: row.first_name ? `${row.first_name} ${row.last_name}` : 'Cliente Registrado',
                    channel: row.channel,
                    status: row.status,
                    paymentStatus: row.payment_status,
                    subtotal: parseFloat(row.subtotal || 0),
                    discountAmount: parseFloat(row.discount_amount || 0),
                    deliveryFee: parseFloat(row.delivery_fee || 0),
                    totalAmount: parseFloat(row.total_amount || 0),
                    paidAmount: parseFloat(row.paid_amount || 0),
                    balanceDue: parseFloat(row.balance_due || 0),
                    pointsEarned: row.points_earned || 0,
                    items: [],
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }));
            }
            catch { }
        }
        const statusMap = {
            RECEIVED: 'RECEIVED',
            PENDING: 'RECEIVED',
            IN_PREPARATION: 'IN_PREPARATION',
            PREPARING: 'IN_PREPARATION',
            'EN PREPARACIÓN': 'IN_PREPARATION',
            READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
            READY: 'READY_FOR_DELIVERY',
            LISTO: 'READY_FOR_DELIVERY',
            IN_DELIVERY: 'IN_DELIVERY',
            DELIVERED: 'DELIVERED',
            ENTREGADO: 'DELIVERED',
            COMPLETED: 'DELIVERED'
        };
        allOrders.forEach((order) => {
            const mappedStatus = statusMap[order.status] || 'RECEIVED';
            salesBoard[mappedStatus].push(order);
        });
        return salesBoard;
    }
}
exports.TaskService = TaskService;
