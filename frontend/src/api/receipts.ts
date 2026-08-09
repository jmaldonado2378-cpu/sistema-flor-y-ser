import { apiRequest } from './client';

export interface ReceiptItem {
  id?: string;
  productId?: string;
  itemName: string;
  itemType?: string;
  quantity: number;
  unitOfMeasure?: string;
  unitCost: number;
  subtotal?: number;
}

export interface MerchandiseReceipt {
  id: string;
  receiptNumber?: string;
  supplierId: string;
  supplierName?: string;
  supplierTaxId?: string;
  receiptType?: string;
  issueDate?: string;
  receptionDate?: string;
  receiptDate?: string;
  dueDate?: string;
  totalAmount?: number;
  totalCost?: number;
  paidAmount?: number;
  pendingBalance?: number;
  paymentStatus?: string;
  items?: ReceiptItem[];
  notes?: string;
  createdAt?: string;
}

export interface CreateReceiptDTO {
  receiptNumber?: string;
  supplierId: string;
  receiptType?: string;
  issueDate?: string;
  receptionDate?: string;
  dueDate?: string;
  paymentTermsDays?: number;
  totalAmount?: number;
  totalCost?: number;
  items: ReceiptItem[];
  notes?: string;
}

export const getMerchandiseReceipts = async (): Promise<MerchandiseReceipt[]> => {
  const res = await apiRequest<any>('/merchandise-receipts');
  const list = Array.isArray(res) ? res : (res.data || res.receipts || []);
  return list;
};

export const getMerchandiseReceipt = async (id: string): Promise<MerchandiseReceipt> => {
  const res = await apiRequest<any>(`/merchandise-receipts/${id}`);
  return res.data || res;
};

export const createMerchandiseReceipt = async (data: CreateReceiptDTO): Promise<MerchandiseReceipt> => {
  const payload = {
    receiptNumber: data.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
    supplierId: data.supplierId,
    receiptType: data.receiptType || 'FACTURA',
    issueDate: data.issueDate || new Date().toISOString().split('T')[0],
    receptionDate: data.receptionDate || new Date().toISOString().split('T')[0],
    paymentTermsDays: 30,
    totalAmount: data.totalAmount || data.totalCost || 0,
    items: data.items.map(i => ({
      ...i,
      itemName: i.itemName || 'Insumo',
      itemType: i.itemType || 'GRANEL',
      unitOfMeasure: i.unitOfMeasure || 'KG',
      subtotal: (i.quantity || 0) * (i.unitCost || 0)
    })),
    notes: data.notes
  };
  const res = await apiRequest<any>('/merchandise-receipts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || res;
};

export const createRawMaterialReceipt = async (data: CreateReceiptDTO): Promise<MerchandiseReceipt> => {
  const res = await apiRequest<any>('/merchandise-receipts/raw', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};
