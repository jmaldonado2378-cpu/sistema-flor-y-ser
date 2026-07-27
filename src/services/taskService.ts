import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import {
  OperationalTask,
  TaskType,
  TaskKanbanStatus,
  TaskPriority,
  CreateTaskDTO,
  UpdateTaskDTO,
  UpdateTaskStatusDTO,
  TaskFilterDTO,
  OperationalKanbanBoard
} from '../types/task';
import { SalesKanbanStatus, Order } from '../types/sales';
import { AcquisitionChannel } from '../types/customer';

/**
 * Datos iniciales en memoria para entorno de desarrollo o pruebas sin DB
 */
const initialTasks: OperationalTask[] = [
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
  },
  {
    id: 'task-1003',
    title: 'Control de Calidad en Lote L-ALM-2026-07',
    description: 'Inspección de humedad y sellado de bolsas en lote de frutos secos.',
    type: 'FRACTIONING',
    status: 'QUALITY_CONTROL',
    priority: 'HIGH',
    assignedTo: 'Carlos Ruiz (Controlador)',
    productId: 'rm-001',
    productName: 'Almendras Peladas Selección',
    quantity: 40,
    unitOfMeasure: 'unidades',
    dueDate: '2026-07-24',
    notes: 'Revisión por muestreo aleatorio (5 unidades).',
    createdAt: '2026-07-23T15:00:00.000Z',
    updatedAt: '2026-07-24T09:00:00.000Z'
  },
  {
    id: 'task-1004',
    title: 'Limpieza y Sanitización de Contenedores de Harina',
    description: 'Desinfección de tachos de almacenamiento a granel según protocolo sanitario.',
    type: 'CLEANING',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    assignedTo: 'Equipo de Depósito',
    dueDate: '2026-07-23',
    completedAt: '2026-07-23T18:00:00.000Z',
    notes: 'Sanitización con alcohol al 70% completada.',
    createdAt: '2026-07-23T08:00:00.000Z',
    updatedAt: '2026-07-23T18:00:00.000Z'
  },
  {
    id: 'task-1005',
    title: 'Revisión General de Insumos y Bolsas de Empaque',
    description: 'Verificar stock de rollos térmicos para NIIMBOT B1 Pro y bolsas Kraft.',
    type: 'GENERAL',
    status: 'PENDING_FRACTIONING',
    priority: 'LOW',
    assignedTo: 'Sofía Gomez',
    dueDate: '2026-07-26',
    notes: 'Registrar faltantes para pedido a proveedor.',
    createdAt: '2026-07-24T14:00:00.000Z',
    updatedAt: '2026-07-24T14:00:00.000Z'
  }
];

export class TaskService {
  private inMemoryTasks: OperationalTask[] = [...initialTasks];
  private isTableInitialized = false;

  constructor(private db: Pool) {}

  /**
   * Asegura la existencia de la tabla operational_tasks en PostgreSQL
   */
  private async ensureTableExists(): Promise<void> {
    if (this.isTableInitialized) return;

    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS operational_tasks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
          status VARCHAR(50) NOT NULL DEFAULT 'PENDING_FRACTIONING',
          priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
          assigned_to VARCHAR(150),
          order_id UUID,
          product_id UUID,
          product_name VARCHAR(255),
          quantity NUMERIC(12,3),
          unit_of_measure VARCHAR(50),
          due_date DATE,
          completed_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await this.db.query(createTableQuery);
      this.isTableInitialized = true;
    } catch (err) {
      // Si la DB no está disponible, se operará en modo memoria
      console.warn('⚠️ No se pudo verificar la tabla operational_tasks en DB. Usando almacenamiento en memoria fallback.');
    }
  }

  /**
   * Mapea una fila de la base de datos a la interfaz OperationalTask
   */
  private mapRowToTask(row: any): OperationalTask {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      type: row.type as TaskType,
      status: row.status as TaskKanbanStatus,
      priority: row.priority as TaskPriority,
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

  /**
   * Crea una nueva Tarea Operativa
   */
  public async createTask(dto: CreateTaskDTO): Promise<OperationalTask> {
    await this.ensureTableExists();

    const now = new Date().toISOString();
    const taskStatus: TaskKanbanStatus = dto.status || 'PENDING_FRACTIONING';
    const taskPriority: TaskPriority = dto.priority || 'MEDIUM';

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
    } catch (error) {
      // Fallback a almacenamiento en memoria
      const newTask: OperationalTask = {
        id: `task-${uuidv4().substring(0, 8)}`,
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

  /**
   * Obtiene el listado de tareas operativas filtradas
   */
  public async getTasks(filter: TaskFilterDTO = {}): Promise<{ tasks: OperationalTask[]; total: number }> {
    await this.ensureTableExists();

    try {
      let query = `SELECT * FROM operational_tasks WHERE 1=1`;
      const values: any[] = [];
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

      if (filter.orderId) {
        query += ` AND order_id = $${valIdx++}`;
        values.push(filter.orderId);
      }

      if (filter.productId) {
        query += ` AND product_id = $${valIdx++}`;
        values.push(filter.productId);
      }

      if (filter.search) {
        query += ` AND (title ILIKE $${valIdx} OR description ILIKE $${valIdx} OR product_name ILIKE $${valIdx} OR notes ILIKE $${valIdx})`;
        values.push(`%${filter.search}%`);
        valIdx++;
      }

      query += ` ORDER BY created_at DESC`;

      const res = await this.db.query(query, values);
      const tasks = res.rows.map((row) => this.mapRowToTask(row));

      return {
        tasks,
        total: tasks.length
      };
    } catch (error) {
      // Fallback a filtrado en memoria
      let filtered = [...this.inMemoryTasks];

      if (filter.type) {
        filtered = filtered.filter((t) => t.type === filter.type);
      }
      if (filter.status) {
        filtered = filtered.filter((t) => t.status === filter.status);
      }
      if (filter.priority) {
        filtered = filtered.filter((t) => t.priority === filter.priority);
      }
      if (filter.assignedTo) {
        filtered = filtered.filter(
          (t) => t.assignedTo && t.assignedTo.toLowerCase().includes(filter.assignedTo!.toLowerCase())
        );
      }
      if (filter.orderId) {
        filtered = filtered.filter((t) => t.orderId === filter.orderId);
      }
      if (filter.productId) {
        filtered = filtered.filter((t) => t.productId === filter.productId);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(searchLower) ||
            (t.description && t.description.toLowerCase().includes(searchLower)) ||
            (t.productName && t.productName.toLowerCase().includes(searchLower)) ||
            (t.notes && t.notes.toLowerCase().includes(searchLower))
        );
      }

      const limit = filter.limit || 50;
      const offset = filter.offset || 0;
      const paginated = filtered.slice(offset, offset + limit);

      return {
        tasks: paginated,
        total: filtered.length
      };
    }
  }

  /**
   * Obtiene una Tarea Operativa por su ID
   */
  public async getTaskById(id: string): Promise<OperationalTask> {
    await this.ensureTableExists();

    try {
      const res = await this.db.query(`SELECT * FROM operational_tasks WHERE id = $1`, [id]);
      if (res.rows.length === 0) {
        throw new Error(`Tarea operativa con ID ${id} no encontrada.`);
      }
      return this.mapRowToTask(res.rows[0]);
    } catch (error: any) {
      const task = this.inMemoryTasks.find((t) => t.id === id);
      if (!task) {
        throw new Error(`Tarea operativa con ID ${id} no encontrada.`);
      }
      return task;
    }
  }

  /**
   * Actualiza los datos generales de una Tarea Operativa
   */
  public async updateTask(id: string, dto: UpdateTaskDTO): Promise<OperationalTask> {
    await this.ensureTableExists();

    const existingTask = await this.getTaskById(id);
    const now = new Date().toISOString();

    const updatedStatus = dto.status || existingTask.status;
    const completedAt =
      updatedStatus === 'COMPLETED'
        ? existingTask.completedAt || now
        : undefined;

    try {
      const query = `
        UPDATE operational_tasks SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          type = COALESCE($3, type),
          status = COALESCE($4, status),
          priority = COALESCE($5, priority),
          assigned_to = COALESCE($6, assigned_to),
          order_id = COALESCE($7, order_id),
          product_id = COALESCE($8, product_id),
          product_name = COALESCE($9, product_name),
          quantity = COALESCE($10, quantity),
          unit_of_measure = COALESCE($11, unit_of_measure),
          due_date = COALESCE($12, due_date),
          notes = COALESCE($13, notes),
          completed_at = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *
      `;
      const values = [
        dto.title || null,
        dto.description || null,
        dto.type || null,
        dto.status || null,
        dto.priority || null,
        dto.assignedTo || null,
        dto.orderId || null,
        dto.productId || null,
        dto.productName || null,
        dto.quantity || null,
        dto.unitOfMeasure || null,
        dto.dueDate || null,
        dto.notes || null,
        completedAt || null,
        id
      ];

      const res = await this.db.query(query, values);
      return this.mapRowToTask(res.rows[0]);
    } catch (error) {
      const index = this.inMemoryTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Tarea operativa con ID ${id} no encontrada.`);
      }

      const updatedTask: OperationalTask = {
        ...this.inMemoryTasks[index],
        title: dto.title !== undefined ? dto.title : this.inMemoryTasks[index].title,
        description: dto.description !== undefined ? dto.description : this.inMemoryTasks[index].description,
        type: dto.type !== undefined ? dto.type : this.inMemoryTasks[index].type,
        status: updatedStatus,
        priority: dto.priority !== undefined ? dto.priority : this.inMemoryTasks[index].priority,
        assignedTo: dto.assignedTo !== undefined ? dto.assignedTo : this.inMemoryTasks[index].assignedTo,
        orderId: dto.orderId !== undefined ? dto.orderId : this.inMemoryTasks[index].orderId,
        productId: dto.productId !== undefined ? dto.productId : this.inMemoryTasks[index].productId,
        productName: dto.productName !== undefined ? dto.productName : this.inMemoryTasks[index].productName,
        quantity: dto.quantity !== undefined ? dto.quantity : this.inMemoryTasks[index].quantity,
        unitOfMeasure: dto.unitOfMeasure !== undefined ? dto.unitOfMeasure : this.inMemoryTasks[index].unitOfMeasure,
        dueDate: dto.dueDate !== undefined ? dto.dueDate : this.inMemoryTasks[index].dueDate,
        completedAt,
        notes: dto.notes !== undefined ? dto.notes : this.inMemoryTasks[index].notes,
        updatedAt: now
      };

      this.inMemoryTasks[index] = updatedTask;
      return updatedTask;
    }
  }

  /**
   * Actualiza el estado Kanban de una Tarea Operativa
   */
  public async updateTaskStatus(id: string, dto: UpdateTaskStatusDTO): Promise<OperationalTask> {
    await this.ensureTableExists();

    const existingTask = await this.getTaskById(id);
    const now = new Date().toISOString();
    const completedAt = dto.status === 'COMPLETED' ? now : undefined;

    try {
      const query = `
        UPDATE operational_tasks SET
          status = $1,
          notes = COALESCE($2, notes),
          assigned_to = COALESCE($3, assigned_to),
          completed_at = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      const values = [dto.status, dto.notes || null, dto.assignedTo || null, completedAt || null, id];
      const res = await this.db.query(query, values);
      return this.mapRowToTask(res.rows[0]);
    } catch (error) {
      const index = this.inMemoryTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Tarea operativa con ID ${id} no encontrada.`);
      }

      const updatedTask: OperationalTask = {
        ...this.inMemoryTasks[index],
        status: dto.status,
        notes: dto.notes ? `${this.inMemoryTasks[index].notes || ''}\n${dto.notes}`.trim() : this.inMemoryTasks[index].notes,
        assignedTo: dto.assignedTo || this.inMemoryTasks[index].assignedTo,
        completedAt: dto.status === 'COMPLETED' ? now : undefined,
        updatedAt: now
      };

      this.inMemoryTasks[index] = updatedTask;
      return updatedTask;
    }
  }

  /**
   * Elimina una Tarea Operativa
   */
  public async deleteTask(id: string): Promise<boolean> {
    await this.ensureTableExists();

    try {
      const res = await this.db.query(`DELETE FROM operational_tasks WHERE id = $1`, [id]);
      if (res.rowCount === 0) {
        throw new Error(`Tarea con ID ${id} no encontrada.`);
      }
      return true;
    } catch (error) {
      const index = this.inMemoryTasks.findIndex((t) => t.id === id);
      if (index === -1) {
        throw new Error(`Tarea con ID ${id} no encontrada.`);
      }
      this.inMemoryTasks.splice(index, 1);
      return true;
    }
  }

  /**
   * Obtiene la estructura estructurada del Tablero Kanban Operativo
   * Organizado en las 4 columnas principales:
   * 1. PENDING_FRACTIONING (Pendiente de Fraccionado)
   * 2. PACKAGING_IN_PROGRESS (Empaque en Proceso)
   * 3. QUALITY_CONTROL (Control de Calidad)
   * 4. COMPLETED (Completado)
   */
  public async getKanbanBoard(): Promise<OperationalKanbanBoard> {
    const { tasks } = await this.getTasks({ limit: 500 });

    const board: OperationalKanbanBoard = {
      PENDING_FRACTIONING: [],
      PACKAGING_IN_PROGRESS: [],
      QUALITY_CONTROL: [],
      COMPLETED: []
    };

    tasks.forEach((task) => {
      if (board[task.status]) {
        board[task.status].push(task);
      } else {
        board.PENDING_FRACTIONING.push(task);
      }
    });

    return board;
  }

  /**
   * Obtiene la estructura estructurada del Tablero Kanban de Ventas/Pedidos
   * Organizado en los 5 estados especificados:
   * 1. RECEIVED (Recibido)
   * 2. IN_PREPARATION (En Preparación)
   * 3. READY_FOR_DELIVERY (Listo para Entrega)
   * 4. IN_DELIVERY (En Camino / En Reparto)
   * 5. DELIVERED (Entregado / Completado)
   */
  public async getSalesKanbanBoard(): Promise<Record<SalesKanbanStatus, Order[]>> {
    const salesBoard: Record<SalesKanbanStatus, Order[]> = {
      RECEIVED: [],
      IN_PREPARATION: [],
      READY_FOR_DELIVERY: [],
      IN_DELIVERY: [],
      DELIVERED: []
    };

    try {
      const res = await this.db.query(
        `SELECT o.*, c.first_name, c.last_name FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         ORDER BY o.created_at DESC`
      );

      res.rows.forEach((row) => {
        const statusMap: Record<string, SalesKanbanStatus> = {
          RECEIVED: 'RECEIVED',
          PENDING: 'RECEIVED',
          IN_PREPARATION: 'IN_PREPARATION',
          PREPARING: 'IN_PREPARATION',
          READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
          READY: 'READY_FOR_DELIVERY',
          IN_DELIVERY: 'IN_DELIVERY',
          DELIVERED: 'DELIVERED'
        };

        const mappedStatus = statusMap[row.status] || 'RECEIVED';
        const orderItem: Order = {
          id: row.id,
          orderNumber: row.order_number,
          customerId: row.customer_id,
          customerName: row.first_name ? `${row.first_name} ${row.last_name}` : 'Cliente Registrado',
          quoteId: row.quote_id,
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
          deliveryAddress: row.delivery_address,
          notes: row.notes,
          items: [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };

        salesBoard[mappedStatus].push(orderItem);
      });
    } catch (err) {
      // Fallback mock para tablero de ventas si DB no responde
      const mockSalesOrders: Order[] = [
        {
          id: 'ord-001',
          orderNumber: 'PED-20260724-0001',
          customerId: 'c1000000-0000-0000-0000-000000000001',
          customerName: 'Martina Gómez',
          channel: AcquisitionChannel.WHATSAPP,
          status: 'RECEIVED',
          paymentStatus: 'UNPAID',
          subtotal: 12500,
          discountAmount: 0,
          deliveryFee: 1500,
          totalAmount: 14000,
          paidAmount: 0,
          balanceDue: 14000,
          pointsEarned: 140,
          deliveryAddress: 'Av. Corrientes 3421, CABA',
          notes: 'Entregar preferentemente por la tarde.',
          items: [],
          createdAt: '2026-07-24T14:00:00Z',
          updatedAt: '2026-07-24T14:00:00Z'
        },
        {
          id: 'ord-002',
          orderNumber: 'PED-20260724-0002',
          customerId: 'c2000000-0000-0000-0000-000000000002',
          customerName: 'Lucas Benítez',
          channel: AcquisitionChannel.LOCAL,
          status: 'IN_PREPARATION',
          paymentStatus: 'PAID',
          subtotal: 28500,
          discountAmount: 1000,
          deliveryFee: 0,
          totalAmount: 27500,
          paidAmount: 27500,
          balanceDue: 0,
          pointsEarned: 275,
          notes: 'Cliente retira por mostrador.',
          items: [],
          createdAt: '2026-07-24T12:30:00Z',
          updatedAt: '2026-07-24T13:00:00Z'
        },
        {
          id: 'ord-003',
          orderNumber: 'PED-20260723-0005',
          customerId: 'c1000000-0000-0000-0000-000000000001',
          customerName: 'Martina Gómez',
          channel: AcquisitionChannel.ONLINE_STORE,
          status: 'READY_FOR_DELIVERY',
          paymentStatus: 'PAID',
          subtotal: 18000,
          discountAmount: 0,
          deliveryFee: 2000,
          totalAmount: 20000,
          paidAmount: 20000,
          balanceDue: 0,
          pointsEarned: 200,
          deliveryAddress: 'Av. Corrientes 3421, CABA',
          items: [],
          createdAt: '2026-07-23T16:00:00Z',
          updatedAt: '2026-07-24T09:00:00Z'
        },
        {
          id: 'ord-004',
          orderNumber: 'PED-20260723-0003',
          customerId: 'c2000000-0000-0000-0000-000000000002',
          customerName: 'Lucas Benítez',
          channel: AcquisitionChannel.WHATSAPP,
          status: 'IN_DELIVERY',
          paymentStatus: 'PAID',
          subtotal: 9500,
          discountAmount: 0,
          deliveryFee: 1500,
          totalAmount: 11000,
          paidAmount: 11000,
          balanceDue: 0,
          pointsEarned: 110,
          deliveryAddress: 'Calle Florida 890, CABA',
          items: [],
          createdAt: '2026-07-23T11:00:00Z',
          updatedAt: '2026-07-24T10:15:00Z'
        },
        {
          id: 'ord-005',
          orderNumber: 'PED-20260722-0001',
          customerId: 'c1000000-0000-0000-0000-000000000001',
          customerName: 'Martina Gómez',
          channel: AcquisitionChannel.INSTAGRAM,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 31000,
          discountAmount: 2000,
          deliveryFee: 0,
          totalAmount: 29000,
          paidAmount: 29000,
          balanceDue: 0,
          pointsEarned: 290,
          items: [],
          createdAt: '2026-07-22T10:00:00Z',
          updatedAt: '2026-07-22T17:30:00Z'
        }
      ];

      mockSalesOrders.forEach((order) => {
        const mappedStatus = (order.status as SalesKanbanStatus) || 'RECEIVED';
        if (salesBoard[mappedStatus]) {
          salesBoard[mappedStatus].push(order);
        }
      });
    }

    return salesBoard;
  }
}
