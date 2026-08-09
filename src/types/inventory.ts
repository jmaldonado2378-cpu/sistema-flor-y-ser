export type UnitOfMeasure = 'KG' | 'L' | 'G' | 'ML';

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
  familyName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRawMaterialDTO {
  code: string;
  name: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minStock?: number;
  costPerUnit?: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
}

export interface UpdateRawMaterialDTO {
  code?: string;
  name?: string;
  unit?: UnitOfMeasure;
  currentStock?: number;
  minStock?: number;
  costPerUnit?: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
  isActive?: boolean;
}

export interface ProductIngredient {
  rawMaterialId: string;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  percentage?: number;
  gramsPerUnit?: number;
}

export interface FinalProduct {
  id: string;
  rawMaterialId?: string;
  rawMaterialName?: string;
  code: string;
  barcode: string;
  name: string;
  unitWeightGrams: number;
  netContentLabel: string;
  currentStock: number;
  minStock: number;
  price: number;
  ingredients?: string;
  dietaryBadgeCodes: string[];
  defaultExpirationDays: number;
  familyId?: string;
  familyName?: string;
  isBlend?: boolean;
  ingredientsList?: ProductIngredient[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFinalProductDTO {
  rawMaterialId?: string;
  code: string;
  barcode?: string;
  name: string;
  unitWeightGrams: number;
  netContentLabel: string;
  currentStock: number;
  minStock?: number;
  price: number;
  ingredients?: string;
  dietaryBadgeCodes?: string[];
  defaultExpirationDays?: number;
  familyId?: string;
  isBlend?: boolean;
  ingredientsList?: ProductIngredient[];
}

export interface UpdateFinalProductDTO {
  rawMaterialId?: string;
  code?: string;
  barcode?: string;
  name?: string;
  unitWeightGrams?: number;
  netContentLabel?: string;
  currentStock?: number;
  minStock?: number;
  price?: number;
  ingredients?: string;
  dietaryBadgeCodes?: string[];
  defaultExpirationDays?: number;
  familyId?: string;
  isBlend?: boolean;
  ingredientsList?: ProductIngredient[];
  isActive?: boolean;
}

export type MovementType = 
  | 'INBOUND' 
  | 'FRACTIONING_OUT' 
  | 'FRACTIONING_IN' 
  | 'WASTE' 
  | 'SALE' 
  | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  itemType: 'RAW_MATERIAL' | 'FINAL_PRODUCT';
  itemId: string;
  itemName?: string;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}
