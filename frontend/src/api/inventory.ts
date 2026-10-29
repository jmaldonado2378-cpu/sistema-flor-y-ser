import { apiRequest } from './client';

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierName: string;
  storageLocation: string;
  familyId?: string;
  familyName?: string;
  isActive?: boolean;
}

export interface CreateRawMaterialDTO {
  code: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierName: string;
  storageLocation: string;
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
  code: string;
  barcode: string;
  name: string;
  unitWeightGrams: number;
  unit?: string;
  netContentLabel: string;
  currentStock: number;
  minStock: number;
  costPrice?: number;
  price: number;
  ingredients: string;
  dietaryBadgeCodes: string[];
  defaultExpirationDays: number;
  familyId?: string;
  familyName?: string;
  isBlend?: boolean;
  isResale?: boolean;
  supplierName?: string;
  ingredientsList?: ProductIngredient[];
  isActive?: boolean;
}

export interface CreateFinalProductDTO {
  rawMaterialId?: string;
  code: string;
  barcode?: string;
  name: string;
  unitWeightGrams: number;
  unit?: string;
  netContentLabel?: string;
  currentStock: number;
  minStock?: number;
  costPrice?: number;
  price: number;
  ingredients?: string;
  dietaryBadgeCodes?: string[];
  defaultExpirationDays?: number;
  familyId?: string;
  isBlend?: boolean;
  isResale?: boolean;
  supplierName?: string;
  ingredientsList?: ProductIngredient[];
}

export const getRawMaterials = async (): Promise<RawMaterial[]> => {
  const res = await apiRequest<any>('/raw-materials');
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
};

export const createRawMaterial = async (data: CreateRawMaterialDTO): Promise<RawMaterial> => {
  const res = await apiRequest<any>('/raw-materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateRawMaterial = async (id: string, data: Partial<CreateRawMaterialDTO>): Promise<RawMaterial> => {
  const res = await apiRequest<any>(`/raw-materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateRawMaterialStock = async (id: string, newStock: number): Promise<RawMaterial> => {
  const res = await apiRequest<any>(`/raw-materials/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ newStock }),
  });
  return res.data || res;
};

export const deleteRawMaterial = async (id: string): Promise<any> => {
  return await apiRequest<any>(`/raw-materials/${id}`, {
    method: 'DELETE',
  });
};

export const toggleRawMaterialStatus = async (id: string, isActive?: boolean): Promise<RawMaterial> => {
  const res = await apiRequest<any>(`/raw-materials/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return res.data || res;
};

export const getFinalProducts = async (): Promise<FinalProduct[]> => {
  const res = await apiRequest<any>('/final-products');
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
};

export const createFinalProduct = async (data: CreateFinalProductDTO): Promise<FinalProduct> => {
  const res = await apiRequest<any>('/final-products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateFinalProduct = async (id: string, data: Partial<CreateFinalProductDTO>): Promise<FinalProduct> => {
  const res = await apiRequest<any>(`/final-products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateFinalProductStock = async (id: string, newStock: number): Promise<FinalProduct> => {
  const res = await apiRequest<any>(`/final-products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ newStock }),
  });
  return res.data || res;
};

export const deleteFinalProduct = async (id: string): Promise<any> => {
  return await apiRequest<any>(`/final-products/${id}`, {
    method: 'DELETE',
  });
};

export const toggleFinalProductStatus = async (id: string, isActive?: boolean): Promise<FinalProduct> => {
  const res = await apiRequest<any>(`/final-products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return res.data || res;
};

