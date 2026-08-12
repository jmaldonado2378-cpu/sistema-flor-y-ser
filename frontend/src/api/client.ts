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
  }
};

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
    if (cleanEndpoint === '/tasks' || cleanEndpoint.startsWith('/tasks/')) {
      const data = getCollection('tasks', MOCK_TASKS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint.startsWith('/tasks/kanban/board')) {
      const tasks = getCollection('tasks', MOCK_TASKS);
      return {
        status: 'success',
        data: {
          todo: tasks.filter((t: any) => t.status === 'PENDING'),
          inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS'),
          done: tasks.filter((t: any) => t.status === 'COMPLETED')
        }
      } as unknown as T;
    }
    if (cleanEndpoint === '/finance/expenses' || cleanEndpoint.startsWith('/finance/expenses/')) {
      const data = getCollection('expenses', MOCK_EXPENSES);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/suppliers' || cleanEndpoint.startsWith('/suppliers/')) {
      const data = getCollection('suppliers', MOCK_SUPPLIERS);
      return { status: 'success', data } as unknown as T;
    }
    if (cleanEndpoint === '/settings') {
      return { status: 'success', data: getStoredSettings() } as unknown as T;
    }
  }

  // 2. PETICIONES POST / PUT / PATCH (PERSISTENCIA LOCAL DE NUEVOS REGISTROS)
  if (method === 'POST') {
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
        createdAt: new Date().toISOString()
      };
      saveCollection('raw_materials', [...current, newItem]);
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
  }

  if (method === 'PATCH' || method === 'PUT') {
    if (cleanEndpoint.startsWith('/settings')) {
      const current = getStoredSettings();
      let updated = { ...current };

      if (cleanEndpoint === '/settings/business-info') {
        updated.businessInfo = { ...current.businessInfo, ...bodyData };
      } else if (cleanEndpoint === '/settings/print') {
        updated.printSettings = { ...current.printSettings, ...bodyData };
      } else if (cleanEndpoint === '/settings/commissions') {
        updated.channelCommissions = { ...current.channelCommissions, ...bodyData };
      } else {
        updated = { ...current, ...bodyData };
      }

      saveStoredSettings(updated);
      return { status: 'success', message: 'Configuración actualizada.', data: updated } as unknown as T;
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
