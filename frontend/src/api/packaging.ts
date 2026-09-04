import { apiRequest } from './client';

export interface PackagingMaterial {
  id: string;
  code: string;
  name: string;
  category: 'DOYPACK' | 'JAR' | 'LABEL' | 'BOX' | 'BAG' | 'OTHER';
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
  familyName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePackagingMaterialDTO {
  code?: string;
  name: string;
  category: 'DOYPACK' | 'JAR' | 'LABEL' | 'BOX' | 'BAG' | 'OTHER';
  unit?: string;
  currentStock: number;
  minStock?: number;
  costPerUnit: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
}

export const getPackagingMaterials = async (): Promise<PackagingMaterial[]> => {
  const res = await apiRequest<any>('/packaging-materials');
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
};

export const createPackagingMaterial = async (data: CreatePackagingMaterialDTO): Promise<PackagingMaterial> => {
  const res = await apiRequest<any>('/packaging-materials', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const updatePackagingMaterial = async (id: string, data: Partial<CreatePackagingMaterialDTO>): Promise<PackagingMaterial> => {
  const res = await apiRequest<any>(`/packaging-materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const updatePackagingStock = async (id: string, newStock: number): Promise<PackagingMaterial> => {
  const res = await apiRequest<any>(`/packaging-materials/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ newStock })
  });
  return res.data || res;
};
