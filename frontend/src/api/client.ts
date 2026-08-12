import {
  MOCK_ARTICLE_FAMILIES,
  MOCK_RAW_MATERIALS,
  MOCK_PACKAGING_MATERIALS,
  MOCK_FINAL_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_DIETARY_PROFILES,
  MOCK_TASKS,
  MOCK_EXPENSES,
  MOCK_SUPPLIERS,
  MOCK_RECEIPTS
} from './mockData';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_SETTINGS = {
  businessInfo: {
    name: 'Flor y Ser Almacén Natural',
    cuit: '30-71689452-9',
    whatsapp: '+5491155439821',
    address: 'Av. Corrientes 3421, CABA, Argentina',
    logoUrl: ''
  },
  printSettings: {
    defaultPrinter: 'NIIMBOT B1 Pro (Mostrador)',
    dpi: 203
  },
  channelCommissions: {
    mostrador: 0,
    whatsapp: 2.5,
    tiendaOnline: 5.0,
    mercadoPago: 4.5,
    tarjetas: 3.5
  },
  helpSettings: {
    supportEmail: 'soporte@floryser.com.ar',
    supportPhone: '+54 9 11 5543-9821',
    posGuide: 'Registre ventas en mostrador, aplique descuentos y gestione el ticket.',
    rawGuide: 'Asigne la familia correspondiente a cada insumo o granel.',
    permGuide: 'Configure el acceso a Kanban de Tareas por cada usuario vendedor.'
  }
};

// Interface y funciones para el Registro de Auditoría (Audit Log)
export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
}

export function getAuditLogs(): AuditLog[] {
  return getCollection<AuditLog>('audit_logs', [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userName: 'Juan Pablo',
      userEmail: 'jmaldonado2378@gmail.com',
      userRole: 'ADMIN',
      action: 'INICIO_SESION',
      module: 'Sistema',
      details: 'Inicio de sesión exitoso como Administrador'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userName: 'Juan Pablo',
      userEmail: 'jmaldonado2378@gmail.com',
      userRole: 'ADMIN',
      action: 'UPDATE_PERMISOS',
      module: 'Usuarios & Permisos',
      details: 'Actualización de permisos para Rocio Quevedo (Kanban Tareas habilitado)'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      userName: 'Rocio Quevedo',
      userEmail: 'rocioQ@floryser.com',
      userRole: 'SELLER',
      action: 'NUEVA_MATERIA_PRIMA',
      module: 'Inventario',
      details: 'Ingreso de lote de Ácido Ascórbico MP-ACI-01 en Depósito A'
    }
  ]);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = getAuditLogs();
  const newEntry: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  saveCollection('audit_logs', [newEntry, ...logs]);
}

// Helpers genéricos de persitencia local para modo Fallback estático
function getCollection<T>(key: string, defaultData: T[]): T[] {
  const saved = localStorage.getItem(`floryser_${key}_v2`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return defaultData;
}

function saveCollection<T>(key: string, data: T[]) {
  localStorage.setItem(`floryser_${key}_v2`, JSON.stringify(data));
}

function getStoredSettings() {
  const saved = localStorage.getItem('floryser_settings_v2');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return DEFAULT_SETTINGS;
}

function saveStoredSettings(newSettings: any) {
  localStorage.setItem('floryser_settings_v2', JSON.stringify(newSettings));
  window.dispatchEvent(new Event('floryser_settings_updated'));
}

function getLocalDataFallback<T>(endpoint: string, method: string = 'GET', bodyData?: any): T | null {
  const cleanEndpoint = endpoint.split('?')[0];

  // 1. PETICIONES GET
  if (method === 'GET') {
    if (cleanEndpoint === '/article-families' || cleanEndpoint.startsWith('/article-families/')) {
      const data = getCollection('families', MOCK_ARTICLE_FAMILIES);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/raw-materials' || cleanEndpoint.startsWith('/raw-materials/')) {
      const data = getCollection('raw_materials', MOCK_RAW_MATERIALS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/packaging-materials' || cleanEndpoint.startsWith('/packaging-materials/')) {
      const data = getCollection('packaging', MOCK_PACKAGING_MATERIALS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/final-products' || cleanEndpoint.startsWith('/final-products/')) {
      const data = getCollection('final_products', MOCK_FINAL_PRODUCTS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/customers' || cleanEndpoint.startsWith('/customers/')) {
      const data = getCollection('customers', MOCK_CUSTOMERS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/merchandise-receipts' || cleanEndpoint.startsWith('/merchandise-receipts/')) {
      const data = getCollection('receipts', MOCK_RECEIPTS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/dietary-profiles' || cleanEndpoint.startsWith('/dietary-profiles/')) {
      return { status: 'success', data: MOCK_DIETARY_PROFILES } as unknown as T;
    }
    if (cleanEndpoint.includes('sales-kanban') || cleanEndpoint.includes('orders/kanban')) {
      const orders = getCollection('sales_orders', [
        {
          id: 'ord-101',
          orderNumber: 'PED-20260812-0001',
          customerId: 'cust-1',
          customerName: 'María Clara Fernández',
          totalAmount: 17500,
          status: 'RECEIVED',
          paymentMethod: 'Efectivo',
          channel: 'LOCAL',
          createdAt: new Date().toISOString(),
          items: [
            { productId: 'p1', productName: 'Almendras Nonpareil 1kg', quantity: 1, unitPrice: 8500 }
          ]
        }
      ]);

      return {
        status: 'success',
        data: {
          RECEIVED: orders.filter((o: any) => o.status === 'RECEIVED' || o.status === 'PENDING' || !o.status),
          IN_PREPARATION: orders.filter((o: any) => o.status === 'IN_PREPARATION'),
          READY_FOR_DELIVERY: orders.filter((o: any) => o.status === 'READY_FOR_DELIVERY'),
          IN_DELIVERY: orders.filter((o: any) => o.status === 'IN_DELIVERY'),
          DELIVERED: orders.filter((o: any) => o.status === 'DELIVERED')
        }
      } as unknown as T;
    }

    if (cleanEndpoint === '/tasks' || cleanEndpoint.startsWith('/tasks/')) {
      const data = getCollection('tasks', MOCK_TASKS);
      return { status: 'success', data } as unknown as T;
    }

    if (cleanEndpoint === '/sales/checking-accounts' || cleanEndpoint.includes('/checking-account')) {
      const customers: any[] = getCollection('customers', MOCK_CUSTOMERS);
      const orders: any[] = getCollection('sales_orders', []);
      const movements: any[] = getCollection('checking_account_movements', []);

      if (cleanEndpoint.endsWith('/statement')) {
        const parts = cleanEndpoint.split('/');
        const custId = parts[3];
        const custMovements = movements.filter((m: any) => m.customerId === custId);
        return { status: 'success', data: custMovements } as unknown as T;
      }

      const summaries = customers.map((c: any) => {
        const custOrders = orders.filter((o: any) => o.customerId === c.id || o.customerName === c.fullName);
        const custMovements = movements.filter((m: any) => m.customerId === c.id);
        const totalPurchases = custOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
        const calcBalance = c.currentBalance !== undefined ? Math.abs(c.currentBalance) : totalPurchases;

        return {
          customerId: c.id,
          customerName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente Registrado',
          phoneWhatsapp: c.phoneWhatsapp || c.whatsapp || '+5491155443322',
          email: c.email || 'cliente@floryser.com',
          balance: calcBalance,
          currentBalance: calcBalance,
          creditLimit: c.creditLimit || 20000,
          availableCredit: Math.max(0, (c.creditLimit || 20000) - calcBalance),
          lastMovementDate: custOrders[0]?.createdAt || new Date().toISOString()
        };
      });

      if (cleanEndpoint.startsWith('/sales/customers/')) {
        const parts = cleanEndpoint.split('/');
        const custId = parts[3];
        const found = summaries.find(s => s.customerId === custId) || summaries[0];
        return { status: 'success', data: found } as unknown as T;
      }

      return { status: 'success', data: summaries } as unknown as T;
    }

    if (cleanEndpoint === '/finance/expenses' || cleanEndpoint.startsWith('/finance/expenses/')) {
      const data = getCollection('expenses', MOCK_EXPENSES);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/suppliers' || cleanEndpoint.startsWith('/suppliers/')) {
      const data = getCollection('suppliers', MOCK_SUPPLIERS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/sales/orders' || cleanEndpoint.startsWith('/sales/orders')) {
      const data = getCollection('sales_orders', [
        {
          id: 'ord-101',
          orderNumber: 'PED-20260812-0001',
          customerId: 'cust-1',
          customerName: 'María Clara Fernández',
          totalAmount: 17500,
          status: 'RECEIVED',
          paymentMethod: 'Efectivo',
          channel: 'LOCAL',
          createdAt: new Date().toISOString(),
          items: [
            { productId: 'p1', productName: 'Almendras Nonpareil 1kg', quantity: 1, unitPrice: 8500 },
            { productId: 'p3', productName: 'Mix Frutos Secos 1kg', quantity: 1, unitPrice: 9000 }
          ]
        }
      ]);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/settings') {
      return { status: 'success', data: getStoredSettings() } as unknown as T;
    }
  }

  // 2. PETICIONES POST / PUT / PATCH (PERSISTENCIA LOCAL DE NUEVOS REGISTROS)
  if (method === 'POST') {
    if (cleanEndpoint === '/sales/orders' || cleanEndpoint.startsWith('/sales/orders')) {
      const currentOrders = getCollection('sales_orders', []);
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const seq = (currentOrders.length + 1).toString().padStart(4, '0');
      const orderAmount = Number(bodyData?.totalAmount) || 0;

      const newOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: `PED-${todayStr}-${seq}`,
        customerId: bodyData?.customerId || 'cust-1',
        customerName: bodyData?.customerName || 'Cliente Registrado',
        channel: bodyData?.channel || 'LOCAL',
        status: 'RECEIVED', // Inicializa en Pendiente / Recibido para el Kanban de Pedidos
        paymentMethod: bodyData?.paymentMethod || 'Efectivo',
        totalAmount: orderAmount,
        items: bodyData?.items || [],
        createdAt: new Date().toISOString()
      };
      saveCollection('sales_orders', [newOrder, ...currentOrders]);

      // Impactar en Cta Cte del Cliente
      const customers = getCollection('customers', MOCK_CUSTOMERS);
      let targetCust = customers.find((c: any) => c.id === bodyData?.customerId || (c.firstName && bodyData?.customerName?.includes(c.firstName)));
      if (!targetCust && customers.length > 0) {
        targetCust = customers[0];
      }
      const targetCustId = targetCust ? targetCust.id : (bodyData?.customerId || 'cust-1');

      const updatedCusts = customers.map((c: any) => {
        if (c.id === targetCustId) {
          const currentBal = Math.abs(c.currentBalance || 0);
          return {
            ...c,
            currentBalance: currentBal + orderAmount
          };
        }
        return c;
      });
      saveCollection('customers', updatedCusts);

      const movements = getCollection('checking_account_movements', []);
      const newMovement = {
        id: `mov-${Date.now()}`,
        customerId: targetCustId,
        customerName: newOrder.customerName,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        type: 'VENTA',
        movementType: 'DEBIT',
        tipoMovimiento: 'DÉBITO',
        description: `Venta Registrada #${newOrder.orderNumber}`,
        descripcion: `Venta Registrada #${newOrder.orderNumber}`,
        amount: orderAmount,
        monto: orderAmount,
        balanceAfter: Math.abs(targetCust?.currentBalance || 0) + orderAmount
      };
      saveCollection('checking_account_movements', [newMovement, ...movements]);

      addAuditLog({
        userName: bodyData?.customerName ? 'Usuario Venta' : 'Vendedor',
        userEmail: 'vendedor@floryser.com',
        userRole: 'SELLER',
        action: 'NUEVA_VENTA',
        module: 'Comercial / Ventas',
        details: `Registro de venta #${newOrder.orderNumber} por un total de $${newOrder.totalAmount.toLocaleString('es-AR')}`
      });

      return { status: 'success', data: newOrder } as unknown as T;
    }
    if (cleanEndpoint === '/merchandise-receipts' || cleanEndpoint === '/merchandise-receipts/raw') {
      const currentReceipts = getCollection('receipts', MOCK_RECEIPTS);
      const suppliers = getCollection('suppliers', MOCK_SUPPLIERS);
      const foundSupplier = suppliers.find((s: any) => s.id === bodyData?.supplierId);

      const newReceipt = {
        id: `rec-${Date.now()}`,
        receiptNumber: bodyData?.receiptNumber || `FC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100000 + Math.random() * 900000)}`,
        supplierId: bodyData?.supplierId || 'supp-1',
        supplierName: foundSupplier ? foundSupplier.name : 'Proveedor General',
        receiptType: bodyData?.receiptType || 'FACTURA',
        issueDate: bodyData?.receptionDate || new Date().toISOString().split('T')[0],
        receptionDate: bodyData?.receptionDate || new Date().toISOString().split('T')[0],
        totalAmount: bodyData?.totalAmount || bodyData?.totalCost || 0,
        totalCost: bodyData?.totalAmount || bodyData?.totalCost || 0,
        paidAmount: bodyData?.totalAmount || bodyData?.totalCost || 0,
        pendingBalance: 0,
        paymentStatus: 'PAID',
        items: bodyData?.items || [],
        notes: bodyData?.notes || '',
        createdAt: new Date().toISOString()
      };

      const updatedReceipts = [newReceipt, ...currentReceipts];
      saveCollection('receipts', updatedReceipts);
      return { status: 'success', data: newReceipt } as unknown as T;
    }

    if (cleanEndpoint === '/packaging-materials') {
      const current = getCollection('packaging', MOCK_PACKAGING_MATERIALS);
      const newItem = {
        id: `pack-${Date.now()}`,
        code: bodyData?.code || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: bodyData?.name || 'Empaque',
        category: bodyData?.category || 'DOYPACK',
        unit: bodyData?.unit || 'unidades',
        currentStock: Number(bodyData?.currentStock) || 0,
        minStock: Number(bodyData?.minStock) || 10,
        costPerUnit: Number(bodyData?.costPerUnit) || 0,
        supplierName: bodyData?.supplierName || 'Proveedor',
        storageLocation: bodyData?.storageLocation || 'Depósito C',
        familyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        articleFamilyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      saveCollection('packaging', [...current, newItem]);
      return { status: 'success', data: newItem } as unknown as T;
    }

    if (cleanEndpoint === '/raw-materials') {
      const current = getCollection('raw_materials', MOCK_RAW_MATERIALS);
      const newItem = {
        id: `raw-${Date.now()}`,
        code: bodyData?.code || `MP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: bodyData?.name || 'Materia Prima',
        unit: bodyData?.unit || 'kg',
        currentStock: Number(bodyData?.currentStock) || 0,
        minStock: Number(bodyData?.minStock) || 10,
        costPerUnit: Number(bodyData?.costPerUnit) || 0,
        supplierName: bodyData?.supplierName || 'Proveedor',
        storageLocation: bodyData?.storageLocation || 'Depósito A',
        familyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        articleFamilyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        createdAt: new Date().toISOString()
      };
      saveCollection('raw_materials', [...current, newItem]);
      return { status: 'success', data: newItem } as unknown as T;
    }

    if (cleanEndpoint === '/final-products') {
      const current = getCollection('final_products', MOCK_FINAL_PRODUCTS);
      const newItem = {
        id: `final-${Date.now()}`,
        code: bodyData?.code || `PF-${Math.floor(1000 + Math.random() * 9000)}`,
        name: bodyData?.name || 'Producto Final',
        unitWeightGrams: Number(bodyData?.unitWeightGrams) || 500,
        currentStock: Number(bodyData?.currentStock) || 0,
        minStock: Number(bodyData?.minStock) || 10,
        price: Number(bodyData?.price) || 0,
        familyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        articleFamilyId: bodyData?.familyId || bodyData?.articleFamilyId || '',
        createdAt: new Date().toISOString()
      };
      saveCollection('final_products', [...current, newItem]);
      return { status: 'success', data: newItem } as unknown as T;
    }

    if (cleanEndpoint === '/suppliers') {
      const current = getCollection('suppliers', MOCK_SUPPLIERS);
      const newItem = {
        id: `supp-${Date.now()}`,
        name: bodyData?.name || bodyData?.businessName || 'Proveedor',
        businessName: bodyData?.businessName || bodyData?.name || 'Proveedor',
        contactName: bodyData?.contactName || '',
        phone: bodyData?.phone || '',
        email: bodyData?.email || '',
        taxId: bodyData?.taxId || '',
        createdAt: new Date().toISOString()
      };
      saveCollection('suppliers', [...current, newItem]);
      return { status: 'success', data: newItem } as unknown as T;
    }

    if (cleanEndpoint === '/customers') {
      const current = getCollection('customers', MOCK_CUSTOMERS);
      const newItem = {
        id: `cust-${Date.now()}`,
        firstName: bodyData?.firstName || 'Cliente',
        lastName: bodyData?.lastName || '',
        fullName: `${bodyData?.firstName || ''} ${bodyData?.lastName || ''}`.trim(),
        phoneWhatsapp: bodyData?.phoneWhatsapp || '',
        email: bodyData?.email || '',
        address: bodyData?.address || '',
        dietaryProfiles: bodyData?.dietaryProfiles || [],
        preferredChannel: bodyData?.preferredChannel || 'LOCAL',
        currentBalance: 0,
        creditLimit: 15000,
        totalPoints: 0,
        segment: 'NUEVO'
      };
      saveCollection('customers', [...current, newItem]);
      return { status: 'success', data: newItem } as unknown as T;
    }

    if (cleanEndpoint === '/tasks' || cleanEndpoint.startsWith('/tasks')) {
      const current = getCollection('tasks', MOCK_TASKS);
      const newTask = {
        id: `task-${Date.now()}`,
        title: bodyData?.title || 'Nueva Tarea',
        description: bodyData?.notes || bodyData?.description || '',
        notes: bodyData?.notes || '',
        type: bodyData?.type || 'GENERAL',
        priority: bodyData?.priority || 'MEDIUM',
        assignedTo: bodyData?.assignedTo || 'Responsable',
        assignee: bodyData?.assignedTo || 'Responsable',
        dueDate: bodyData?.dueDate || new Date().toISOString().split('T')[0],
        status: bodyData?.status || 'PENDING_FRACTIONING',
        createdAt: new Date().toISOString()
      };
      saveCollection('tasks', [newTask, ...current]);
      return { status: 'success', data: newTask } as unknown as T;
    }
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (cleanEndpoint.startsWith('/raw-materials/')) {
      const parts = cleanEndpoint.split('/');
      const id = parts[2];
      const current = getCollection('raw_materials', MOCK_RAW_MATERIALS);
      const updated = current.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            ...bodyData,
            familyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.familyId,
            articleFamilyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.articleFamilyId
          };
        }
        return item;
      });
      saveCollection('raw_materials', updated);
      const found = updated.find((i: any) => i.id === id);
      return { status: 'success', data: found } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/packaging-materials/')) {
      const parts = cleanEndpoint.split('/');
      const id = parts[2];
      const current = getCollection('packaging', MOCK_PACKAGING_MATERIALS);
      const updated = current.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            ...bodyData,
            familyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.familyId,
            articleFamilyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.articleFamilyId
          };
        }
        return item;
      });
      saveCollection('packaging', updated);
      const found = updated.find((i: any) => i.id === id);
      return { status: 'success', data: found } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/final-products/')) {
      const parts = cleanEndpoint.split('/');
      const id = parts[2];
      const current = getCollection('final_products', MOCK_FINAL_PRODUCTS);
      const updated = current.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            ...bodyData,
            familyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.familyId,
            articleFamilyId: bodyData?.familyId !== undefined ? bodyData.familyId : item.articleFamilyId
          };
        }
        return item;
      });
      saveCollection('final_products', updated);
      const found = updated.find((i: any) => i.id === id);
      return { status: 'success', data: found } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/tasks/')) {
      const parts = cleanEndpoint.split('/');
      const taskId = parts[2];
      const currentTasks = getCollection('tasks', MOCK_TASKS);
      const updatedTasks = currentTasks.map((t: any) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: bodyData?.status || t.status,
            ...bodyData
          };
        }
        return t;
      });
      saveCollection('tasks', updatedTasks);
      const found = updatedTasks.find((t: any) => t.id === taskId);
      return { status: 'success', data: found } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/suppliers/')) {
      const parts = cleanEndpoint.split('/');
      const id = parts[2];
      const current = getCollection('suppliers', MOCK_SUPPLIERS);
      const updated = current.map((item: any) => {
        if (item.id === id) {
          return {
            ...item,
            ...bodyData,
            name: bodyData?.name || bodyData?.businessName || item.name,
            businessName: bodyData?.businessName || bodyData?.name || item.businessName
          };
        }
        return item;
      });
      saveCollection('suppliers', updated);
      const found = updated.find((i: any) => i.id === id);
      return { status: 'success', data: found } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/sales/orders/') && cleanEndpoint.endsWith('/status')) {
      const parts = cleanEndpoint.split('/');
      const orderId = parts[3];
      const orders = getCollection('sales_orders', []);
      const updatedOrders = orders.map((o: any) => {
        if (o.id === orderId) {
          return { ...o, status: bodyData?.status || o.status };
        }
        return o;
      });
      saveCollection('sales_orders', updatedOrders);
      const updatedOrder = updatedOrders.find((o: any) => o.id === orderId) || { id: orderId, status: bodyData?.status };
      return { status: 'success', data: updatedOrder } as unknown as T;
    }

    if (cleanEndpoint.startsWith('/settings')) {
      const current = getStoredSettings();
      let updated = { ...current };

      if (cleanEndpoint === '/settings/business-info') {
        updated.businessInfo = { ...current.businessInfo, ...bodyData };
      } else if (cleanEndpoint === '/settings/print') {
        updated.printSettings = { ...current.printSettings, ...bodyData };
      } else if (cleanEndpoint === '/settings/commissions') {
        updated.channelCommissions = { ...current.channelCommissions, ...bodyData };
      } else if (cleanEndpoint === '/settings/help') {
        updated.helpSettings = { ...current.helpSettings, ...bodyData };
      } else {
        updated = { ...current, ...bodyData };
      }

      saveStoredSettings(updated);
      return { status: 'success', message: 'Configuración actualizada.', data: updated } as unknown as T;
    }
  }

  if (method === 'DELETE') {
    if (cleanEndpoint.startsWith('/tasks/')) {
      const parts = cleanEndpoint.split('/');
      const taskId = parts[2];
      const currentTasks = getCollection('tasks', MOCK_TASKS);
      const updatedTasks = currentTasks.filter((t: any) => t.id !== taskId);
      saveCollection('tasks', updatedTasks);
      return { status: 'success', message: 'Tarea eliminada' } as unknown as T;
    }
  }

  return { status: 'success', message: 'Operación realizada en modo local.' } as unknown as T;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const method = options.method || 'GET';
  let bodyData: any = null;
  if (options.body && typeof options.body === 'string') {
    try { bodyData = JSON.parse(options.body); } catch (e) {}
  }

  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    
    if (!response.ok || !contentType.includes('application/json')) {
      const fallback = getLocalDataFallback<T>(endpoint, method, bodyData);
      if (fallback !== null) {
        return fallback;
      }
      const body = await response.json().catch(() => ({}));
      throw new ApiError(response.status, body.error || body.message || `Error ${response.status}`, body.details);
    }
    
    return await response.json() as T;
  } catch (error) {
    const fallback = getLocalDataFallback<T>(endpoint, method, bodyData);
    if (fallback !== null) {
      return fallback;
    }
    throw error;
  }
}
