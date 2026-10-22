import { apiRequest } from './client';

export interface PackagingCategory {
  code: string;
  label: string;
  badgeLabel: string;
  sortOrder?: number;
}

export const DEFAULT_PACKAGING_CATEGORIES: PackagingCategory[] = [
  { code: 'DOYPACK', label: 'Bolsa Doypack con Cierre / Válvula', badgeLabel: 'Bolsa Doypack', sortOrder: 1 },
  { code: 'JAR', label: 'Frasco / Envase de Vidrio o Plástico', badgeLabel: 'Frasco Vidrio', sortOrder: 2 },
  { code: 'LABEL', label: 'Etiqueta Autoadhesiva / Térmica', badgeLabel: 'Etiqueta', sortOrder: 3 },
  { code: 'BOX', label: 'Caja de Cartón / Embalaje', badgeLabel: 'Caja Embalaje', sortOrder: 4 },
  { code: 'BAG', label: 'Bolsa de Vacío / Camiseta / Granel', badgeLabel: 'Bolsa', sortOrder: 5 },
  { code: 'OTHER', label: 'Otro Material Operativo', badgeLabel: 'Otro Insumo', sortOrder: 6 },
];

export interface PackagingMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
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
  category: string;
  unit?: string;
  currentStock: number;
  minStock?: number;
  costPerUnit: number;
  supplierName?: string;
  storageLocation?: string;
  familyId?: string;
}

const PKG_CATEGORIES_STORAGE_KEY = 'floryser_packaging_categories_v1';

const getStoredCategories = (): PackagingCategory[] => {
  try {
    const raw = localStorage.getItem(PKG_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PACKAGING_CATEGORIES;
};

const setStoredCategories = (cats: PackagingCategory[]) => {
  try {
    localStorage.setItem(PKG_CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
  } catch {}
};

export const getPackagingCategories = async (): Promise<PackagingCategory[]> => {
  try {
    const res = await apiRequest<any>('/packaging-materials/categories');
    const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : null);
    if (list && list.length > 0 && list[0]?.label) {
      setStoredCategories(list);
      return list;
    }
  } catch {}
  return getStoredCategories();
};

export const savePackagingCategory = async (payload: { code?: string; label: string; badgeLabel?: string }): Promise<PackagingCategory[]> => {
  const rawLabel = (payload.label || '').trim();
  const code = (payload.code && payload.code.trim())
    ? payload.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')
    : rawLabel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 40) || `CAT_${Date.now()}`;
  const badgeLabel = (payload.badgeLabel && payload.badgeLabel.trim())
    ? payload.badgeLabel.trim()
    : rawLabel.split('/')[0].trim().slice(0, 40);

  try {
    const res = await apiRequest<any>(payload.code ? `/packaging-materials/categories/${encodeURIComponent(code)}` : '/packaging-materials/categories', {
      method: payload.code ? 'PUT' : 'POST',
      body: JSON.stringify({ code, label: rawLabel, badgeLabel })
    });
    const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : null);
    if (list && list.length > 0 && list[0]?.label) {
      setStoredCategories(list);
      return list;
    }
  } catch {}

  const current = [...getStoredCategories()];
  const idx = current.findIndex(c => c.code === code);
  if (idx !== -1) {
    current[idx] = { ...current[idx], label: rawLabel, badgeLabel };
  } else {
    current.push({ code, label: rawLabel, badgeLabel, sortOrder: current.length + 1 });
  }
  setStoredCategories(current);
  return current;
};

export const deletePackagingCategory = async (code: string): Promise<PackagingCategory[]> => {
  const cleanCode = (code || '').trim().toUpperCase();
  try {
    const res = await apiRequest<any>(`/packaging-materials/categories/${encodeURIComponent(cleanCode)}`, {
      method: 'DELETE'
    });
    const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : null);
    if (list && list.length > 0 && list[0]?.label) {
      setStoredCategories(list);
      return list;
    }
  } catch {}

  const updated = getStoredCategories().filter(c => c.code !== cleanCode);
  setStoredCategories(updated);
  return updated;
};

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

export const deletePackagingMaterial = async (id: string): Promise<any> => {
  return await apiRequest<any>(`/packaging-materials/${id}`, {
    method: 'DELETE'
  });
};

export const togglePackagingStatus = async (id: string, isActive?: boolean): Promise<PackagingMaterial> => {
  const res = await apiRequest<any>(`/packaging-materials/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
  return res.data || res;
};
