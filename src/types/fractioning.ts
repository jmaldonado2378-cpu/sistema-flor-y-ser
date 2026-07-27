export interface FractioningPreviewRequestDTO {
  rawMaterialId: string;
  finalProductId: string;
  inputQtyKg: number;
  actualOutputUnits?: number;
  rawMaterialBatch?: string;
}

export interface FractioningPreviewResponseDTO {
  rawMaterialId: string;
  rawMaterialName: string;
  rawMaterialStockKg: number;
  finalProductId: string;
  finalProductName: string;
  unitWeightGrams: number;
  inputQtyKg: number;
  targetUnits: number;
  expectedOutputKg: number;
  actualOutputUnits: number;
  wasteKg: number;
  wastePercentage: number;
  suggestedBatch: string;
  suggestedExpirationDate: string;
  hasSufficientStock: boolean;
}

export interface ExecuteFractioningDTO {
  rawMaterialId: string;
  finalProductId: string;
  inputQtyKg: number;
  actualOutputUnits: number;
  wasteReason?: string;
  rawMaterialBatch: string;
  generatedBatch?: string;
  expirationDate: string; // YYYY-MM-DD
  operatorName: string;
  notes?: string;
}

export interface FractioningOrder {
  id: string;
  orderNumber: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  finalProductId: string;
  finalProductName?: string;
  inputQtyKg: number;
  targetUnits: number;
  actualOutputUnits: number;
  wasteKg: number;
  wastePercentage: number;
  wasteReason?: string;
  rawMaterialBatch: string;
  generatedBatch: string;
  fractioningDate: string;
  expirationDate: string;
  operatorName: string;
  notes?: string;
  createdAt: string;
}
