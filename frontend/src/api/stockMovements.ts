import { apiRequest } from './client';

export type StockItemType = 'RAW_MATERIAL' | 'FINAL_PRODUCT' | 'PACKAGING';

export type StockMovementType =
  | 'PURCHASE_RECEIPT'
  | 'PURCHASE_RETURN'
  | 'SALE'
  | 'SALE_CANCEL'
  | 'FRACTIONING_INPUT'
  | 'FRACTIONING_OUTPUT'
  | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: string;
  itemType: StockItemType;
  itemId: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  unitOfMeasure: string;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  reason?: string;
  userName?: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovementFilters {
  itemId?: string;
  itemType?: StockItemType;
  movementType?: StockMovementType;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StockAdjustmentPayload {
  itemType: StockItemType;
  itemId: string;
  adjustmentType: 'ADD' | 'SUBTRACT' | 'SET_EXACT';
  quantity: number;
  reason: string;
  notes?: string;
}

export const getStockMovements = async (filters: StockMovementFilters = {}): Promise<{ data: StockMovement[]; total: number }> => {
  const params = new URLSearchParams();
  if (filters.itemId) params.append('itemId', filters.itemId);
  if (filters.itemType) params.append('itemType', filters.itemType);
  if (filters.movementType) params.append('movementType', filters.movementType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await apiRequest<any>(`/inventory/movements${queryString}`);
  return {
    data: Array.isArray(res?.data) ? res.data : [],
    total: typeof res?.total === 'number' ? res.total : (res?.data?.length || 0),
  };
};

export const createStockAdjustment = async (payload: StockAdjustmentPayload): Promise<any> => {
  const res = await apiRequest<any>('/inventory/adjustments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || res;
};
