import {
  MOCK_ARTICLE_FAMILIES,
  MOCK_RAW_MATERIALS,
  MOCK_PACKAGING_MATERIALS,
  MOCK_FINAL_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_DIETARY_PROFILES,
  MOCK_TASKS,
  MOCK_EXPENSES,
  MOCK_SUPPLIERS
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
  // Disparar evento personalizado para actualizar Sidebar y componentes en tiempo real
  window.dispatchEvent(new Event('floryser_settings_updated'));
}

function getLocalDataFallback<T>(endpoint: string, method: string = 'GET', bodyData?: any): T | null {
  const cleanEndpoint = endpoint.split('?')[0];

  if (method === 'GET') {
    if (cleanEndpoint === '/article-families' || cleanEndpoint.startsWith('/article-families/')) {
      return MOCK_ARTICLE_FAMILIES as unknown as T;
    }
    if (cleanEndpoint === '/raw-materials' || cleanEndpoint.startsWith('/raw-materials/')) {
      return MOCK_RAW_MATERIALS as unknown as T;
    }
    if (cleanEndpoint === '/packaging-materials' || cleanEndpoint.startsWith('/packaging-materials/')) {
      return MOCK_PACKAGING_MATERIALS as unknown as T;
    }
    if (cleanEndpoint === '/final-products' || cleanEndpoint.startsWith('/final-products/')) {
      return MOCK_FINAL_PRODUCTS as unknown as T;
    }
    if (cleanEndpoint === '/customers' || cleanEndpoint.startsWith('/customers/')) {
      return MOCK_CUSTOMERS as unknown as T;
    }
    if (cleanEndpoint === '/dietary-profiles' || cleanEndpoint.startsWith('/dietary-profiles/')) {
      return MOCK_DIETARY_PROFILES as unknown as T;
    }
    if (cleanEndpoint === '/tasks' || cleanEndpoint.startsWith('/tasks/')) {
      return MOCK_TASKS as unknown as T;
    }
    if (cleanEndpoint.startsWith('/tasks/kanban/board')) {
      return {
        todo: MOCK_TASKS.filter(t => t.status === 'PENDING'),
        inProgress: MOCK_TASKS.filter(t => t.status === 'IN_PROGRESS'),
        done: MOCK_TASKS.filter(t => t.status === 'COMPLETED')
      } as unknown as T;
    }
    if (cleanEndpoint === '/finance/expenses' || cleanEndpoint.startsWith('/finance/expenses/')) {
      return MOCK_EXPENSES as unknown as T;
    }
    if (cleanEndpoint === '/suppliers' || cleanEndpoint.startsWith('/suppliers/')) {
      return MOCK_SUPPLIERS as unknown as T;
    }
    if (cleanEndpoint === '/settings') {
      return getStoredSettings() as unknown as T;
    }
  }

  // Guardado de Configuración y Logo en LocalStorage
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
      return { success: true, message: 'Configuración actualizada en almacenamiento local.', data: updated } as unknown as T;
    }
  }

  // Fallback genérico para llamadas POST/PUT en modo demostrativo estático
  return { success: true, message: 'Operación realizada en modo local/demostrativo.' } as unknown as T;
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
    
    // Si la respuesta no es OK o la respuesta no es JSON (ej. página 404 HTML de Apache/Hostinger)
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
