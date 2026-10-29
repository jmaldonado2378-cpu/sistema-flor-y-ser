import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Wand2, Package, Tag, Box, Pencil, Trash2, Layers, History, SlidersHorizontal, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Printer, Search, Filter, PauseCircle, PlayCircle, Gift, ShoppingBag, ArrowRight } from 'lucide-react';
import {
  useRawMaterials,
  useFinalProducts,
  useCreateRawMaterial,
  useUpdateRawMaterial,
  useDeleteRawMaterial,
  useToggleRawMaterialStatus,
  useCreateFinalProduct,
  useUpdateFinalProduct,
  useDeleteFinalProduct,
  useToggleFinalProductStatus,
} from '../hooks/useInventory';
import { 
  usePackagingMaterials, 
  useCreatePackagingMaterial, 
  useUpdatePackagingMaterial,
  useDeletePackagingMaterial,
  useTogglePackagingStatus,
  usePackagingCategories,
  useSavePackagingCategory,
  useDeletePackagingCategory
} from '../hooks/usePackaging';
import { DEFAULT_PACKAGING_CATEGORIES } from '../api/packaging';
import { useSuppliers } from '../hooks/useSuppliers';
import { useArticleFamilies } from '../hooks/useArticleFamilies';
import { useStockMovements, useCreateStockAdjustment } from '../hooks/useStockMovements';
import { useSettings } from '../hooks/useSettings';
import { StockItemType, StockMovementType, StockMovement } from '../api/stockMovements';
import { Modal } from '../components/ui/Modal';
import { BulkImportModal } from '../components/common/BulkImportModal';
import { PriceListGeneratorModal } from '../components/pricing/PriceListGeneratorModal';

const rawMaterialSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  unit: z.string().min(1, 'La unidad es requerida'),
  currentStock: z.number().min(0, 'Debe ser >= 0'),
  minStock: z.number().min(0, 'Debe ser >= 0'),
  costPerUnit: z.number().min(0, 'Debe ser >= 0'),
  supplierName: z.string().optional(),
  storageLocation: z.string().optional(),
  familyId: z.string().optional(),
});

const packagingSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  unit: z.string().min(1, 'Unidad requerida'),
  currentStock: z.number().min(0, 'Debe ser >= 0'),
  minStock: z.number().min(0, 'Debe ser >= 0'),
  costPerUnit: z.number().min(0, 'Debe ser >= 0'),
  supplierName: z.string().optional(),
  storageLocation: z.string().optional(),
  familyId: z.string().optional(),
});

const finalProductSchema = z.object({
  rawMaterialId: z.string().optional(),
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  unitWeightGrams: z.number().min(0, 'Debe ser >= 0'),
  unit: z.string().optional(),
  netContentLabel: z.string().optional(),
  currentStock: z.number().min(0, 'Debe ser >= 0'),
  minStock: z.number().min(0, 'Debe ser >= 0'),
  costPrice: z.number().min(0, 'Debe ser >= 0').optional(),
  price: z.number().min(0, 'Debe ser >= 0'),
  supplierName: z.string().optional(),
  ingredients: z.string().optional(),
  dietaryBadgeCodes: z.string().optional(),
  defaultExpirationDays: z.number().min(0, 'Debe ser >= 0'),
  familyId: z.string().optional(),
});

const normalizeUnitCode = (unit?: string, label?: string): string => {
  if (unit && unit.trim()) {
    const u = unit.trim().toUpperCase();
    if (u === 'G' || u === 'GR' || u === 'GRS') return 'GRS';
    if (u === 'UN' || u === 'UND') return 'UND';
    if (u === 'L' || u === 'LT' || u === 'LTS') return 'LTS';
    return u;
  }
  if (label) {
    const l = label.toLowerCase();
    if (l.includes('cm3') || l.includes('cc')) return 'CM3';
    if (l.includes('ml')) return 'ML';
    if (l.includes('lts') || l.includes('lt')) return 'LTS';
    if (l.includes('kg')) return 'KG';
    if (l.includes('und') || l.includes('un')) return 'UND';
  }
  return 'GRS';
};

const formatUnitSuffix = (unit?: string): string => {
  const u = (unit || 'GRS').trim().toUpperCase();
  switch (u) {
    case 'GRS':
    case 'GR':
    case 'G':
      return 'grs';
    case 'KG':
      return 'kg';
    case 'ML':
      return 'ml';
    case 'CM3':
      return 'cm3';
    case 'LTS':
    case 'L':
      return 'lts';
    case 'UND':
    case 'UN':
      return 'und';
    case 'ROLL':
      return 'roll';
    case 'PACK':
      return 'pack';
    default:
      return u.toLowerCase();
  }
};

export const StockPage: React.FC<{ onTabChange?: (tab: string) => void }> = () => {
  const [activeTab, setActiveTab] = useState<'raw' | 'pkg' | 'final' | 'movements'>('raw');
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'raw_materials' | 'final_products'>('raw_materials');
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);

  // Estado Ajuste de Stock Manual
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItemType, setAdjustItemType] = useState<StockItemType>('RAW_MATERIAL');
  const [adjustItemId, setAdjustItemId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT' | 'SET_EXACT'>('ADD');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<string>('CONTEO_FISICO');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Estado Filtros Kardex
  const [movementItemTypeFilter, setMovementItemTypeFilter] = useState<string>('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('');
  const [movementSearch, setMovementSearch] = useState<string>('');

  const [isBlendProduct, setIsBlendProduct] = useState(false);
  const [isResaleProduct, setIsResaleProduct] = useState(false);
  const [isPackProduct, setIsPackProduct] = useState(false);
  const [blendIngredients, setBlendIngredients] = useState<Array<{ rawMaterialId: string; percentage: number }>>([
    { rawMaterialId: '', percentage: 50 },
    { rawMaterialId: '', percentage: 50 },
  ]);

  // Estado para armador de Packs / Combos por unidades
  const [packItems, setPackItems] = useState<Array<{
    itemId: string;
    itemType: 'RAW_MATERIAL' | 'FINAL_PRODUCT' | 'PACKAGING';
    name: string;
    code: string;
    quantity: number;
    unit: string;
    unitCost: number;
    salePrice?: number;
    familyId?: string;
    familyName?: string;
  }>>([]);
  const [packFamilyFilter, setPackFamilyFilter] = useState<string>('');
  const [packSourceFilter, setPackSourceFilter] = useState<'ALL' | 'RAW_MATERIAL' | 'RESALE' | 'FINAL_PRODUCT' | 'PACKAGING'>('ALL');
  const [packMarkupPct, setPackMarkupPct] = useState<number>(50);

  // Estado para Modal "Pasar Materia Prima a Producto de Reventa" conservando Familia y Subfamilia
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteRawItem, setPromoteRawItem] = useState<any>(null);
  const [promoteName, setPromoteName] = useState('');
  const [promoteCode, setPromoteCode] = useState('');
  const [promoteFamilyId, setPromoteFamilyId] = useState('');
  const [promoteCostPrice, setPromoteCostPrice] = useState<number>(0);
  const [promoteMarkupPct, setPromoteMarkupPct] = useState<number>(50);
  const [promoteSalePrice, setPromoteSalePrice] = useState<number>(0);
  const [promoteCurrentStock, setPromoteCurrentStock] = useState<number>(0);
  const [promoteMinStock, setPromoteMinStock] = useState<number>(5);
  const [promoteSuspendOriginalRaw, setPromoteSuspendOriginalRaw] = useState<boolean>(false);

  const [editingRawItem, setEditingRawItem] = useState<any>(null);
  const [editingPkgItem, setEditingPkgItem] = useState<any>(null);
  const [editingFinalItem, setEditingFinalItem] = useState<any>(null);

  // Estado para edición de la lista "Categoría de Insumo"
  const [isEditingPkgCategories, setIsEditingPkgCategories] = useState(false);
  const [newPkgCategoryLabel, setNewPkgCategoryLabel] = useState('');
  const [editingPkgCatCode, setEditingPkgCatCode] = useState<string | null>(null);
  const [editingPkgCatLabel, setEditingPkgCatLabel] = useState('');

  const { data: rawMaterials, isLoading: loadingRaw, isError: errorRaw } = useRawMaterials();
  const { data: packagingMaterials, isLoading: loadingPkg, isError: errorPkg } = usePackagingMaterials();
  const { data: pkgCategoriesData } = usePackagingCategories();
  const savePkgCategory = useSavePackagingCategory();
  const deletePkgCategory = useDeletePackagingCategory();
  const { data: finalProducts, isLoading: loadingFinal, isError: errorFinal } = useFinalProducts();
  const { data: suppliers } = useSuppliers();
  const { data: rawFamiliesData } = useArticleFamilies();
  const { data: settingsData } = useSettings();

  const pkgCategories = Array.isArray(pkgCategoriesData) && pkgCategoriesData.length > 0
    ? pkgCategoriesData
    : DEFAULT_PACKAGING_CATEGORIES;

  const normalizePkgCategory = (cat?: string) => {
    const clean = (cat || '').trim().toUpperCase();
    if (!clean) return pkgCategories[0]?.code || 'DOYPACK';
    if (pkgCategories.some(c => c.code === clean)) return clean;
    if (clean === 'ETIQUETA' || clean === 'ETIQUETAS') return 'LABEL';
    if (clean === 'BOLSA' || clean === 'BOLSAS') return 'BAG';
    return clean;
  };

  const rawMaterialsList: any[] = Array.isArray(rawMaterials) 
    ? rawMaterials 
    : (rawMaterials && Array.isArray((rawMaterials as any).data) ? (rawMaterials as any).data : []);

  const packagingMaterialsList: any[] = Array.isArray(packagingMaterials) 
    ? packagingMaterials 
    : (packagingMaterials && Array.isArray((packagingMaterials as any).data) ? (packagingMaterials as any).data : []);

  const finalProductsList: any[] = Array.isArray(finalProducts) 
    ? finalProducts 
    : (finalProducts && Array.isArray((finalProducts as any).data) ? (finalProducts as any).data : []);

  const articleFamilies: any[] = Array.isArray(rawFamiliesData) 
    ? rawFamiliesData 
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);

  const getScope = (f: any) => f ? ((f.articleScope || f.scope || 'ALL') + '').toUpperCase() : 'ALL';

  const sortHierarchically = (list: any[]) => {
    const roots = list.filter((f: any) => !f.parentId).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const ordered: any[] = [];
    const seen = new Set<string>();
    roots.forEach((r: any) => {
      ordered.push(r);
      seen.add(r.id);
      list
        .filter((c: any) => c.parentId === r.id)
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .forEach((c: any) => {
          ordered.push({ ...c, parentName: c.parentName || r.name });
          seen.add(c.id);
        });
    });
    list.forEach((f: any) => {
      if (f && !seen.has(f.id)) ordered.push(f);
    });
    return ordered;
  };

  const rawFamilies = sortHierarchically(articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    return sc === 'RAW_MATERIAL' || sc === 'RAW' || sc === 'MATERIA PRIMA' || sc === 'ALL';
  }));

  const pkgFamilies = sortHierarchically(articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    return sc === 'PACKAGING' || sc === 'PKG' || sc === 'EMPAQUE' || sc === 'EMP' || sc === 'ALL';
  }));

  const finalFamilies = sortHierarchically(articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    // Incluir todas las familias salvo las exclusivas de empaque para que al promover materias primas se conserve siempre su familia y subfamilia
    return sc !== 'PACKAGING' && sc !== 'PKG' && sc !== 'EMPAQUE' && sc !== 'EMP';
  }));

  const matchesFamilyOrSubfamily = (itemFamId: string | undefined, selectedFilterId: string) => {
    if (!selectedFilterId) return true;
    if (!itemFamId) return false;
    if (itemFamId === selectedFilterId) return true;
    const famObj = articleFamilies.find((f: any) => f && f.id === itemFamId);
    return Boolean(famObj && famObj.parentId === selectedFilterId);
  };

  const getFamilyDisplayLabel = (item: any) => {
    const famId = item?.familyId || item?.articleFamilyId;
    const famObj = (articleFamilies || []).find((f: any) => f && f.id === famId);
    if (famObj) {
      if (famObj.parentId) {
        const parentObj = (articleFamilies || []).find((p: any) => p && p.id === famObj.parentId);
        const pName = famObj.parentName || parentObj?.name;
        return pName ? `${pName} › ${famObj.name}` : famObj.name;
      }
      return famObj.name;
    }
    return item?.familyName || 'Sin familia';
  };

  // Filtros Tab 1: Materias Primas
  const [rawSearch, setRawSearch] = useState('');
  const [rawFamilyFilter, setRawFamilyFilter] = useState('');
  const [rawSupplierFilter, setRawSupplierFilter] = useState('');
  const [rawStockFilter, setRawStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [rawStatusFilter, setRawStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Filtros Tab 2: Empaques & Etiquetas
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgCategoryFilter, setPkgCategoryFilter] = useState('');
  const [pkgSupplierFilter, setPkgSupplierFilter] = useState('');
  const [pkgFamilyFilter, setPkgFamilyFilter] = useState('');
  const [pkgStockFilter, setPkgStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [pkgStatusFilter, setPkgStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Filtros Tab 3: Productos Finales
  const [finalSearch, setFinalSearch] = useState('');
  const [finalFamilyFilter, setFinalFamilyFilter] = useState('');
  const [finalTypeFilter, setFinalTypeFilter] = useState<'ALL' | 'ELABORATED' | 'RESALE' | 'PACK'>('ALL');
  const [finalStockFilter, setFinalStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [finalStatusFilter, setFinalStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const isProductPack = (item: any): boolean => {
    if (!item) return false;
    if (item.isPack) return true;
    if (Array.isArray(item.ingredientsList) && item.ingredientsList.some((ing: any) => Boolean(ing?.isPackItem) || (ing?.quantity !== undefined && Number(ing?.quantity) > 0 && !ing?.percentage))) {
      return true;
    }
    return false;
  };

  // Listas filtradas
  const filteredRawMaterials = rawMaterialsList.filter(item => {
    if (!item) return false;
    if (rawSearch.trim()) {
      const q = rawSearch.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (rawFamilyFilter) {
      const itemFam = item.familyId || (item as any).articleFamilyId;
      if (!matchesFamilyOrSubfamily(itemFam, rawFamilyFilter)) return false;
    }
    if (rawSupplierFilter) {
      if ((item.supplierName || '') !== rawSupplierFilter) return false;
    }
    const isAct = item.isActive !== false;
    if (rawStatusFilter === 'ACTIVE' && !isAct) return false;
    if (rawStatusFilter === 'SUSPENDED' && isAct) return false;

    const current = Number(item.currentStock) || 0;
    const min = Number(item.minStock) || 0;
    if (rawStockFilter === 'LOW' && current > min) return false;
    if (rawStockFilter === 'WITH_STOCK' && current <= 0) return false;
    if (rawStockFilter === 'OUT_OF_STOCK' && current > 0) return false;
    return true;
  });

  const filteredPackagingMaterials = packagingMaterialsList.filter(item => {
    if (!item) return false;
    if (pkgSearch.trim()) {
      const q = pkgSearch.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (pkgCategoryFilter && normalizePkgCategory(item.category) !== pkgCategoryFilter) return false;
    if (pkgSupplierFilter && (item.supplierName || '') !== pkgSupplierFilter) return false;
    if (pkgFamilyFilter) {
      const itemFam = item.familyId || (item as any).articleFamilyId;
      if (!matchesFamilyOrSubfamily(itemFam, pkgFamilyFilter)) return false;
    }
    const isAct = item.isActive !== false;
    if (pkgStatusFilter === 'ACTIVE' && !isAct) return false;
    if (pkgStatusFilter === 'SUSPENDED' && isAct) return false;

    const current = Number(item.currentStock) || 0;
    const min = Number(item.minStock) || 0;
    if (pkgStockFilter === 'LOW' && current > min) return false;
    if (pkgStockFilter === 'WITH_STOCK' && current <= 0) return false;
    if (pkgStockFilter === 'OUT_OF_STOCK' && current > 0) return false;
    return true;
  });

  const filteredFinalProducts = finalProductsList.filter(item => {
    if (!item) return false;
    if (finalSearch.trim()) {
      const q = finalSearch.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBarcode) return false;
    }
    if (finalFamilyFilter) {
      const itemFam = item.familyId || (item as any).articleFamilyId;
      if (!matchesFamilyOrSubfamily(itemFam, finalFamilyFilter)) return false;
    }
    const isPack = isProductPack(item);
    const isResale = Boolean(item.isResale) && !isPack;
    if (finalTypeFilter === 'PACK' && !isPack) return false;
    if (finalTypeFilter === 'RESALE' && !isResale) return false;
    if (finalTypeFilter === 'ELABORATED' && (isResale || isPack)) return false;
    const isAct = item.isActive !== false;
    if (finalStatusFilter === 'ACTIVE' && !isAct) return false;
    if (finalStatusFilter === 'SUSPENDED' && isAct) return false;

    const current = Number(item.currentStock) || 0;
    const min = Number(item.minStock) || 0;
    if (finalStockFilter === 'LOW' && current > min) return false;
    if (finalStockFilter === 'WITH_STOCK' && current <= 0) return false;
    if (finalStockFilter === 'OUT_OF_STOCK' && current > 0) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const createRaw = useCreateRawMaterial();
  const updateRaw = useUpdateRawMaterial();
  const deleteRaw = useDeleteRawMaterial();
  const toggleRawStatus = useToggleRawMaterialStatus();

  const createPkg = useCreatePackagingMaterial();
  const updatePkg = useUpdatePackagingMaterial();
  const deletePkg = useDeletePackagingMaterial();
  const togglePkgStatus = useTogglePackagingStatus();

  const createFinal = useCreateFinalProduct();
  const updateFinal = useUpdateFinalProduct();
  const deleteFinal = useDeleteFinalProduct();
  const toggleFinalStatus = useToggleFinalProductStatus();

  // Handlers para Suspender / Reactivar y Eliminar
  const handleToggleStatusRaw = async (item: any) => {
    const isAct = item.isActive !== false;
    const actionText = isAct ? 'suspender' : 'reactivar';
    if (!confirm(`¿Desea ${actionText} la materia prima "${item.name}"?`)) return;
    try {
      await toggleRawStatus.mutateAsync({ id: item.id, isActive: !isAct });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  };

  const handleDeleteRaw = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar definitivamente "${item.name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      const res = await deleteRaw.mutateAsync(item.id);
      if (res && res.status === 'ERROR') {
        alert(res.message || 'No se pudo eliminar.');
      }
    } catch (err: any) {
      alert(err.message || 'No se puede eliminar porque está vinculado a otros registros.');
    }
  };

  const handleToggleStatusPkg = async (item: any) => {
    const isAct = item.isActive !== false;
    const actionText = isAct ? 'suspender' : 'reactivar';
    if (!confirm(`¿Desea ${actionText} el material de empaque "${item.name}"?`)) return;
    try {
      await togglePkgStatus.mutateAsync({ id: item.id, isActive: !isAct });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  };

  const handleDeletePkg = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar definitivamente "${item.name}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      const res = await deletePkg.mutateAsync(item.id);
      if (res && res.status === 'ERROR') {
        alert(res.message || 'No se pudo eliminar.');
      }
    } catch (err: any) {
      alert(err.message || 'No se puede eliminar porque está vinculado a otros registros.');
    }
  };

  const handleToggleStatusFinal = async (item: any) => {
    const isAct = item.isActive !== false;
    const actionText = isAct ? 'suspender / pausar' : 'reactivar';
    if (!confirm(`¿Desea ${actionText} el producto "${item.name}"?`)) return;
    try {
      await toggleFinalStatus.mutateAsync({ id: item.id, isActive: !isAct });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  };

  const handleDeleteFinal = async (item: any) => {
    if (!confirm(`¿Está seguro de eliminar definitivamente "${item.name}"?\nSi tiene órdenes o ventas históricas asociadas se recomienda suspenderlo.`)) return;
    try {
      const res = await deleteFinal.mutateAsync(item.id);
      if (res && res.status === 'ERROR') {
        alert(res.message || 'No se pudo eliminar.');
      }
    } catch (err: any) {
      alert(err.message || 'No se puede eliminar porque está vinculado a ventas o movimientos históricos.');
    }
  };

  const { 
    data: movementsResponse, 
    isLoading: loadingMovements, 
    isError: errorMovements, 
    refetch: refetchMovements 
  } = useStockMovements({
    itemType: (movementItemTypeFilter || undefined) as any,
    movementType: (movementTypeFilter || undefined) as any,
    search: movementSearch || undefined,
  });

  const stockMovementsList: StockMovement[] = movementsResponse?.data || [];
  const createAdjustment = useCreateStockAdjustment();

  const getSelectedAdjustItem = () => {
    if (adjustItemType === 'RAW_MATERIAL') return rawMaterialsList.find(i => i.id === adjustItemId);
    if (adjustItemType === 'PACKAGING') return packagingMaterialsList.find(i => i.id === adjustItemId);
    if (adjustItemType === 'FINAL_PRODUCT') return finalProductsList.find(i => i.id === adjustItemId);
    return null;
  };

  const selectedAdjustItem = getSelectedAdjustItem();
  const currentStockOfSelectedItem = selectedAdjustItem ? (parseFloat(selectedAdjustItem.currentStock) || 0) : 0;
  const unitOfSelectedItem = selectedAdjustItem?.unit || (adjustItemType === 'FINAL_PRODUCT' ? 'UN' : 'UN');

  const calculatePreviewStock = () => {
    if (!selectedAdjustItem) return 0;
    const qty = Number(adjustQuantity) || 0;
    if (adjustType === 'ADD') return currentStockOfSelectedItem + qty;
    if (adjustType === 'SUBTRACT') return Math.max(0, currentStockOfSelectedItem - qty);
    if (adjustType === 'SET_EXACT') return Math.max(0, qty);
    return currentStockOfSelectedItem;
  };

  const handleOpenAdjustModal = (itemType?: StockItemType, itemId?: string) => {
    const targetType = itemType || 'RAW_MATERIAL';
    setAdjustItemType(targetType);
    if (itemId) {
      setAdjustItemId(itemId);
    } else {
      if (targetType === 'FINAL_PRODUCT' && finalProductsList.length > 0) setAdjustItemId(finalProductsList[0].id);
      else if (targetType === 'PACKAGING' && packagingMaterialsList.length > 0) setAdjustItemId(packagingMaterialsList[0].id);
      else if (rawMaterialsList.length > 0) setAdjustItemId(rawMaterialsList[0].id);
      else setAdjustItemId('');
    }
    setAdjustType('ADD');
    setAdjustQuantity(1);
    setAdjustReason('CONTEO_FISICO');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId) {
      alert('Por favor seleccione un artículo para ajustar.');
      return;
    }
    if (adjustQuantity <= 0 && adjustType !== 'SET_EXACT') {
      alert('La cantidad a ajustar debe ser mayor a 0.');
      return;
    }
    createAdjustment.mutate({
      itemType: adjustItemType,
      itemId: adjustItemId,
      adjustmentType: adjustType,
      quantity: adjustQuantity,
      reason: adjustReason,
      notes: adjustNotes
    }, {
      onSuccess: () => {
        setIsAdjustModalOpen(false);
        alert('✅ Ajuste de inventario registrado y auditado correctamente en el Kardex.');
      },
      onError: (err: any) => {
        alert(`Error al registrar el ajuste: ${err.message || 'Error en el servidor'}`);
      }
    });
  };

  const rawForm = useForm({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      code: '',
      name: '',
      unit: 'KG',
      currentStock: 0,
      minStock: 5,
      costPerUnit: 0,
      supplierName: '',
      storageLocation: 'Depósito A',
    },
  });

  const pkgForm = useForm({
    resolver: zodResolver(packagingSchema),
    defaultValues: {
      code: '',
      name: '',
      category: 'DOYPACK' as const,
      unit: 'UN',
      currentStock: 0,
      minStock: 50,
      costPerUnit: 0,
      supplierName: '',
      storageLocation: 'Depósito C',
    },
  });

  const finalForm = useForm({
    resolver: zodResolver(finalProductSchema),
    defaultValues: {
      rawMaterialId: '',
      code: '',
      barcode: '',
      name: '',
      unitWeightGrams: 500,
      unit: 'GRS',
      netContentLabel: '',
      currentStock: 0,
      minStock: 10,
      costPrice: 0,
      price: 0,
      supplierName: '',
      ingredients: '',
      dietaryBadgeCodes: '',
      defaultExpirationDays: 180,
      familyId: '',
    },
  });

  // Watch Name to auto-generate SKU code if code is empty
  const watchedRawName = rawForm.watch('name');
  const watchedRawCode = rawForm.watch('code');
  const watchedPkgName = pkgForm.watch('name');
  const watchedPkgCode = pkgForm.watch('code');
  const watchedFinalName = finalForm.watch('name');
  const watchedFinalCode = finalForm.watch('code');

  const generateRawCode = (name: string) => {
    if (!name || name.trim().length === 0) return 'MP-INS-01';
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3).padEnd(3, 'X');
    const existingCount = rawMaterialsList.filter(rm => rm && typeof rm.code === 'string' && rm.code.startsWith(`MP-${prefix}`)).length + 1;
    const num = existingCount.toString().padStart(2, '0');
    return `MP-${prefix}-${num}`;
  };

  const generatePkgCode = (name: string) => {
    if (!name || name.trim().length === 0) return 'ENV-PK-01';
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3).padEnd(3, 'X');
    const existingCount = packagingMaterialsList.filter(pm => pm && typeof pm.code === 'string' && pm.code.startsWith(`ENV-${prefix}`)).length + 1;
    const num = existingCount.toString().padStart(2, '0');
    return `ENV-${prefix}-${num}`;
  };

  const generateFinalCode = (name: string) => {
    if (!name || name.trim().length === 0) return 'PF-PROD-01';
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3).padEnd(3, 'X');
    const existingCount = finalProductsList.filter(fp => fp && typeof fp.code === 'string' && fp.code.startsWith(`PF-${prefix}`)).length + 1;
    const num = existingCount.toString().padStart(2, '0');
    return `PF-${prefix}-${num}`;
  };

  const handleAutoGenerateRawCode = () => {
    rawForm.setValue('code', generateRawCode(watchedRawName), { shouldValidate: true });
  };

  const handleAutoGeneratePkgCode = () => {
    pkgForm.setValue('code', generatePkgCode(watchedPkgName), { shouldValidate: true });
  };

  const handleAutoGenerateFinalCode = () => {
    finalForm.setValue('code', generateFinalCode(watchedFinalName), { shouldValidate: true });
  };

  useEffect(() => {
    if (watchedRawName && (!watchedRawCode || watchedRawCode === '')) {
      rawForm.setValue('code', generateRawCode(watchedRawName), { shouldValidate: true });
    }
  }, [watchedRawName]);

  useEffect(() => {
    if (watchedPkgName && (!watchedPkgCode || watchedPkgCode === '')) {
      pkgForm.setValue('code', generatePkgCode(watchedPkgName), { shouldValidate: true });
    }
  }, [watchedPkgName]);

  useEffect(() => {
    if (watchedFinalName && (!watchedFinalCode || watchedFinalCode === '')) {
      finalForm.setValue('code', generateFinalCode(watchedFinalName), { shouldValidate: true });
    }
  }, [watchedFinalName]);

  const openEditRaw = (item: any) => {
    setEditingRawItem(item);
    rawForm.reset({
      code: item.code,
      name: item.name,
      unit: normalizeUnitCode(item.unit),
      currentStock: item.currentStock,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
      supplierName: item.supplierName || '',
      storageLocation: item.storageLocation || 'Depósito A',
      familyId: item.familyId || item.articleFamilyId || '',
    });
    setIsRawModalOpen(true);
  };

  const openEditPkg = (item: any) => {
    setEditingPkgItem(item);
    pkgForm.reset({
      code: item.code,
      name: item.name,
      category: normalizePkgCategory(item.category),
      unit: normalizeUnitCode(item.unit || 'UND'),
      currentStock: item.currentStock,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
      supplierName: item.supplierName || '',
      storageLocation: item.storageLocation || 'Depósito C',
      familyId: item.familyId || item.articleFamilyId || '',
    });
    setIsPkgModalOpen(true);
  };

  // Catálogo unificado de ítems elegibles para integrar un Pack / Combo (con Familia/Subfamilia)
  const allPackCandidateItems = [
    ...finalProductsList.filter(fp => fp && !isProductPack(fp)).map(fp => ({
      id: fp.id,
      itemType: 'FINAL_PRODUCT' as const,
      isResale: Boolean(fp.isResale),
      name: fp.name,
      code: fp.code || '',
      unit: fp.unit || 'UND',
      unitCost: Number(fp.costPrice) || (fp.rawMaterialId ? Number(rawMaterialsList.find(r => r.id === fp.rawMaterialId)?.costPerUnit || 0) : Math.round((Number(fp.price) || 0) * 0.5)),
      salePrice: Number(fp.price) || 0,
      currentStock: Number(fp.currentStock) || 0,
      familyId: fp.familyId || (fp as any).articleFamilyId || '',
      familyName: getFamilyDisplayLabel(fp),
    })),
    ...rawMaterialsList.filter(Boolean).map(rm => ({
      id: rm.id,
      itemType: 'RAW_MATERIAL' as const,
      isResale: false,
      name: rm.name,
      code: rm.code || '',
      unit: rm.unit || 'UND',
      unitCost: Number(rm.costPerUnit) || 0,
      salePrice: 0,
      currentStock: Number(rm.currentStock) || 0,
      familyId: rm.familyId || (rm as any).articleFamilyId || '',
      familyName: getFamilyDisplayLabel(rm),
    })),
    ...packagingMaterialsList.filter(Boolean).map(pm => ({
      id: pm.id,
      itemType: 'PACKAGING' as const,
      isResale: false,
      name: pm.name,
      code: pm.code || '',
      unit: pm.unit || 'UND',
      unitCost: Number(pm.costPerUnit) || 0,
      salePrice: 0,
      currentStock: Number(pm.currentStock) || 0,
      familyId: pm.familyId || (pm as any).articleFamilyId || '',
      familyName: getFamilyDisplayLabel(pm),
    }))
  ];

  const filteredPackCandidates = allPackCandidateItems.filter(cand => {
    if (packFamilyFilter && !matchesFamilyOrSubfamily(cand.familyId, packFamilyFilter)) return false;
    if (packSourceFilter === 'RAW_MATERIAL' && cand.itemType !== 'RAW_MATERIAL') return false;
    if (packSourceFilter === 'RESALE' && !(cand.itemType === 'FINAL_PRODUCT' && cand.isResale)) return false;
    if (packSourceFilter === 'FINAL_PRODUCT' && cand.itemType !== 'FINAL_PRODUCT') return false;
    if (packSourceFilter === 'PACKAGING' && cand.itemType !== 'PACKAGING') return false;
    return true;
  });

  const totalPackCost = packItems.reduce((acc, curr) => acc + ((Number(curr.quantity) || 0) * (Number(curr.unitCost) || 0)), 0);
  const totalPackIndividualSalePrices = packItems.reduce((acc, curr) => acc + ((Number(curr.quantity) || 0) * (Number(curr.salePrice) || 0)), 0);

  const openPromoteRawToResale = (rawItem: any) => {
    setPromoteRawItem(rawItem);
    const defaultCost = Number(rawItem.costPerUnit) || 0;
    const defaultMarkup = 50;
    const suggestedSale = Math.round(defaultCost * (1 + defaultMarkup / 100));
    setPromoteName(rawItem.name || '');
    setPromoteCode(generateFinalCode(rawItem.name || ''));
    setPromoteFamilyId(rawItem.familyId || rawItem.articleFamilyId || '');
    setPromoteCostPrice(defaultCost);
    setPromoteMarkupPct(defaultMarkup);
    setPromoteSalePrice(suggestedSale);
    setPromoteCurrentStock(Number(rawItem.currentStock) || 0);
    setPromoteMinStock(Number(rawItem.minStock) || 5);
    setPromoteSuspendOriginalRaw(false);
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromoteToResale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteRawItem) return;

    const payload = {
      rawMaterialId: promoteRawItem.id,
      code: promoteCode.trim() ? promoteCode.trim().toUpperCase() : generateFinalCode(promoteName),
      name: promoteName.trim() || promoteRawItem.name,
      unitWeightGrams: 1,
      unit: 'UND',
      netContentLabel: '1 und',
      currentStock: Number(promoteCurrentStock) || 0,
      minStock: Number(promoteMinStock) || 5,
      costPrice: Number(promoteCostPrice) || 0,
      price: Number(promoteSalePrice) || 0,
      supplierName: promoteRawItem.supplierName || undefined,
      familyId: promoteFamilyId || undefined,
      isBlend: false,
      isResale: true,
      isPack: false,
      ingredientsList: [],
      ingredients: `Producto de reventa (${getFamilyDisplayLabel({ familyId: promoteFamilyId })})`,
      defaultExpirationDays: 180,
      dietaryBadgeCodes: []
    };

    try {
      await createFinal.mutateAsync(payload as any);
      if (promoteSuspendOriginalRaw) {
        await toggleRawStatus.mutateAsync({ id: promoteRawItem.id, isActive: false });
      }
      setIsPromoteModalOpen(false);
      setPromoteRawItem(null);
      setActiveTab('final');
    } catch (err: any) {
      alert(err.message || 'Error al pasar a Producto de Reventa.');
    }
  };

  const openEditFinal = (item: any) => {
    setEditingFinalItem(item);
    const isPack = isProductPack(item);
    const isResale = !isPack && Boolean(item.isResale);
    const isBlend = !isPack && !isResale && Boolean(item.isBlend);

    setIsPackProduct(isPack);
    setIsResaleProduct(isResale);
    setIsBlendProduct(isBlend);

    if (isPack && Array.isArray(item.ingredientsList) && item.ingredientsList.length > 0) {
      const mappedPack = item.ingredientsList.map((ing: any) => {
        const matchedCand = allPackCandidateItems.find(c => c.id === ing.rawMaterialId);
        return {
          itemId: ing.rawMaterialId || '',
          itemType: ing.itemType || matchedCand?.itemType || 'RAW_MATERIAL',
          name: ing.rawMaterialName || matchedCand?.name || '',
          code: ing.rawMaterialCode || matchedCand?.code || '',
          quantity: Number(ing.quantity) || 1,
          unit: ing.unit || matchedCand?.unit || 'UND',
          unitCost: Number(ing.unitCost) !== undefined && Number(ing.unitCost) > 0 ? Number(ing.unitCost) : (matchedCand?.unitCost || 0),
          salePrice: matchedCand?.salePrice || 0,
          familyId: ing.familyId || matchedCand?.familyId || '',
          familyName: ing.familyName || matchedCand?.familyName || '',
        };
      });
      setPackItems(mappedPack);
      const packCostSum = mappedPack.reduce((s: number, i: any) => s + (i.quantity * i.unitCost), 0);
      const curPrice = Number(item.price) || 0;
      if (packCostSum > 0 && curPrice > 0) {
        setPackMarkupPct(Number((((curPrice - packCostSum) / packCostSum) * 100).toFixed(1)));
      } else {
        setPackMarkupPct(50);
      }
    } else {
      setPackItems([
        { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 }
      ]);
      setPackMarkupPct(50);
    }

    if (!isPack && Array.isArray(item.ingredientsList) && item.ingredientsList.length > 0) {
      setBlendIngredients(item.ingredientsList.map((ing: any) => ({
        rawMaterialId: ing.rawMaterialId,
        percentage: ing.percentage || 0
      })));
    } else {
      setBlendIngredients([
        { rawMaterialId: item.rawMaterialId || '', percentage: 100 }
      ]);
    }

    const resolvedUnit = normalizeUnitCode(item.unit, item.netContentLabel);

    finalForm.reset({
      rawMaterialId: item.rawMaterialId || '',
      code: item.code,
      barcode: item.barcode || '',
      name: item.name,
      unitWeightGrams: item.unitWeightGrams ?? 1,
      unit: resolvedUnit,
      netContentLabel: item.netContentLabel || '',
      currentStock: item.currentStock,
      minStock: item.minStock,
      costPrice: item.costPrice || 0,
      price: item.price,
      supplierName: item.supplierName || '',
      ingredients: item.ingredients || '',
      dietaryBadgeCodes: Array.isArray(item.dietaryBadgeCodes) ? item.dietaryBadgeCodes.join(', ') : '',
      defaultExpirationDays: item.defaultExpirationDays || 180,
      familyId: item.familyId || item.articleFamilyId || '',
    });
    setIsFinalModalOpen(true);
  };

  const onRawSubmit = (data: any) => {
    const finalData = {
      ...data,
      code: data.code && data.code.trim() ? data.code.trim().toUpperCase() : generateRawCode(data.name)
    };
    if (editingRawItem) {
      updateRaw.mutate({ id: editingRawItem.id, data: finalData }, {
        onSuccess: () => {
          setIsRawModalOpen(false);
          setEditingRawItem(null);
          rawForm.reset();
        }
      });
    } else {
      createRaw.mutate(finalData, {
        onSuccess: () => {
          setIsRawModalOpen(false);
          rawForm.reset();
          setIsCustomSupplier(false);
        },
      });
    }
  };

  const onPkgSubmit = (data: any) => {
    const finalData = {
      ...data,
      code: data.code && data.code.trim() ? data.code.trim().toUpperCase() : generatePkgCode(data.name)
    };
    if (editingPkgItem) {
      updatePkg.mutate({ id: editingPkgItem.id, data: finalData }, {
        onSuccess: () => {
          setIsPkgModalOpen(false);
          setEditingPkgItem(null);
          pkgForm.reset();
        }
      });
    } else {
      createPkg.mutate(finalData, {
        onSuccess: () => {
          setIsPkgModalOpen(false);
          pkgForm.reset();
          setIsCustomSupplier(false);
        },
      });
    }
  };

  const onFinalSubmit = (data: any) => {
    const finalCode = data.code && data.code.trim() ? data.code.trim().toUpperCase() : generateFinalCode(data.name);

    const badgeCodesArray = data.dietaryBadgeCodes 
      ? (typeof data.dietaryBadgeCodes === 'string' 
          ? data.dietaryBadgeCodes.split(',').map((s: string) => s.trim()).filter(Boolean)
          : data.dietaryBadgeCodes)
      : [];

    const formattedIngredientsList = isPackProduct
      ? packItems.filter(p => p && p.itemId).map(p => ({
          rawMaterialId: p.itemId,
          rawMaterialName: p.name,
          rawMaterialCode: p.code,
          itemType: p.itemType,
          quantity: Number(p.quantity) || 1,
          unit: p.unit || 'UND',
          unitCost: Number(p.unitCost) || 0,
          familyId: p.familyId,
          familyName: p.familyName,
          isPackItem: true
        }))
      : (!isResaleProduct && isBlendProduct)
      ? blendIngredients.filter(ing => ing && ing.rawMaterialId).map(ing => {
          const rm = rawMaterialsList.find(r => r && r.id === ing.rawMaterialId);
          return {
            rawMaterialId: ing.rawMaterialId,
            rawMaterialName: rm ? rm.name : '',
            rawMaterialCode: rm ? rm.code : '',
            percentage: ing.percentage
          };
        })
      : [];

    const autoIngredientsText = isPackProduct
      ? formattedIngredientsList.map((ing: any) => `${ing.quantity}x ${ing.rawMaterialName}`).join(' + ')
      : (!isResaleProduct && isBlendProduct)
      ? formattedIngredientsList.map((ing: any) => `${ing.rawMaterialName} (${ing.percentage}%)`).join(', ')
      : data.ingredients;

    const resolvedUnit = isPackProduct ? 'UND' : normalizeUnitCode(data.unit, data.netContentLabel);
    const weightVal = isPackProduct ? 1 : (Number(data.unitWeightGrams) || 1);
    const syncedNetContentLabel = `${weightVal} ${formatUnitSuffix(resolvedUnit)}`;
    const resolvedCostPrice = isPackProduct
      ? totalPackCost
      : (Number(data.costPrice) || 0);

    const payload = { 
      ...data,
      rawMaterialId: (isResaleProduct || isPackProduct) ? (data.rawMaterialId || undefined) : data.rawMaterialId,
      code: finalCode,
      unitWeightGrams: weightVal,
      unit: resolvedUnit,
      netContentLabel: syncedNetContentLabel,
      costPrice: resolvedCostPrice,
      supplierName: data.supplierName || undefined,
      dietaryBadgeCodes: badgeCodesArray, 
      barcode: data.barcode || finalCode,
      isBlend: (isResaleProduct || isPackProduct) ? false : isBlendProduct,
      isResale: isPackProduct ? false : isResaleProduct,
      isPack: isPackProduct,
      ingredientsList: formattedIngredientsList,
      ingredients: autoIngredientsText || data.ingredients
    };

    if (editingFinalItem) {
      updateFinal.mutate({ id: editingFinalItem.id, data: payload }, {
        onSuccess: () => {
          setIsFinalModalOpen(false);
          setEditingFinalItem(null);
          finalForm.reset();
        }
      });
    } else {
      createFinal.mutate(payload, {
        onSuccess: () => {
          setIsFinalModalOpen(false);
          finalForm.reset();
        },
      });
    }
  };

  const masterSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const defaultSupplierNames = [
    'Empaques EcoSur S.A.',
    'Envases Cristalería Argentina',
    'Impresiones Gráficas del Centro',
    'Cartonera Nacional',
    'Granos & Semillas del Campo S.A.',
    'Molinos Agroecológicos del Sur',
    'NutriVida Alimentos Elaborados S.R.L.',
    'Frutos del Valle S.A.'
  ];

  const allSupplierNames = Array.from(new Set([
    ...masterSuppliers.map(s => s?.name || s?.businessName).filter(Boolean),
    ...defaultSupplierNames,
    ...rawMaterialsList.map(rm => rm?.supplierName).filter(Boolean),
    ...packagingMaterialsList.map(pm => pm?.supplierName).filter(Boolean)
  ]));

  const getCategoryBadgeLabel = (cat: string) => {
    const norm = normalizePkgCategory(cat);
    const found = pkgCategories.find(c => c.code === norm);
    if (found) return found.badgeLabel || found.label;
    switch (norm) {
      case 'DOYPACK': return 'Bolsa Doypack';
      case 'JAR': return 'Frasco Vidrio';
      case 'LABEL': return 'Etiqueta';
      case 'BOX': return 'Caja Embalaje';
      case 'BAG': return 'Bolsa';
      default: return cat || 'Envase / Etiqueta';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Stock y Catálogo de Productos</h1>
          <p className="text-sm text-text-muted mt-1">Gestión de insumos a granel, envases/etiquetas y productos elaborados</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn ${activeTab === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('raw')}
          >
            Materias Primas (Granel)
          </button>
          <button
            className={`btn ${activeTab === 'pkg' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('pkg')}
          >
            Empaques & Etiquetas
          </button>
          <button
            className={`btn ${activeTab === 'final' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('final')}
          >
            Productos Finales
          </button>
          <button
            className={`btn ${activeTab === 'movements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('movements')}
          >
            📊 Movimientos / Kardex
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {activeTab === 'raw' 
              ? 'Listado de Materias Primas' 
              : activeTab === 'pkg' 
              ? 'Listado de Materiales de Empaque & Etiquetas' 
              : activeTab === 'final'
              ? 'Listado de Productos Finales'
              : 'Kardex Centralizado & Trazabilidad de Stock'}
          </h2>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary flex items-center gap-1.5"
              style={{ borderColor: '#2E5339', color: '#2E5339', backgroundColor: '#E9EFEA', fontWeight: 600 }}
              onClick={() => setIsPriceListModalOpen(true)}
              title="Generar catálogo y lista de precios editable con logo profesional"
            >
              📋 Lista de Precios PDF
            </button>
            <button
              className="btn btn-secondary flex items-center gap-1.5"
              style={{ borderColor: '#D97706', color: '#B45309', backgroundColor: '#FFFBEB', fontWeight: 600 }}
              onClick={() => {
                setEditingFinalItem(null);
                setIsResaleProduct(false);
                setIsBlendProduct(false);
                setIsPackProduct(true);
                setPackFamilyFilter('');
                setPackSourceFilter('ALL');
                setPackMarkupPct(50);
                setPackItems([
                  { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 },
                  { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 }
                ]);
                finalForm.reset({
                  rawMaterialId: '',
                  code: '',
                  barcode: '',
                  name: '',
                  unitWeightGrams: 1,
                  unit: 'UND',
                  netContentLabel: '1 und',
                  currentStock: 0,
                  minStock: 5,
                  costPrice: 0,
                  price: 0,
                  supplierName: '',
                  ingredients: '',
                  dietaryBadgeCodes: '',
                  defaultExpirationDays: 180,
                  familyId: '',
                });
                setIsFinalModalOpen(true);
              }}
              title="Armar un Pack o Combo combinando productos de reventa, materias primas o elaborados"
            >
              <Gift size={16} /> 🎁 Armar Pack / Combo
            </button>
            <button
              className="btn btn-secondary flex items-center gap-2"
              style={{ borderColor: '#8B5CF6', color: '#6D28D9', backgroundColor: '#F5F3FF', fontWeight: 600 }}
              onClick={() => handleOpenAdjustModal()}
            >
              ⚖️ Ajustar Stock Manual
            </button>
            {(activeTab === 'raw' || activeTab === 'final') && (
              <button
                className="btn btn-secondary flex items-center gap-2"
                onClick={() => {
                  setBulkImportType(activeTab === 'raw' ? 'raw_materials' : 'final_products');
                  setIsBulkImportOpen(true);
                }}
              >
                📊 Carga Masiva Google Sheets / Excel
              </button>
            )}
            {activeTab !== 'movements' && (
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={() => {
                  if (activeTab === 'raw') {
                    setEditingRawItem(null);
                    rawForm.reset({
                      code: '',
                      name: '',
                      unit: 'KG',
                      currentStock: 0,
                      minStock: 5,
                      costPerUnit: 0,
                      supplierName: allSupplierNames[0] || '',
                      storageLocation: 'Depósito A',
                      familyId: '',
                    });
                    setIsCustomSupplier(false);
                    setIsRawModalOpen(true);
                  } else if (activeTab === 'pkg') {
                    setEditingPkgItem(null);
                    pkgForm.reset({
                      code: '',
                      name: '',
                      category: 'DOYPACK',
                      unit: 'UN',
                      currentStock: 0,
                      minStock: 50,
                      costPerUnit: 0,
                      supplierName: allSupplierNames[0] || '',
                      storageLocation: 'Depósito C',
                      familyId: '',
                    });
                    setIsCustomSupplier(false);
                    setIsPkgModalOpen(true);
                  } else {
                    setEditingFinalItem(null);
                    setIsResaleProduct(false);
                    setIsBlendProduct(false);
                    setIsPackProduct(false);
                    setBlendIngredients([
                      { rawMaterialId: rawMaterialsList.length > 0 ? rawMaterialsList[0]?.id || '' : '', percentage: 50 },
                      { rawMaterialId: rawMaterialsList.length > 1 ? rawMaterialsList[1]?.id || '' : '', percentage: 50 },
                    ]);
                    setPackItems([
                      { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 }
                    ]);
                    finalForm.reset({
                      rawMaterialId: rawMaterialsList.length > 0 ? rawMaterialsList[0]?.id || '' : '',
                      code: '',
                      barcode: '',
                      name: '',
                      unitWeightGrams: 500,
                      unit: 'GRS',
                      netContentLabel: '500 grs',
                      currentStock: 0,
                      minStock: 10,
                      costPrice: 0,
                      price: 0,
                      supplierName: allSupplierNames[0] || '',
                      ingredients: '',
                      dietaryBadgeCodes: '',
                      defaultExpirationDays: 180,
                      familyId: '',
                    });
                    setIsFinalModalOpen(true);
                  }
                }}
              >
                <Plus size={16} />
                {activeTab === 'raw' 
                  ? 'Nueva Materia Prima' 
                  : activeTab === 'pkg' 
                  ? 'Nuevo Material de Empaque / Etiqueta' 
                  : 'Nuevo Producto Final'}
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Materias Primas */}
        {activeTab === 'raw' && (
          <div>
            {/* Print Header */}
            <div className="print-only mb-4 border-b-2 pb-3" style={{ borderColor: '#2E5339' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2E5339', margin: 0, fontFamily: 'serif' }}>Flor y Ser</h1>
                  <p style={{ fontSize: '10pt', color: '#4B5563', margin: '2px 0 0 0' }}>Almacén Natural • Reporte de Inventario de Materias Primas (Granel)</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6B7280' }}>
                  <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Ítems listados:</strong> {filteredRawMaterials.length}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar (no-print) */}
            <div className="no-print bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div style={{ minWidth: '220px' }} className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Buscar Materia Prima</label>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o código..." 
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>

                <div style={{ minWidth: '170px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Familia</label>
                  <select 
                    value={rawFamilyFilter} 
                    onChange={(e) => setRawFamilyFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todas las familias</option>
                    {rawFamilies.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.parentId ? `— ${f.name} (${f.parentName || 'Sub'})` : f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '170px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Proveedor</label>
                  <select 
                    value={rawSupplierFilter} 
                    onChange={(e) => setRawSupplierFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todos los proveedores</option>
                    {allSupplierNames.map((sName) => (
                      <option key={sName} value={sName}>{sName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '160px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado de Stock</label>
                  <select 
                    value={rawStockFilter} 
                    onChange={(e) => setRawStockFilter(e.target.value as any)}
                    className="w-full text-sm"
                  >
                    <option value="ALL">Todos los niveles</option>
                    <option value="LOW">⚠️ Stock Bajo / Crítico</option>
                    <option value="WITH_STOCK">✅ Con Stock Disponible</option>
                    <option value="OUT_OF_STOCK">❌ Sin Stock (0)</option>
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado Artículo</label>
                  <select 
                    value={rawStatusFilter} 
                    onChange={(e) => setRawStatusFilter(e.target.value as any)}
                    className="w-full text-sm font-medium"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">✅ Solo Activos</option>
                    <option value="SUSPENDED">⏸️ Solo Suspendidos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(rawSearch || rawFamilyFilter || rawSupplierFilter || rawStockFilter !== 'ALL' || rawStatusFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setRawSearch('');
                      setRawFamilyFilter('');
                      setRawSupplierFilter('');
                      setRawStockFilter('ALL');
                      setRawStatusFilter('ALL');
                    }}
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={handlePrint}
                  title="Imprimir o guardar listado como PDF"
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Metrics summary banner */}
            <div className="no-print flex justify-between items-center text-xs text-text-muted mb-3 px-1">
              <div>
                Mostrando <strong className="text-text-dark">{filteredRawMaterials.length}</strong> de {rawMaterialsList.length} materias primas
              </div>
              <div className="flex items-center gap-4">
                <div>
                  Suspendidas: <strong className="text-amber-600">{rawMaterialsList.filter(i => i.isActive === false).length}</strong>
                </div>
                <div>
                  Stock Bajo / Alerta: <strong className="text-terracotta">{filteredRawMaterials.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
                </div>
              </div>
            </div>

            {loadingRaw && <div className="py-8 text-center text-text-muted">Cargando materias primas...</div>}
            {errorRaw && <div className="py-8 text-center text-terracotta">Error al cargar materias primas</div>}
            {!loadingRaw && !errorRaw && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre Materia Prima</th>
                      <th>Familia / Categoría</th>
                      <th>Stock Actual</th>
                      <th>Costo / Unidad</th>
                      <th>Proveedor Maestro</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRawMaterials.map((item) => {
                      if (!item) return null;
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = getFamilyDisplayLabel(item);
                      const isAct = item.isActive !== false;

                      return (
                        <tr key={item.id} className={!isAct ? 'opacity-60 bg-amber-50/20' : ''}>
                          <td className="font-semibold text-primary-sage">{item.code}</td>
                          <td className="font-medium">{item.name}</td>
                          <td><span className="badge gray">{familyName}</span></td>
                          <td>
                            <span className={currentStock <= minStock ? 'text-terracotta font-bold' : ''}>
                              {currentStock} {item.unit || 'UN'}
                            </span>
                          </td>
                          <td>{(item.costPerUnit || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                          <td><span className="badge gray">{item.supplierName || 'Sin asignar'}</span></td>
                          <td className="text-sm text-text-muted">{item.storageLocation || 'Depósito Principal'}</td>
                          <td>
                            {isAct ? (
                              <span className="badge green text-[10px]">Activo</span>
                            ) : (
                              <span className="badge amber text-[10px]">Suspendido</span>
                            )}
                          </td>
                          <td className="no-print" style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openPromoteRawToResale(item)}
                                title="Pasar a Producto Final de Reventa conservando su Familia y Subfamilia"
                                className="text-xs font-semibold px-2 py-1 rounded border flex items-center gap-1 hover:bg-blue-50 transition"
                                style={{
                                  borderColor: '#3B82F6',
                                  color: '#1D4ED8',
                                  backgroundColor: '#EFF6FF',
                                  height: '32px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <ShoppingBag size={13} /> Pasar a Reventa
                              </button>
                              <button 
                                type="button"
                                onClick={() => openEditRaw(item)}
                                title="Editar materia prima"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Pencil size={15} style={{ color: '#2563EB', strokeWidth: 2.2 }} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleToggleStatusRaw(item)}
                                title={isAct ? "Suspender / Pausar materia prima" : "Reactivar materia prima"}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: isAct ? '#FFFFFF' : '#FEF3C7',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                {isAct ? (
                                  <PauseCircle size={15} style={{ color: '#D97706', strokeWidth: 2.2 }} />
                                ) : (
                                  <PlayCircle size={15} style={{ color: '#10B981', strokeWidth: 2.2 }} />
                                )}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteRaw(item)}
                                title="Eliminar materia prima"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Trash2 size={15} style={{ color: '#DC2626', strokeWidth: 2.2 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRawMaterials.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-text-muted">
                          No se encontraron materias primas para los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Empaques & Etiquetas */}
        {activeTab === 'pkg' && (
          <div>
            {/* Print Header */}
            <div className="print-only mb-4 border-b-2 pb-3" style={{ borderColor: '#2E5339' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2E5339', margin: 0, fontFamily: 'serif' }}>Flor y Ser</h1>
                  <p style={{ fontSize: '10pt', color: '#4B5563', margin: '2px 0 0 0' }}>Almacén Natural • Reporte de Inventario de Materiales de Empaque y Etiquetas</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6B7280' }}>
                  <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Ítems listados:</strong> {filteredPackagingMaterials.length}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar (no-print) */}
            <div className="no-print bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div style={{ minWidth: '220px' }} className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Buscar Empaque / Envase</label>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o código..." 
                    value={pkgSearch}
                    onChange={(e) => setPkgSearch(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>

                <div style={{ minWidth: '170px' }}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-text-muted">Categoría</label>
                    <button
                      type="button"
                      className="text-xs text-primary-sage font-semibold hover:underline cursor-pointer"
                      onClick={() => {
                        setIsEditingPkgCategories(true);
                        setIsPkgModalOpen(true);
                      }}
                      title="Editar la lista de Categorías de Insumo"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                  <select 
                    value={pkgCategoryFilter} 
                    onChange={(e) => setPkgCategoryFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todas las categorías</option>
                    {pkgCategories.map(cat => (
                      <option key={cat.code} value={cat.code}>
                        {cat.badgeLabel || cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Familia</label>
                  <select 
                    value={pkgFamilyFilter} 
                    onChange={(e) => setPkgFamilyFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todas las familias</option>
                    {pkgFamilies.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.parentId ? `— ${f.name} (${f.parentName || 'Sub'})` : f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Proveedor</label>
                  <select 
                    value={pkgSupplierFilter} 
                    onChange={(e) => setPkgSupplierFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todos los proveedores</option>
                    {allSupplierNames.map((sName) => (
                      <option key={sName} value={sName}>{sName}</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado de Stock</label>
                  <select 
                    value={pkgStockFilter} 
                    onChange={(e) => setPkgStockFilter(e.target.value as any)}
                    className="w-full text-sm"
                  >
                    <option value="ALL">Todos los niveles</option>
                    <option value="LOW">⚠️ Stock Bajo / Crítico</option>
                    <option value="WITH_STOCK">✅ Con Stock Disponible</option>
                    <option value="OUT_OF_STOCK">❌ Sin Stock (0)</option>
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado Artículo</label>
                  <select 
                    value={pkgStatusFilter} 
                    onChange={(e) => setPkgStatusFilter(e.target.value as any)}
                    className="w-full text-sm font-medium"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">✅ Solo Activos</option>
                    <option value="SUSPENDED">⏸️ Solo Suspendidos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(pkgSearch || pkgCategoryFilter || pkgFamilyFilter || pkgSupplierFilter || pkgStockFilter !== 'ALL' || pkgStatusFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setPkgSearch('');
                      setPkgCategoryFilter('');
                      setPkgFamilyFilter('');
                      setPkgSupplierFilter('');
                      setPkgStockFilter('ALL');
                      setPkgStatusFilter('ALL');
                    }}
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={handlePrint}
                  title="Imprimir o guardar listado como PDF"
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Metrics summary banner */}
            <div className="no-print flex justify-between items-center text-xs text-text-muted mb-3 px-1">
              <div>
                Mostrando <strong className="text-text-dark">{filteredPackagingMaterials.length}</strong> de {packagingMaterialsList.length} empaques y etiquetas
              </div>
              <div className="flex items-center gap-4">
                <div>
                  Suspendidos: <strong className="text-amber-600">{packagingMaterialsList.filter(i => i.isActive === false).length}</strong>
                </div>
                <div>
                  Stock Bajo / Alerta: <strong className="text-terracotta">{filteredPackagingMaterials.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
                </div>
              </div>
            </div>

            {loadingPkg && <div className="py-8 text-center text-text-muted">Cargando materiales de empaque y etiquetas...</div>}
            {errorPkg && <div className="py-8 text-center text-terracotta">Error al cargar materiales de empaque</div>}
            {!loadingPkg && !errorPkg && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre Material / Envase</th>
                      <th>Categoría</th>
                      <th>Familia Artículos</th>
                      <th>Stock Actual</th>
                      <th>Costo / Unidad</th>
                      <th>Proveedor</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackagingMaterials.map((item) => {
                      if (!item) return null;
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = getFamilyDisplayLabel(item);
                      const isAct = item.isActive !== false;

                      return (
                        <tr key={item.id} className={!isAct ? 'opacity-60 bg-amber-50/20' : ''}>
                          <td className="font-semibold text-primary-sage">{item.code}</td>
                          <td className="font-medium">{item.name}</td>
                          <td>
                            <span className="badge gray text-xs">{getCategoryBadgeLabel(item.category)}</span>
                          </td>
                          <td><span className="badge gray">{familyName}</span></td>
                          <td>
                            <span className={currentStock <= minStock ? 'text-terracotta font-bold' : ''}>
                              {currentStock} {item.unit || 'UN'}
                            </span>
                          </td>
                          <td className="font-semibold text-text-dark">
                            {(item.costPerUnit || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                          </td>
                          <td><span className="badge gray">{item.supplierName || 'Sin asignar'}</span></td>
                          <td className="text-sm text-text-muted">{item.storageLocation || 'Depósito C'}</td>
                          <td>
                            {isAct ? (
                              <span className="badge green text-[10px]">Activo</span>
                            ) : (
                              <span className="badge amber text-[10px]">Suspendido</span>
                            )}
                          </td>
                          <td className="no-print" style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                type="button"
                                onClick={() => openEditPkg(item)}
                                title="Editar empaque"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Pencil size={15} style={{ color: '#2563EB', strokeWidth: 2.2 }} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleToggleStatusPkg(item)}
                                title={isAct ? "Suspender / Pausar empaque" : "Reactivar empaque"}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: isAct ? '#FFFFFF' : '#FEF3C7',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                {isAct ? (
                                  <PauseCircle size={15} style={{ color: '#D97706', strokeWidth: 2.2 }} />
                                ) : (
                                  <PlayCircle size={15} style={{ color: '#10B981', strokeWidth: 2.2 }} />
                                )}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeletePkg(item)}
                                title="Eliminar empaque"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Trash2 size={15} style={{ color: '#DC2626', strokeWidth: 2.2 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPackagingMaterials.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-text-muted">
                          No se encontraron materiales de empaque para los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Productos Finales */}
        {activeTab === 'final' && (
          <div>
            {/* Print Header */}
            <div className="print-only mb-4 border-b-2 pb-3" style={{ borderColor: '#2E5339' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2E5339', margin: 0, fontFamily: 'serif' }}>Flor y Ser</h1>
                  <p style={{ fontSize: '10pt', color: '#4B5563', margin: '2px 0 0 0' }}>Almacén Natural • Catálogo y Stock de Productos Elaborados</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6B7280' }}>
                  <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Ítems listados:</strong> {filteredFinalProducts.length}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar (no-print) */}
            <div className="no-print bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div style={{ minWidth: '240px' }} className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Buscar Producto Elaborado</label>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre, SKU o código de barra..." 
                    value={finalSearch}
                    onChange={(e) => setFinalSearch(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>

                <div style={{ minWidth: '180px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Familia</label>
                  <select 
                    value={finalFamilyFilter} 
                    onChange={(e) => setFinalFamilyFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todas las familias</option>
                    {finalFamilies.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.parentId ? `— ${f.name} (${f.parentName || 'Sub'})` : f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: '170px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Origen / Tipo</label>
                  <select 
                    value={finalTypeFilter} 
                    onChange={(e) => setFinalTypeFilter(e.target.value as any)}
                    className="w-full text-sm font-medium"
                  >
                    <option value="ALL">Todos los tipos</option>
                    <option value="ELABORATED">🏭 Elaboración / Fraccionado</option>
                    <option value="RESALE">🛍️ Producto de Reventa</option>
                    <option value="PACK">🎁 Pack / Combo</option>
                  </select>
                </div>

                <div style={{ minWidth: '160px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado de Stock</label>
                  <select 
                    value={finalStockFilter} 
                    onChange={(e) => setFinalStockFilter(e.target.value as any)}
                    className="w-full text-sm"
                  >
                    <option value="ALL">Todos los niveles</option>
                    <option value="LOW">⚠️ Stock Bajo / Crítico</option>
                    <option value="WITH_STOCK">✅ Con Stock Disponible</option>
                    <option value="OUT_OF_STOCK">❌ Sin Stock (0)</option>
                  </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Estado Artículo</label>
                  <select 
                    value={finalStatusFilter} 
                    onChange={(e) => setFinalStatusFilter(e.target.value as any)}
                    className="w-full text-sm font-medium"
                  >
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVE">✅ Solo Activos</option>
                    <option value="SUSPENDED">⏸️ Solo Suspendidos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(finalSearch || finalFamilyFilter || finalTypeFilter !== 'ALL' || finalStockFilter !== 'ALL' || finalStatusFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setFinalSearch('');
                      setFinalFamilyFilter('');
                      setFinalTypeFilter('ALL');
                      setFinalStockFilter('ALL');
                      setFinalStatusFilter('ALL');
                    }}
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={handlePrint}
                  title="Imprimir o guardar catálogo/stock como PDF"
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>
              </div>
            </div>

            {/* Metrics summary banner */}
            <div className="no-print flex justify-between items-center text-xs text-text-muted mb-3 px-1">
              <div>
                Mostrando <strong className="text-text-dark">{filteredFinalProducts.length}</strong> de {finalProductsList.length} productos elaborados
              </div>
              <div className="flex items-center gap-4">
                <div>
                  Suspendidos: <strong className="text-amber-600">{finalProductsList.filter(i => i.isActive === false).length}</strong>
                </div>
                <div>
                  Stock Bajo / Alerta: <strong className="text-terracotta">{filteredFinalProducts.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
                </div>
              </div>
            </div>

            {loadingFinal && <div className="py-8 text-center text-text-muted">Cargando productos finales...</div>}
            {errorFinal && <div className="py-8 text-center text-terracotta">Error al cargar productos finales</div>}
            {!loadingFinal && !errorFinal && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre Comercial</th>
                      <th>Familia / Categoría</th>
                      <th>Stock</th>
                      <th>Precio Venta</th>
                      <th>Peso / Contenido</th>
                      <th>Materia Prima Base</th>
                      <th>Estado</th>
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinalProducts.map((item) => {
                      if (!item) return null;
                      const baseRm = rawMaterialsList.find(rm => rm && rm.id === item.rawMaterialId);
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = getFamilyDisplayLabel(item);
                      const isAct = item.isActive !== false;

                      return (
                        <tr key={item.id} className={!isAct ? 'opacity-60 bg-amber-50/20' : ''}>
                          <td className="font-semibold text-primary-sage">{item.code}</td>
                          <td className="font-medium">{item.name}</td>
                          <td><span className="badge gray">{familyName}</span></td>
                          <td>
                            <span className={currentStock <= minStock ? 'text-terracotta font-bold' : ''}>
                              {currentStock} un.
                            </span>
                          </td>
                          <td className="font-semibold text-text-dark">{(item.price || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                          <td>
                            {item.unitWeightGrams || 1} {formatUnitSuffix(normalizeUnitCode(item.unit, item.netContentLabel))}
                          </td>
                          <td>
                            {isProductPack(item) ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="badge amber text-xs w-fit font-semibold">
                                  🎁 Pack / Combo ({Array.isArray(item.ingredientsList) ? item.ingredientsList.length : 0} ítems)
                                </span>
                                {item.ingredients && (
                                  <span className="text-[11px] text-text-muted truncate max-w-[220px]" title={item.ingredients}>
                                    {item.ingredients}
                                  </span>
                                )}
                              </div>
                            ) : item.isResale ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="badge blue text-xs w-fit">🛍️ Reventa</span>
                                {item.supplierName && (
                                  <span className="text-[11px] text-text-muted">{item.supplierName}</span>
                                )}
                              </div>
                            ) : item.isBlend ? (
                              <span className="badge purple text-xs">📚 Blend / Mix</span>
                            ) : (
                              <span className="badge gray">{baseRm ? baseRm.name : 'Insumo Base'}</span>
                            )}
                          </td>
                          <td>
                            {isAct ? (
                              <span className="badge green text-[10px]">Activo</span>
                            ) : (
                              <span className="badge amber text-[10px]">Suspendido</span>
                            )}
                          </td>
                          <td className="no-print" style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                type="button"
                                onClick={() => openEditFinal(item)}
                                title="Editar producto final"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Pencil size={15} style={{ color: '#2563EB', strokeWidth: 2.2 }} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleToggleStatusFinal(item)}
                                title={isAct ? "Suspender / Pausar producto" : "Reactivar producto"}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: isAct ? '#FFFFFF' : '#FEF3C7',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                {isAct ? (
                                  <PauseCircle size={15} style={{ color: '#D97706', strokeWidth: 2.2 }} />
                                ) : (
                                  <PlayCircle size={15} style={{ color: '#10B981', strokeWidth: 2.2 }} />
                                )}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteFinal(item)}
                                title="Eliminar producto final"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #D1D5DB',
                                  backgroundColor: '#FFFFFF',
                                  cursor: 'pointer',
                                  padding: 0,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                              >
                                <Trash2 size={15} style={{ color: '#DC2626', strokeWidth: 2.2 }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFinalProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-text-muted">
                          No se encontraron productos finales para los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Movimientos / Kardex */}
        {activeTab === 'movements' && (
          <div>
            {/* Print Header */}
            <div className="print-only mb-4 border-b-2 pb-3" style={{ borderColor: '#2E5339' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 style={{ fontSize: '18pt', fontWeight: 'bold', color: '#2E5339', margin: 0, fontFamily: 'serif' }}>Flor y Ser</h1>
                  <p style={{ fontSize: '10pt', color: '#4B5563', margin: '2px 0 0 0' }}>Almacén Natural • Kardex Oficial & Trazabilidad Centralizada de Movimientos</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6B7280' }}>
                  <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div><strong>Movimientos listados:</strong> {stockMovementsList.length}</div>
                </div>
              </div>
            </div>

            {/* Filter Bar (no-print) */}
            <div className="no-print bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center flex-1">
                <div style={{ minWidth: '180px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Tipo de Artículo</label>
                  <select 
                    value={movementItemTypeFilter} 
                    onChange={(e) => setMovementItemTypeFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todos los artículos</option>
                    <option value="RAW_MATERIAL">Materias Primas (Granel)</option>
                    <option value="PACKAGING">Empaques & Etiquetas</option>
                    <option value="FINAL_PRODUCT">Productos Finales</option>
                  </select>
                </div>

                <div style={{ minWidth: '200px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Tipo de Movimiento</label>
                  <select 
                    value={movementTypeFilter} 
                    onChange={(e) => setMovementTypeFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todos los movimientos</option>
                    <option value="PURCHASE_RECEIPT">📦 Ingreso por Compra</option>
                    <option value="PURCHASE_RETURN">↩️ Anulación / Devolución Compra</option>
                    <option value="SALE">🛍️ Despacho por Venta</option>
                    <option value="SALE_CANCEL">🔄 Anulación / Retorno Venta</option>
                    <option value="MANUAL_ADJUSTMENT">⚖️ Ajuste Manual de Stock</option>
                  </select>
                </div>

                <div className="flex-1" style={{ minWidth: '220px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Buscar por Nombre / Ítem</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Avena, Frasco, FC-001..." 
                    value={movementSearch}
                    onChange={(e) => setMovementSearch(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2 pt-4">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm flex items-center gap-1"
                  onClick={() => refetchMovements()}
                >
                  <RefreshCw size={14} /> Refrescar
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  onClick={handlePrint}
                  title="Imprimir o guardar reporte de Kardex en PDF"
                >
                  <Printer size={15} /> Imprimir Kardex / PDF
                </button>
              </div>
            </div>

            {loadingMovements && <div className="py-8 text-center text-text-muted">Cargando trazabilidad de movimientos (Kardex)...</div>}
            {errorMovements && <div className="py-8 text-center text-terracotta">Error al consultar el Kardex.</div>}
            {!loadingMovements && !errorMovements && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Fecha / Hora</th>
                      <th>Movimiento</th>
                      <th>Categoría</th>
                      <th>Ítem / Insumo</th>
                      <th className="text-right">Variación Cant.</th>
                      <th className="text-center">Stock Antes ➔ Después</th>
                      <th>Comprobante / Ref.</th>
                      <th>Motivo / Auditoría</th>
                      <th>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovementsList.map((m: StockMovement) => {
                      const dateFormatted = m.createdAt ? new Date(m.createdAt).toLocaleString('es-AR') : '-';
                      const isPositive = m.quantity > 0;

                      let badgeClass = 'badge gray';
                      let badgeLabel: string = m.movementType;
                      if (m.movementType === 'PURCHASE_RECEIPT') {
                        badgeClass = 'badge green';
                        badgeLabel = 'Ingreso Compra';
                      } else if (m.movementType === 'PURCHASE_RETURN') {
                        badgeClass = 'badge orange';
                        badgeLabel = 'Anulación Compra';
                      } else if (m.movementType === 'SALE') {
                        badgeClass = 'badge red';
                        badgeLabel = 'Venta Despacho';
                      } else if (m.movementType === 'SALE_CANCEL') {
                        badgeClass = 'badge blue';
                        badgeLabel = 'Anulación Venta';
                      } else if (m.movementType === 'MANUAL_ADJUSTMENT') {
                        badgeClass = 'badge purple';
                        badgeLabel = 'Ajuste Stock';
                      }

                      return (
                        <tr key={m.id}>
                          <td className="text-xs text-text-muted whitespace-nowrap">{dateFormatted}</td>
                          <td>
                            <span className={badgeClass}>{badgeLabel}</span>
                          </td>
                          <td className="text-xs text-text-muted">
                            {m.itemType === 'RAW_MATERIAL' ? 'Granel' : m.itemType === 'PACKAGING' ? 'Empaque' : 'Elaborado'}
                          </td>
                          <td className="font-semibold text-text-dark">{m.itemName}</td>
                          <td className={`text-right font-bold whitespace-nowrap ${isPositive ? 'text-primary-sage' : 'text-terracotta'}`}>
                            {isPositive ? `+${m.quantity}` : `${m.quantity}`} {m.unitOfMeasure}
                          </td>
                          <td className="text-center font-medium text-xs whitespace-nowrap">
                            <span className="text-text-muted">{m.previousStock}</span>
                            <span className="mx-1 text-primary-sage font-bold">➔</span>
                            <span className="font-bold text-text-dark">{m.resultingStock}</span> {m.unitOfMeasure}
                          </td>
                          <td className="text-xs">
                            {m.referenceNumber ? (
                              <span className="font-medium text-primary-sage">{m.referenceNumber}</span>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                          <td className="text-xs">
                            <div>{m.reason || '-'}</div>
                            {m.notes && <div className="text-text-muted italic text-[11px]">{m.notes}</div>}
                          </td>
                          <td className="text-xs text-text-muted whitespace-nowrap">{m.userName || 'Sistema'}</td>
                        </tr>
                      );
                    })}
                    {stockMovementsList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-6 text-text-muted">
                          No se registran movimientos para los filtros seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nueva / Editar Materia Prima */}
      <Modal isOpen={isRawModalOpen} onClose={() => { setIsRawModalOpen(false); setEditingRawItem(null); }} title={editingRawItem ? "✏️ Editar Materia Prima" : "➕ Nueva Materia Prima (Granel)"}>
        <form onSubmit={rawForm.handleSubmit(onRawSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Nombre *</label>
              <input 
                {...rawForm.register('name')} 
                placeholder="Ej: Ácido ascórbico" 
                className={rawForm.formState.errors.name ? 'has-error' : ''} 
              />
              {rawForm.formState.errors.name && (
                <span className="field-error">{rawForm.formState.errors.name.message?.toString()}</span>
              )}
            </div>

            <div className="form-field">
              <div className="flex justify-between items-center mb-1">
                <label>Código SKU *</label>
                <button 
                  type="button" 
                  className="text-xs text-primary-sage font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  onClick={handleAutoGenerateRawCode}
                >
                  <Wand2 size={12} /> Auto
                </button>
              </div>
              <input 
                {...rawForm.register('code')} 
                placeholder="Ej: MP-ASC-01" 
                className={rawForm.formState.errors.code ? 'has-error' : ''} 
              />
              {rawForm.formState.errors.code && (
                <span className="field-error">{rawForm.formState.errors.code.message?.toString()}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Unidad de Medida *</label>
              <select {...rawForm.register('unit')}>
                <option value="GRS">Gramos (grs)</option>
                <option value="KG">Kilogramos (kg)</option>
                <option value="ML">Mililitros (ml)</option>
                <option value="CM3">Centímetros Cúbicos (cm3)</option>
                <option value="LTS">Litros (lts)</option>
                <option value="UND">Unidades (und)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Stock Inicial *</label>
              <input
                type="number"
                step="any"
                {...rawForm.register('currentStock', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Costo por Unidad ($) *</label>
              <input
                type="number"
                step="any"
                {...rawForm.register('costPerUnit', { valueAsNumber: true })}
              />
            </div>
            <div className="form-field">
              <label>Stock Mínimo de Alerta *</label>
              <input
                type="number"
                step="any"
                {...rawForm.register('minStock', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Familia / Categoría</label>
              <select {...rawForm.register('familyId')}>
                <option value="">Seleccione una familia...</option>
                {rawFamilies.map((fam: any) => fam && (
                  <option key={fam.id} value={fam.id}>
                    {fam.parentName ? `${fam.parentName} > ${fam.name}` : fam.name} ({fam.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Proveedor Maestro *</label>
              <select {...rawForm.register('supplierName')}>
                <option value="">Seleccione un proveedor...</option>
                {allSupplierNames.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Ubicación Depósito *</label>
            <input {...rawForm.register('storageLocation')} placeholder="Ej: Depósito A - Estante 2" />
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsRawModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createRaw.isPending}>
              {createRaw.isPending ? 'Guardando...' : 'Guardar Materia Prima'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo / Editar Material de Empaque / Etiqueta */}
      <Modal isOpen={isPkgModalOpen} onClose={() => { setIsPkgModalOpen(false); setEditingPkgItem(null); }} title={editingPkgItem ? "✏️ Editar Material de Empaque / Etiqueta" : "📦 Nuevo Material de Empaque / Etiqueta"}>
        <form onSubmit={pkgForm.handleSubmit(onPkgSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Nombre del Envase / Etiqueta *</label>
              <input 
                {...pkgForm.register('name')} 
                placeholder="Ej: Bolsa Doypack Kraft 250g" 
                className={pkgForm.formState.errors.name ? 'has-error' : ''} 
              />
              {pkgForm.formState.errors.name && (
                <span className="field-error">{pkgForm.formState.errors.name.message?.toString()}</span>
              )}
            </div>

            <div className="form-field">
              <div className="flex justify-between items-center mb-1">
                <label>Código SKU *</label>
                <button 
                  type="button" 
                  className="text-xs text-primary-sage font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  onClick={handleAutoGeneratePkgCode}
                >
                  <Wand2 size={12} /> Auto
                </button>
              </div>
              <input 
                {...pkgForm.register('code')} 
                placeholder="Ej: ENV-DOY-250" 
                className={pkgForm.formState.errors.code ? 'has-error' : ''} 
              />
              {pkgForm.formState.errors.code && (
                <span className="field-error">{pkgForm.formState.errors.code.message?.toString()}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <div className="flex justify-between items-center mb-1">
                <label className="mb-0">Categoría de Insumo *</label>
                <button
                  type="button"
                  className="text-xs text-primary-sage font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  onClick={() => setIsEditingPkgCategories(prev => !prev)}
                >
                  <Pencil size={12} /> {isEditingPkgCategories ? 'Cerrar editor' : 'Editar lista'}
                </button>
              </div>
              <select {...pkgForm.register('category')}>
                {pkgCategories.map(cat => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Unidad de Medida *</label>
              <select {...pkgForm.register('unit')}>
                <option value="UND">Unidades (und)</option>
                <option value="GRS">Gramos (grs)</option>
                <option value="ML">Mililitros (ml)</option>
                <option value="CM3">Centímetros Cúbicos (cm3)</option>
                <option value="KG">Kilogramos (kg)</option>
                <option value="LTS">Litros (lts)</option>
                <option value="ROLL">Rollos (roll)</option>
                <option value="PACK">Paquetes (pack)</option>
              </select>
            </div>
          </div>

          {isEditingPkgCategories && (
            <div
              className="p-3 rounded-lg border mb-2"
              style={{ backgroundColor: '#F8FAF8', borderColor: '#2E5339' }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-text-dark uppercase tracking-wide">
                  ⚙️ Gestionar Lista de Categorías de Insumo
                </span>
                <button
                  type="button"
                  className="text-xs text-text-muted hover:underline"
                  onClick={() => {
                    setIsEditingPkgCategories(false);
                    setEditingPkgCatCode(null);
                  }}
                >
                  Cerrar ✕
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3 pr-1">
                {pkgCategories.map(cat => (
                  <div
                    key={cat.code}
                    className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded border border-gray-200 text-sm"
                  >
                    {editingPkgCatCode === cat.code ? (
                      <>
                        <input
                          type="text"
                          value={editingPkgCatLabel}
                          onChange={(e) => setEditingPkgCatLabel(e.target.value)}
                          className="flex-1 text-sm py-1 px-2 border rounded"
                          placeholder="Nombre de la categoría..."
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-primary text-xs py-1 px-2.5"
                          onClick={() => {
                            if (!editingPkgCatLabel.trim()) return;
                            savePkgCategory.mutate(
                              { code: cat.code, label: editingPkgCatLabel.trim() },
                              {
                                onSuccess: () => {
                                  setEditingPkgCatCode(null);
                                  setEditingPkgCatLabel('');
                                }
                              }
                            );
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary text-xs py-1 px-2"
                          onClick={() => {
                            setEditingPkgCatCode(null);
                            setEditingPkgCatLabel('');
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate font-medium text-text-dark">
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modificar nombre de categoría"
                            onClick={() => {
                              setEditingPkgCatCode(cat.code);
                              setEditingPkgCatLabel(cat.label);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar categoría"
                            onClick={() => {
                              if (pkgCategories.length <= 1) {
                                alert('Debe existir al menos una categoría.');
                                return;
                              }
                              deletePkgCategory.mutate(cat.code, {
                                onSuccess: (updatedList) => {
                                  const currentVal = pkgForm.getValues('category');
                                  if (currentVal === cat.code && updatedList?.length > 0) {
                                    pkgForm.setValue('category', updatedList[0].code);
                                  }
                                }
                              });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center pt-2 border-t border-gray-200">
                <input
                  type="text"
                  value={newPkgCategoryLabel}
                  onChange={(e) => setNewPkgCategoryLabel(e.target.value)}
                  placeholder="Nueva categoría (ej: Frasco Gotero Ámbar, Bolsa Papel Kraft...)"
                  className="flex-1 text-sm py-1.5 px-2.5 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newPkgCategoryLabel.trim()) return;
                      const label = newPkgCategoryLabel.trim();
                      savePkgCategory.mutate(
                        { label },
                        {
                          onSuccess: (updatedList) => {
                            setNewPkgCategoryLabel('');
                            const created = updatedList?.find(c => c.label === label);
                            if (created) {
                              pkgForm.setValue('category', created.code, { shouldValidate: true });
                            }
                          }
                        }
                      );
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary text-xs py-1.5 px-3 whitespace-nowrap flex items-center gap-1"
                  onClick={() => {
                    if (!newPkgCategoryLabel.trim()) return;
                    const label = newPkgCategoryLabel.trim();
                    savePkgCategory.mutate(
                      { label },
                      {
                        onSuccess: (updatedList) => {
                          setNewPkgCategoryLabel('');
                          const created = updatedList?.find(c => c.label === label);
                          if (created) {
                            pkgForm.setValue('category', created.code, { shouldValidate: true });
                          }
                        }
                      }
                    );
                  }}
                >
                  <Plus size={14} /> Agregar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Stock Inicial *</label>
              <input
                type="number"
                {...pkgForm.register('currentStock', { valueAsNumber: true })}
              />
            </div>
            <div className="form-field">
              <label>Costo por Unidad ($) *</label>
              <input
                type="number"
                step="any"
                {...pkgForm.register('costPerUnit', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Familia de Artículos</label>
              <select {...pkgForm.register('familyId')}>
                <option value="">Seleccione una familia...</option>
                {pkgFamilies.map((fam: any) => fam && (
                  <option key={fam.id} value={fam.id}>
                    {fam.parentName ? `${fam.parentName} > ${fam.name}` : fam.name} ({fam.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Proveedor *</label>
              <select {...pkgForm.register('supplierName')}>
                <option value="">Seleccione un proveedor...</option>
                {allSupplierNames.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Ubicación Depósito *</label>
            <input {...pkgForm.register('storageLocation')} placeholder="Ej: Depósito C - Estante 1" />
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPkgModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createPkg.isPending}>
              {createPkg.isPending ? 'Guardando...' : 'Guardar Empaque'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo / Editar Producto Final */}
      <Modal isOpen={isFinalModalOpen} onClose={() => { setIsFinalModalOpen(false); setEditingFinalItem(null); }} title={editingFinalItem ? "✏️ Editar Producto Final" : (isPackProduct ? "🎁 Armar Nuevo Pack / Combo de Venta" : "📦 Nuevo Producto Final")} maxWidth="740px">
        <form onSubmit={finalForm.handleSubmit(onFinalSubmit)} className="flex flex-col gap-4">
          
          {/* Selector de Tipo de Producto (Monoproducto vs Blend/Mix vs Reventa vs Pack/Combo) */}
          <div className="form-field">
            <label className="font-semibold text-text-dark mb-2 block">Tipo de Producto / Origen *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                className={`btn ${(!isBlendProduct && !isResaleProduct && !isPackProduct) ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold`}
                onClick={() => {
                  setIsResaleProduct(false);
                  setIsBlendProduct(false);
                  setIsPackProduct(false);
                }}
              >
                <Package size={15} /> Monoproducto
              </button>
              <button
                type="button"
                className={`btn ${(isBlendProduct && !isResaleProduct && !isPackProduct) ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold`}
                onClick={() => {
                  setIsResaleProduct(false);
                  setIsBlendProduct(true);
                  setIsPackProduct(false);
                }}
              >
                <Layers size={15} /> Blend / Mix (%)
              </button>
              <button
                type="button"
                className={`btn ${(isResaleProduct && !isPackProduct) ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold`}
                onClick={() => {
                  setIsResaleProduct(true);
                  setIsBlendProduct(false);
                  setIsPackProduct(false);
                }}
              >
                <Tag size={15} /> Reventa Directa
              </button>
              <button
                type="button"
                className={`btn ${isPackProduct ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold`}
                onClick={() => {
                  setIsPackProduct(true);
                  setIsResaleProduct(false);
                  setIsBlendProduct(false);
                  finalForm.setValue('unit', 'UND');
                  finalForm.setValue('unitWeightGrams', 1);
                  if (packItems.length === 0) {
                    setPackItems([
                      { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 }
                    ]);
                  }
                }}
              >
                <Gift size={15} /> Pack / Combo
              </button>
            </div>
          </div>

          {isPackProduct ? (
            <div className="card p-4 bg-bg-linen rounded-md border border-card-border flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <span className="font-bold text-text-dark text-sm flex items-center gap-2">
                    <Gift size={16} className="text-primary-sage" />
                    Armador de Pack / Combo por Unidades
                  </span>
                  <p className="text-xs text-text-muted m-0 mt-0.5">
                    Combina productos de reventa (cargados en Materia Prima o en Productos Finales), elaborados y empaques filtrando por su Familia y Subfamilia.
                  </p>
                </div>
                <span className="badge amber text-xs font-bold">
                  Costo Total Pack: {totalPackCost.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </span>
              </div>

              {/* Filtros rápidos para encontrar los productos por Familia/Subfamilia u Origen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-white p-2.5 rounded border">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted mb-1 block">
                    🔍 Filtrar Selector por Familia / Subfamilia
                  </label>
                  <select
                    value={packFamilyFilter}
                    onChange={(e) => setPackFamilyFilter(e.target.value)}
                    className="w-full text-xs py-1.5"
                  >
                    <option value="">Todas las Familias y Subfamilias ({allPackCandidateItems.length} ítems)</option>
                    {sortHierarchically(articleFamilies).map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.parentId ? `— ${f.name} (${f.parentName || 'Subfamilia'})` : `📁 ${f.name}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-text-muted mb-1 block">
                    📦 Filtrar por Origen del Artículo
                  </label>
                  <select
                    value={packSourceFilter}
                    onChange={(e) => setPackSourceFilter(e.target.value as any)}
                    className="w-full text-xs py-1.5"
                  >
                    <option value="ALL">Todos (Materias Primas + Reventa + Elaborados + Cajas)</option>
                    <option value="RAW_MATERIAL">🌾 Cargados en Materias Primas</option>
                    <option value="RESALE">🛍️ Productos Finales de Reventa</option>
                    <option value="FINAL_PRODUCT">🏭 Todos los Productos Finales</option>
                    <option value="PACKAGING">📦 Cajas / Bolsas / Empaques</option>
                  </select>
                </div>
              </div>

              {/* Lista de integrantes del Pack */}
              <div className="flex flex-col gap-2">
                {packItems.map((pItem, idx) => {
                  const lineSubtotal = (Number(pItem.quantity) || 0) * (Number(pItem.unitCost) || 0);
                  // Asegurar que el ítem actualmente seleccionado aparezca aunque se cambie el filtro de familia
                  const optionsForRow = pItem.itemId && !filteredPackCandidates.some(c => c.id === pItem.itemId)
                    ? [
                        ...allPackCandidateItems.filter(c => c.id === pItem.itemId),
                        ...filteredPackCandidates
                      ]
                    : filteredPackCandidates;

                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border">
                      <div className="col-span-6">
                        <label className="text-[10px] text-text-muted block mb-0.5">
                          Integrante #{idx + 1} {pItem.familyName ? `• ${pItem.familyName}` : ''}
                        </label>
                        <select
                          value={pItem.itemId}
                          onChange={(e) => {
                            const selId = e.target.value;
                            const found = allPackCandidateItems.find(c => c.id === selId);
                            const updated = [...packItems];
                            if (found) {
                              updated[idx] = {
                                itemId: found.id,
                                itemType: found.itemType,
                                name: found.name,
                                code: found.code,
                                quantity: updated[idx].quantity || 1,
                                unit: found.unit,
                                unitCost: found.unitCost,
                                salePrice: found.salePrice,
                                familyId: found.familyId,
                                familyName: found.familyName
                              };
                              // Si el Pack aún no tiene familia asignada, heredar la familia del primer producto elegido
                              const currentFormFam = finalForm.getValues('familyId');
                              if (!currentFormFam && found.familyId) {
                                finalForm.setValue('familyId', found.familyId);
                              }
                            } else {
                              updated[idx] = { ...updated[idx], itemId: '', name: '', code: '', unitCost: 0 };
                            }
                            setPackItems(updated);
                            const newTotalCost = updated.reduce((s, item) => s + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
                            finalForm.setValue('costPrice', newTotalCost);
                            if (newTotalCost > 0) {
                              finalForm.setValue('price', Math.round(newTotalCost * (1 + packMarkupPct / 100)));
                            }
                          }}
                          className="w-full text-xs"
                        >
                          <option value="">Seleccionar producto o materia prima...</option>
                          {optionsForRow.map(cand => {
                            const tag = cand.itemType === 'RAW_MATERIAL'
                              ? '[MP]'
                              : cand.itemType === 'PACKAGING'
                              ? '[Empaque]'
                              : cand.isResale
                              ? '[Reventa]'
                              : '[Elaborado]';
                            return (
                              <option key={`${cand.itemType}-${cand.id}`} value={cand.id}>
                                {tag} {cand.name} ({cand.familyName}) — Costo: ${cand.unitCost.toLocaleString('es-AR')}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-text-muted block mb-0.5">Cant. ({pItem.unit || 'UND'})</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={pItem.quantity}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 0;
                            const updated = [...packItems];
                            updated[idx].quantity = qty;
                            setPackItems(updated);
                            const newTotalCost = updated.reduce((s, item) => s + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
                            finalForm.setValue('costPrice', newTotalCost);
                            if (newTotalCost > 0) {
                              finalForm.setValue('price', Math.round(newTotalCost * (1 + packMarkupPct / 100)));
                            }
                          }}
                          className="w-full text-center text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-text-muted block mb-0.5">Costo Unit. ($)</label>
                        <input
                          type="number"
                          step="any"
                          value={pItem.unitCost}
                          onChange={(e) => {
                            const uCost = parseFloat(e.target.value) || 0;
                            const updated = [...packItems];
                            updated[idx].unitCost = uCost;
                            setPackItems(updated);
                            const newTotalCost = updated.reduce((s, item) => s + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
                            finalForm.setValue('costPrice', newTotalCost);
                            if (newTotalCost > 0) {
                              finalForm.setValue('price', Math.round(newTotalCost * (1 + packMarkupPct / 100)));
                            }
                          }}
                          className="w-full text-right text-xs"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-between gap-1 pt-3">
                        <span className="text-xs font-bold text-primary-sage">
                          ${lineSubtotal.toLocaleString('es-AR')}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary text-terracotta p-1.5"
                          onClick={() => {
                            if (packItems.length > 1) {
                              const updated = packItems.filter((_, i) => i !== idx);
                              setPackItems(updated);
                              const newTotalCost = updated.reduce((s, item) => s + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
                              finalForm.setValue('costPrice', newTotalCost);
                              if (newTotalCost > 0) {
                                finalForm.setValue('price', Math.round(newTotalCost * (1 + packMarkupPct / 100)));
                              }
                            }
                          }}
                          title="Quitar ítem del pack"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center flex-wrap gap-2 mt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary flex items-center gap-1.5"
                  onClick={() => {
                    setPackItems([
                      ...packItems,
                      { itemId: '', itemType: 'RAW_MATERIAL', name: '', code: '', quantity: 1, unit: 'UND', unitCost: 0 }
                    ]);
                  }}
                >
                  <Plus size={14} /> Agregar otro Producto / Insumo al Pack
                </button>

                {/* Mini calculadora de Recargo directo para el Pack */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border text-xs">
                  <span className="text-text-muted">Costo Pack: <strong>${totalPackCost.toLocaleString('es-AR')}</strong></span>
                  <span>+ Recargo %:</span>
                  <input
                    type="number"
                    step="0.5"
                    value={packMarkupPct}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setPackMarkupPct(pct);
                      finalForm.setValue('costPrice', totalPackCost);
                      if (totalPackCost > 0) {
                        finalForm.setValue('price', Math.round(totalPackCost * (1 + pct / 100)));
                      }
                    }}
                    className="w-16 text-center font-bold py-0.5 px-1"
                  />
                  <span className="text-primary-sage font-bold">
                    ➔ Sugerido: ${Math.round(totalPackCost * (1 + packMarkupPct / 100)).toLocaleString('es-AR')}
                  </span>
                  {totalPackIndividualSalePrices > 0 && (
                    <span className="text-[11px] text-text-muted ml-1">
                      (Suma sueltos: ${totalPackIndividualSalePrices.toLocaleString('es-AR')})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : isResaleProduct ? (
            <div className="card p-4 bg-bg-linen rounded-md border border-card-border flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-dark text-sm flex items-center gap-2">
                  <Tag size={16} className="text-primary-sage" />
                  Datos de Compra Directa (Producto de Reventa)
                </span>
                <span className="badge blue text-xs">🛍️ Sin Fraccionamiento</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                Este producto se adquiere ya elaborado/envasado listo para la venta. Su stock se incrementa desde Recepción de Mercadería o Ajuste Manual.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label>Costo de Compra Unitario ($)</label>
                  <input
                    type="number"
                    step="any"
                    {...finalForm.register('costPrice', { valueAsNumber: true })}
                    placeholder="Ej: 1800"
                  />
                </div>
                <div className="form-field">
                  <label>Proveedor del Producto</label>
                  <select {...finalForm.register('supplierName')}>
                    <option value="">Seleccione proveedor...</option>
                    {allSupplierNames.map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : !isBlendProduct ? (
            <div className="form-field">
              <label>Materia Prima Base (Insumo Origen) *</label>
              <select
                {...finalForm.register('rawMaterialId')}
                onChange={(e) => {
                  const rmId = e.target.value;
                  finalForm.setValue('rawMaterialId', rmId);
                  const rm = rawMaterialsList.find(r => r && r.id === rmId);
                  if (rm && rm.familyId && !finalForm.getValues('familyId')) {
                    finalForm.setValue('familyId', rm.familyId);
                  }
                }}
              >
                <option value="">Seleccione materia prima base...</option>
                {rawMaterialsList.map(rm => rm && (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} ({rm.code}) - Stock: {rm.currentStock} {rm.unit}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="card p-4 bg-bg-linen rounded-md border border-card-border flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-text-dark text-sm flex items-center gap-2">
                  <Layers size={16} className="text-primary-sage" />
                  Fórmula / Ingredientes del Mix (Blend)
                </span>
                <span className={`badge ${blendIngredients.reduce((acc, curr) => acc + (curr.percentage || 0), 0) === 100 ? 'green' : 'orange'} font-bold`}>
                  Total: {blendIngredients.reduce((acc, curr) => acc + (curr.percentage || 0), 0)}%
                </span>
              </div>

              {blendIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <select
                      value={ing.rawMaterialId}
                      onChange={(e) => {
                        const newIngredients = [...blendIngredients];
                        newIngredients[idx].rawMaterialId = e.target.value;
                        setBlendIngredients(newIngredients);
                      }}
                      className="w-full text-sm"
                    >
                      <option value="">Seleccione insumo...</option>
                      {rawMaterialsList.map(rm => rm && (
                        <option key={rm.id} value={rm.id}>
                          {rm.name} ({rm.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={ing.percentage}
                      onChange={(e) => {
                        const newIngredients = [...blendIngredients];
                        newIngredients[idx].percentage = parseFloat(e.target.value) || 0;
                        setBlendIngredients(newIngredients);
                      }}
                      placeholder="%"
                      className="w-full text-center text-sm font-semibold"
                    />
                    <span className="text-xs font-bold text-text-muted">%</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary text-terracotta hover:bg-terracotta/10 p-2"
                    onClick={() => {
                      if (blendIngredients.length > 1) {
                        setBlendIngredients(blendIngredients.filter((_, i) => i !== idx));
                      }
                    }}
                    title="Quitar ingrediente"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-sm btn-secondary flex items-center justify-center gap-2 mt-1 self-start"
                onClick={() => {
                  setBlendIngredients([
                    ...blendIngredients,
                    { rawMaterialId: '', percentage: 0 }
                  ]);
                }}
              >
                <Plus size={14} /> Agregar Ingrediente al Blend
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Nombre Comercial *</label>
              <input 
                {...finalForm.register('name')} 
                placeholder={isPackProduct ? "Ej: Pack Desayuno Energético / Combo Tinturas" : "Ej: Almendras Nonpareil 500g / Aceite Coco 200ml"} 
                className={finalForm.formState.errors.name ? 'has-error' : ''} 
              />
              {finalForm.formState.errors.name && (
                <span className="field-error">{finalForm.formState.errors.name.message?.toString()}</span>
              )}
            </div>

            <div className="form-field">
              <label>Familia › Subfamilia</label>
              <select {...finalForm.register('familyId')}>
                <option value="">Seleccione una familia o subfamilia...</option>
                {finalFamilies.map((fam: any) => fam && (
                  <option key={fam.id} value={fam.id}>
                    {fam.parentName ? `${fam.parentName} › ${fam.name}` : fam.name} ({fam.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="form-field">
              <label>Precio de Venta Final ($) *</label>
              <input
                type="number"
                step="any"
                {...finalForm.register('price', { valueAsNumber: true })}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  finalForm.setValue('price', val);
                  if (isPackProduct && totalPackCost > 0) {
                    setPackMarkupPct(Number((((val - totalPackCost) / totalPackCost) * 100).toFixed(1)));
                  }
                }}
              />
            </div>
            <div className="form-field">
              <label>Contenido / Cantidad *</label>
              <input
                type="number"
                step="any"
                {...finalForm.register('unitWeightGrams', { valueAsNumber: true })}
              />
            </div>
            <div className="form-field">
              <label>Unidad de Medida *</label>
              <select {...finalForm.register('unit')}>
                <option value="GRS">Gramos (grs)</option>
                <option value="ML">Mililitros (ml)</option>
                <option value="CM3">Centímetros Cúbicos (cm3)</option>
                <option value="UND">Unidades (und)</option>
                <option value="KG">Kilogramos (kg)</option>
                <option value="LTS">Litros (lts)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Stock Inicial (Unidades) *</label>
              <input
                type="number"
                {...finalForm.register('currentStock', { valueAsNumber: true })}
              />
            </div>
            <div className="form-field">
              <label>Stock Mínimo Alerta *</label>
              <input
                type="number"
                {...finalForm.register('minStock', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Código de Barras (EAN-13)</label>
              <input {...finalForm.register('barcode')} placeholder="7791234567890" />
            </div>
            <div className="form-field">
              <label>Días de Vencimiento Estándar</label>
              <input
                type="number"
                {...finalForm.register('defaultExpirationDays', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsFinalModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createFinal.isPending}>
              {createFinal.isPending ? 'Guardando...' : (isPackProduct ? '💾 Guardar Pack / Combo' : 'Guardar Producto Final')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ágil: Pasar Materia Prima a Producto de Reventa conservando Familia y Subfamilia */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => { setIsPromoteModalOpen(false); setPromoteRawItem(null); }}
        title="🛍️ Pasar a Producto de Reventa (Conservando Familia)"
        maxWidth="580px"
      >
        {promoteRawItem && (
          <form onSubmit={handleConfirmPromoteToResale} className="flex flex-col gap-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-text-dark flex flex-col gap-1">
              <div className="font-bold text-blue-900 flex items-center justify-between">
                <span>Origen en Materia Prima: {promoteRawItem.name} ({promoteRawItem.code})</span>
                <span className="badge blue">{getFamilyDisplayLabel(promoteRawItem)}</span>
              </div>
              <p className="m-0 text-text-muted">
                Se creará como <strong>Producto Final de Reventa</strong> manteniendo exactamente su <strong>Familia y Subfamilia</strong>, su costo de compra y proveedor, y podrás seguir usándolo tanto para venta individual como dentro de <strong>Packs / Combos</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs font-semibold">Nombre Comercial de Venta *</label>
                <input
                  type="text"
                  value={promoteName}
                  onChange={(e) => setPromoteName(e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label className="text-xs font-semibold">Código SKU Producto Final *</label>
                <input
                  type="text"
                  value={promoteCode}
                  onChange={(e) => setPromoteCode(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="text-xs font-semibold">Familia › Subfamilia Asignada (Se conserva automáticamente) *</label>
              <select
                value={promoteFamilyId}
                onChange={(e) => setPromoteFamilyId(e.target.value)}
              >
                <option value="">Sin familia asignada</option>
                {sortHierarchically(articleFamilies).map((fam: any) => fam && (
                  <option key={fam.id} value={fam.id}>
                    {fam.parentName ? `${fam.parentName} › ${fam.name}` : fam.name} ({fam.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Calculadora Bidireccional de Costo -> Recargo % -> Precio Final */}
            <div className="p-3.5 bg-bg-linen rounded-lg border flex flex-col gap-3">
              <div className="text-xs font-bold text-text-dark flex items-center justify-between">
                <span>💲 Formación Directa del Precio de Venta (Sin Números Ocultos)</span>
                <span className="text-primary-sage">
                  Ganancia Limpia: ${(Math.max(0, promoteSalePrice - promoteCostPrice)).toLocaleString('es-AR')}/un.
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="form-field">
                  <label className="text-xs">1. Costo Compra ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={promoteCostPrice}
                    onChange={(e) => {
                      const c = parseFloat(e.target.value) || 0;
                      setPromoteCostPrice(c);
                      setPromoteSalePrice(Math.round(c * (1 + promoteMarkupPct / 100)));
                    }}
                    className="font-semibold"
                  />
                </div>
                <div className="form-field">
                  <label className="text-xs">2. + % Recargo s/Costo</label>
                  <input
                    type="number"
                    step="0.5"
                    value={promoteMarkupPct}
                    onChange={(e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      setPromoteMarkupPct(pct);
                      setPromoteSalePrice(Math.round(promoteCostPrice * (1 + pct / 100)));
                    }}
                    className="font-bold text-primary-sage text-center"
                  />
                </div>
                <div className="form-field">
                  <label className="text-xs font-bold">3. = Precio Venta ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={promoteSalePrice}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setPromoteSalePrice(p);
                      if (promoteCostPrice > 0) {
                        setPromoteMarkupPct(Number((((p - promoteCostPrice) / promoteCostPrice) * 100).toFixed(1)));
                      }
                    }}
                    className="font-bold border-primary-sage"
                  />
                </div>
              </div>
              <div className="text-[11px] text-text-muted flex justify-between border-t pt-2">
                <span>
                  Cuenta exacta: <strong>${promoteCostPrice.toLocaleString('es-AR')}</strong> + <strong>{promoteMarkupPct}%</strong> (${Math.round(promoteCostPrice * (promoteMarkupPct / 100)).toLocaleString('es-AR')}) = <strong>${promoteSalePrice.toLocaleString('es-AR')}</strong>
                </span>
                <span>Proveedor: <strong>{promoteRawItem.supplierName || 'Sin asignar'}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <label className="text-xs">Stock Disponible a Transferir (Unidades)</label>
                <input
                  type="number"
                  step="any"
                  value={promoteCurrentStock}
                  onChange={(e) => setPromoteCurrentStock(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-field">
                <label className="text-xs">Stock Mínimo de Alerta</label>
                <input
                  type="number"
                  step="any"
                  value={promoteMinStock}
                  onChange={(e) => setPromoteMinStock(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-text-dark cursor-pointer bg-amber-50/60 p-2.5 rounded border border-amber-200">
              <input
                type="checkbox"
                checked={promoteSuspendOriginalRaw}
                onChange={(e) => setPromoteSuspendOriginalRaw(e.target.checked)}
              />
              <span>
                Pausar/Suspender de la pestaña <strong>Materias Primas</strong> luego de pasarlo a Reventa (dejar destildado si quieres verlo en ambas tablas).
              </span>
            </label>

            <div className="form-actions flex justify-end gap-3 border-t pt-3">
              <button type="button" className="btn btn-secondary" onClick={() => setIsPromoteModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary flex items-center gap-1.5" disabled={createFinal.isPending}>
                <ShoppingBag size={15} />
                {createFinal.isPending ? 'Creando...' : 'Confirmar y Publicar en Productos Finales'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Ajuste Manual de Stock */}
      <Modal 
        isOpen={isAdjustModalOpen} 
        onClose={() => setIsAdjustModalOpen(false)} 
        title="⚖️ Ajuste Manual de Inventario (Kardex)" 
        maxWidth="580px"
      >
        <form onSubmit={handleSaveAdjustment} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Tipo de Artículo *</label>
              <select 
                value={adjustItemType} 
                onChange={(e) => {
                  const newType = e.target.value as StockItemType;
                  setAdjustItemType(newType);
                  if (newType === 'FINAL_PRODUCT' && finalProductsList.length > 0) setAdjustItemId(finalProductsList[0].id);
                  else if (newType === 'PACKAGING' && packagingMaterialsList.length > 0) setAdjustItemId(packagingMaterialsList[0].id);
                  else if (rawMaterialsList.length > 0) setAdjustItemId(rawMaterialsList[0].id);
                  else setAdjustItemId('');
                }}
              >
                <option value="RAW_MATERIAL">Materia Prima (Granel)</option>
                <option value="PACKAGING">Empaque / Etiqueta</option>
                <option value="FINAL_PRODUCT">Producto Final Elaborado</option>
              </select>
            </div>

            <div className="form-field">
              <label>Artículo / Insumo *</label>
              <select 
                value={adjustItemId} 
                onChange={(e) => setAdjustItemId(e.target.value)}
                required
              >
                <option value="">Seleccione artículo...</option>
                {adjustItemType === 'RAW_MATERIAL' && rawMaterialsList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code || 'S/C'}) - Stock: {item.currentStock} {item.unit || 'KG'}
                  </option>
                ))}
                {adjustItemType === 'PACKAGING' && packagingMaterialsList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code || 'S/C'}) - Stock: {item.currentStock} {item.unit || 'UN'}
                  </option>
                ))}
                {adjustItemType === 'FINAL_PRODUCT' && finalProductsList.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code || 'S/C'}) - Stock: {item.currentStock} un.
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Stock Banner */}
          {selectedAdjustItem && (
            <div className="p-3 bg-bg-linen border rounded flex justify-between items-center text-sm">
              <div>
                <span className="text-text-muted">Stock actual registrado:</span>{' '}
                <strong className="text-text-dark text-base">{currentStockOfSelectedItem} {unitOfSelectedItem}</strong>
              </div>
              <div className="text-right">
                <span className="text-text-muted">Stock resultante estimado:</span>{' '}
                <strong className="text-primary-sage text-base">{calculatePreviewStock()} {unitOfSelectedItem}</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Operación de Ajuste *</label>
              <select 
                value={adjustType} 
                onChange={(e) => setAdjustType(e.target.value as any)}
              >
                <option value="ADD">➕ Sumar al stock actual</option>
                <option value="SUBTRACT">➖ Restar del stock actual</option>
                <option value="SET_EXACT">🎯 Fijar stock exacto (Conteo Físico)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Cantidad a {adjustType === 'SET_EXACT' ? 'Fijar' : (adjustType === 'ADD' ? 'Sumar' : 'Restar')} *</label>
              <input 
                type="number" 
                step="any" 
                min={adjustType === 'SET_EXACT' ? '0' : '0.001'}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Motivo del Ajuste *</label>
            <select 
              value={adjustReason} 
              onChange={(e) => setAdjustReason(e.target.value)}
            >
              <option value="CONTEO_FISICO">Conteo físico / Auditoría periódica</option>
              <option value="MERMA">Merma en fraccionamiento / Manipulación</option>
              <option value="ROTURA">Rotura de envase / Deterioro de mercadería</option>
              <option value="VENCIMIENTO">Vencimiento de lote</option>
              <option value="DEVOLUCION">Devolución / Reingreso de cliente</option>
              <option value="CORRECCION_CARGA">Corrección de error de carga inicial</option>
              <option value="OTRO">Otro motivo justificado</option>
            </select>
          </div>

          <div className="form-field">
            <label>Notas / Justificación (Opcional)</label>
            <textarea 
              rows={2} 
              placeholder="Detalles adicionales, responsable, número de lote..."
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
            />
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={createAdjustment.isPending}>
              {createAdjustment.isPending ? 'Guardando Ajuste...' : 'Confirmar Ajuste en Kardex'}
            </button>
          </div>
        </form>
      </Modal>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type={bulkImportType}
        onSuccess={() => {
          // Refetch stock lists
          window.location.reload();
        }}
      />

      <PriceListGeneratorModal
        isOpen={isPriceListModalOpen}
        onClose={() => setIsPriceListModalOpen(false)}
        products={finalProductsList}
        families={finalFamilies.length > 0 ? finalFamilies : articleFamilies}
        settings={settingsData}
      />
    </div>
  );
};

// Error Boundary para evitar pantalla en blanco
class StockErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('StockPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-container" style={{ padding: '2rem' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#DC2626', marginBottom: '1rem' }}>
              ⚠️ Error en Stock & Productos
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
              Se produjo un error al cargar esta página. Detalle técnico:
            </p>
            <pre style={{
              background: '#FEF2F2',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '200px',
              color: '#991B1B'
            }}>
              {this.state.error?.message || 'Error desconocido'}
              {'\n\n'}
              {this.state.error?.stack || ''}
            </pre>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                this.setState({ hasError: false, error: null });
              }}
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const StockPageWithBoundary: React.FC<{ onTabChange?: (tab: string) => void }> = (props) => (
  <StockErrorBoundary>
    <StockPage {...props} />
  </StockErrorBoundary>
);
