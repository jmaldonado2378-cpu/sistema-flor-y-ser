import { apiRequest } from './client';

export interface Supplier {
  id: string;
  name: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  createdAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
}

export interface MerchandiseReceipt {
  id: string;
  supplierId: string;
  receiptDate: string;
  totalCost: number;
  items: any[];
}

export interface MerchandiseReceiptDTO {
  supplierId: string;
  receiptDate: string;
  totalCost: number;
  items: any[];
}

export async function getSuppliers(): Promise<Supplier[]> {
  const res = await apiRequest<any>('/suppliers');
  const list = Array.isArray(res) ? res : (res.data || res.suppliers || []);
  return list.map((s: any) => ({
    ...s,
    name: s.name || s.businessName || 'Proveedor',
    businessName: s.businessName || s.name
  }));
}

export async function createSupplier(data: CreateSupplierDTO): Promise<Supplier> {
  const payload = {
    ...data,
    businessName: data.businessName || data.name,
    taxId: data.taxId || `30-${Math.floor(10000000 + Math.random() * 90000000)}-1`,
    phone: data.phone || '+54 9 11 0000-0000'
  };
  const res = await apiRequest<any>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || res;
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierDTO>): Promise<Supplier> {
  const res = await apiRequest<any>(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const res = await apiRequest<any>(`/suppliers/${id}`);
  const s = res.data || res;
  return {
    ...s,
    name: s.name || s.businessName || 'Proveedor',
    businessName: s.businessName || s.name
  };
}

export async function createMerchandiseReceipt(data: MerchandiseReceiptDTO): Promise<MerchandiseReceipt> {
  const res = await apiRequest<any>('/merchandise-receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
}
