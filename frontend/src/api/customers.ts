import { apiRequest } from './client';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneWhatsapp: string;
  email?: string;
  instagram?: string;
  address?: string;
  birthDate?: string;
  preferredChannel?: string;
  segment?: string;
  points?: number;
  accountBalance?: number;
  dietaryProfiles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDTO {
  firstName: string;
  lastName: string;
  phoneWhatsapp: string;
  email?: string;
  instagram?: string;
  address?: string;
  birthDate?: string;
  preferredChannel?: string;
  notes?: string;
}

export interface CustomerFilterDTO {
  search?: string;
  channel?: string;
  page?: number;
  limit?: number;
}

export interface UnifiedProfile {
  customer: Customer;
  recentOrders: any[];
  totalSpent: number;
}

export interface CustomersResponse {
  success?: boolean;
  data: Customer[];
  total?: number;
  message?: string;
}

export async function getCustomers(filters?: CustomerFilterDTO): Promise<{ data: Customer[]; total: number }> {
  const query = new URLSearchParams();
  if (filters?.search) query.append('search', filters.search);
  if (filters?.channel) query.append('channel', filters.channel);
  if (filters?.page) query.append('page', filters.page.toString());
  if (filters?.limit) query.append('limit', filters.limit.toString());
  
  const qs = query.toString();
  const endpoint = qs ? `/customers?${qs}` : '/customers';
  
  const res = await apiRequest<any>(endpoint);
  // Backend returns either { success: true, data: [...], total: N } or array directly
  const list = Array.isArray(res) ? res : (res.data || []);
  const total = Array.isArray(res) ? res.length : (res.total || list.length);
  
  return { data: list, total };
}

export async function createCustomer(data: CreateCustomerDTO): Promise<Customer> {
  const res = await apiRequest<any>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
}

export async function getCustomerProfile(id: string): Promise<UnifiedProfile> {
  const res = await apiRequest<any>(`/customers/${id}/unified-profile`);
  return res.data || res;
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerDTO>): Promise<Customer> {
  const res = await apiRequest<any>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiRequest(`/customers/${id}`, {
    method: 'DELETE',
  });
}
