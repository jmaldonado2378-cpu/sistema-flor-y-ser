import { apiRequest } from './client';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface CreateOrderDTO {
  customerId: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  channel?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderFilterDTO {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getOrders(filters?: OrderFilterDTO): Promise<{ data: Order[]; total: number }> {
  const query = new URLSearchParams();
  if (filters?.status) query.append('status', filters.status);
  if (filters?.customerId) query.append('customerId', filters.customerId);
  if (filters?.startDate) query.append('startDate', filters.startDate);
  if (filters?.endDate) query.append('endDate', filters.endDate);
  if (filters?.page) query.append('page', filters.page.toString());
  if (filters?.limit) query.append('limit', filters.limit.toString());
  
  const qs = query.toString();
  const endpoint = qs ? `/sales/orders?${qs}` : '/sales/orders';
  
  const res = await apiRequest<any>(endpoint);
  const list = Array.isArray(res) ? res : (res.data || []);
  const total = Array.isArray(res) ? res.length : (res.total || list.length);
  return { data: list, total };
}

export async function createOrder(data: CreateOrderDTO): Promise<Order> {
  const res = await apiRequest<any>('/sales/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
}

export async function getOrderById(id: string): Promise<Order> {
  const res = await apiRequest<any>(`/sales/orders/${id}`);
  return res.data || res;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const res = await apiRequest<any>(`/sales/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data || res;
}
