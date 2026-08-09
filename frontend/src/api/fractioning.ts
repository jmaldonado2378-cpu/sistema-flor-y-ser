import { apiRequest } from './client';

export interface FractioningPreviewRequest {
  rawMaterialId: string;
  finalProductId: string;
  inputQtyKg: number;
  actualOutputUnits?: number;
}

export interface FractioningPreviewResponse {
  rawMaterialId?: string;
  rawMaterialName?: string;
  rawMaterialStockKg?: number;
  finalProductId?: string;
  finalProductName?: string;
  unitWeightGrams?: number;
  inputQtyKg?: number;
  targetUnits?: number;
  expectedOutputUnits: number;
  expectedOutputKg?: number;
  expectedWasteKg: number;
  wastePercentage?: number;
  suggestedBatch?: string;
  suggestedExpirationDate?: string;
  hasSufficientStock?: boolean;
}

export interface FractioningExecuteRequest {
  rawMaterialId: string;
  finalProductId: string;
  inputQtyKg: number;
  actualOutputUnits: number;
  wasteReason?: string;
  rawMaterialBatch?: string;
  generatedBatch?: string;
  expirationDate?: string;
  operatorName: string;
  notes?: string;
}

export interface FractioningHistory {
  id: string;
  orderNumber?: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  finalProductId: string;
  finalProductName?: string;
  inputQtyKg: number;
  actualOutputUnits: number;
  wasteKg?: number;
  wastePercentage?: number;
  rawMaterialBatch?: string;
  generatedBatch?: string;
  fractioningDate?: string;
  expirationDate?: string;
  date?: string;
  createdAt?: string;
  operatorName: string;
}

export const previewFractioning = async (data: FractioningPreviewRequest): Promise<FractioningPreviewResponse> => {
  const res = await apiRequest<any>('/fractioning/preview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const executeFractioning = async (data: FractioningExecuteRequest): Promise<void> => {
  const res = await apiRequest<any>('/fractioning/execute', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const getFractioningHistory = async (): Promise<FractioningHistory[]> => {
  const res = await apiRequest<any>('/fractioning/history');
  const list = Array.isArray(res) ? res : (res.data || res.orders || []);
  return list;
};
