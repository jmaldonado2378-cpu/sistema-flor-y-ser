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

function getLocalDataFallback<T>(endpoint: string, method: string = 'GET'): T | null {
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
      return {
        businessName: 'Flor y Ser Almacén Natural',
        cuit: '30-71629481-9',
        address: 'Av. Corrientes 1234, CABA',
        phone: '+54 9 11 5544-3322',
        ticketFooterMessage: '¡Gracias por elegir productos saludables y conscientes!'
      } as unknown as T;
    }
  }

  // Fallback genérico para llamadas POST/PUT en modo demostrativo estático
  return { success: true, message: 'Operación realizada en modo local/demostrativo.' } as unknown as T;
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const method = options.method || 'GET';
  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string, string> },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type') || '';
    
    // Si la respuesta no es OK o la respuesta no es JSON (ej. página 404 HTML de Apache/Hostinger)
    if (!response.ok || !contentType.includes('application/json')) {
      const fallback = getLocalDataFallback<T>(endpoint, method);
      if (fallback !== null) {
        console.warn(`[Hostinger Fallback] Usando datos locales de respaldo para ${endpoint}`);
        return fallback;
      }
      const body = await response.json().catch(() => ({}));
      throw new ApiError(response.status, body.error || body.message || `Error ${response.status}`, body.details);
    }
    
    return await response.json() as T;
  } catch (error) {
    // Si ocurre un error de red o servidor no disponible
    const fallback = getLocalDataFallback<T>(endpoint, method);
    if (fallback !== null) {
      console.warn(`[Hostinger Fallback] Redirigiendo a datos locales para ${endpoint}`);
      return fallback;
    }
    throw error;
  }
}
