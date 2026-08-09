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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackagingMaterialDTO {
  code: string;
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

export interface UpdatePackagingMaterialDTO {
  code?: string;
  name?: string;
  category?: 'DOYPACK' | 'JAR' | 'LABEL' | 'BOX' | 'BAG' | 'OTHER';
  unit?: string;
  currentStock?: number;
  minStock?: number;
  costPerUnit?: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
  isActive?: boolean;
}
