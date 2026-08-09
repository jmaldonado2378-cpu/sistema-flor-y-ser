const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: { 'Content-Type': 'application/json', ...options.headers as Record<string,string> },
    ...options,
  };
  const response = await fetch(url, config);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, body.error || body.message || `Error ${response.status}`, body.details);
  }
  return body as T;
}
