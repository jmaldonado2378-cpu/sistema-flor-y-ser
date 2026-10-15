import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Wand2, Package, Tag, Box, Pencil, Trash2, Layers, History, SlidersHorizontal, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Printer, Search, Filter } from 'lucide-react';
import {
  useRawMaterials,
  useFinalProducts,
  useCreateRawMaterial,
  useUpdateRawMaterial,
  useCreateFinalProduct,
  useUpdateFinalProduct,
} from '../hooks/useInventory';
import { usePackagingMaterials, useCreatePackagingMaterial, useUpdatePackagingMaterial } from '../hooks/usePackaging';
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
  supplierName: z.string().min(1, 'Seleccione o ingrese un proveedor'),
  storageLocation: z.string().min(1, 'Ubicación requerida'),
  familyId: z.string().optional(),
});

const packagingSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.enum(['DOYPACK', 'JAR', 'LABEL', 'BOX', 'BAG', 'OTHER']),
  unit: z.string().min(1, 'Unidad requerida'),
  currentStock: z.number().min(0, 'Debe ser >= 0'),
  minStock: z.number().min(0, 'Debe ser >= 0'),
  costPerUnit: z.number().min(0, 'Debe ser >= 0'),
  supplierName: z.string().min(1, 'Proveedor requerido'),
  storageLocation: z.string().min(1, 'Ubicación requerida'),
  familyId: z.string().optional(),
});

const finalProductSchema = z.object({
  rawMaterialId: z.string().optional(),
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  unitWeightGrams: z.number().min(0, 'Debe ser >= 0'),
  netContentLabel: z.string().optional(),
  currentStock: z.number().min(0, 'Debe ser >= 0'),
  minStock: z.number().min(0, 'Debe ser >= 0'),
  price: z.number().min(0, 'Debe ser >= 0'),
  ingredients: z.string().optional(),
  dietaryBadgeCodes: z.string().optional(),
  defaultExpirationDays: z.number().min(0, 'Debe ser >= 0'),
  familyId: z.string().optional(),
});

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
  const [blendIngredients, setBlendIngredients] = useState<Array<{ rawMaterialId: string; percentage: number }>>([
    { rawMaterialId: '', percentage: 50 },
    { rawMaterialId: '', percentage: 50 },
  ]);

  const [editingRawItem, setEditingRawItem] = useState<any>(null);
  const [editingPkgItem, setEditingPkgItem] = useState<any>(null);
  const [editingFinalItem, setEditingFinalItem] = useState<any>(null);

  const { data: rawMaterials, isLoading: loadingRaw, isError: errorRaw } = useRawMaterials();
  const { data: packagingMaterials, isLoading: loadingPkg, isError: errorPkg } = usePackagingMaterials();
  const { data: finalProducts, isLoading: loadingFinal, isError: errorFinal } = useFinalProducts();
  const { data: suppliers } = useSuppliers();
  const { data: rawFamiliesData } = useArticleFamilies();
  const { data: settingsData } = useSettings();

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

  const rawFamilies = articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    return sc === 'RAW_MATERIAL' || sc === 'RAW' || sc === 'MATERIA PRIMA' || sc === 'ALL';
  });

  const pkgFamilies = articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    return sc === 'PACKAGING' || sc === 'PKG' || sc === 'EMPAQUE' || sc === 'EMP' || sc === 'ALL';
  });

  const finalFamilies = articleFamilies.filter((f: any) => {
    if (!f) return false;
    const sc = getScope(f);
    return sc === 'FINAL_PRODUCT' || sc === 'FINAL' || sc === 'PRODUCTO FINAL' || sc === 'ALL';
  });

  // Filtros Tab 1: Materias Primas
  const [rawSearch, setRawSearch] = useState('');
  const [rawFamilyFilter, setRawFamilyFilter] = useState('');
  const [rawSupplierFilter, setRawSupplierFilter] = useState('');
  const [rawStockFilter, setRawStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Filtros Tab 2: Empaques & Etiquetas
  const [pkgSearch, setPkgSearch] = useState('');
  const [pkgCategoryFilter, setPkgCategoryFilter] = useState('');
  const [pkgSupplierFilter, setPkgSupplierFilter] = useState('');
  const [pkgFamilyFilter, setPkgFamilyFilter] = useState('');
  const [pkgStockFilter, setPkgStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Filtros Tab 3: Productos Finales
  const [finalSearch, setFinalSearch] = useState('');
  const [finalFamilyFilter, setFinalFamilyFilter] = useState('');
  const [finalStockFilter, setFinalStockFilter] = useState<'ALL' | 'LOW' | 'WITH_STOCK' | 'OUT_OF_STOCK'>('ALL');

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
      if (itemFam !== rawFamilyFilter) return false;
    }
    if (rawSupplierFilter) {
      if ((item.supplierName || '') !== rawSupplierFilter) return false;
    }
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
    if (pkgCategoryFilter && item.category !== pkgCategoryFilter) return false;
    if (pkgSupplierFilter && (item.supplierName || '') !== pkgSupplierFilter) return false;
    if (pkgFamilyFilter) {
      const itemFam = item.familyId || (item as any).articleFamilyId;
      if (itemFam !== pkgFamilyFilter) return false;
    }
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
      if (itemFam !== finalFamilyFilter) return false;
    }
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

  const createPkg = useCreatePackagingMaterial();
  const updatePkg = useUpdatePackagingMaterial();

  const createFinal = useCreateFinalProduct();
  const updateFinal = useUpdateFinalProduct();

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
      netContentLabel: '',
      currentStock: 0,
      minStock: 10,
      price: 0,
      ingredients: '',
      dietaryBadgeCodes: '',
      defaultExpirationDays: 180,
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
      unit: item.unit,
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
      category: item.category,
      unit: item.unit || 'UN',
      currentStock: item.currentStock,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
      supplierName: item.supplierName || '',
      storageLocation: item.storageLocation || 'Depósito C',
      familyId: item.familyId || item.articleFamilyId || '',
    });
    setIsPkgModalOpen(true);
  };

  const openEditFinal = (item: any) => {
    setEditingFinalItem(item);
    setIsBlendProduct(Boolean(item.isBlend));
    if (Array.isArray(item.ingredientsList) && item.ingredientsList.length > 0) {
      setBlendIngredients(item.ingredientsList.map((ing: any) => ({
        rawMaterialId: ing.rawMaterialId,
        percentage: ing.percentage || 0
      })));
    } else {
      setBlendIngredients([
        { rawMaterialId: item.rawMaterialId || '', percentage: 100 }
      ]);
    }

    finalForm.reset({
      rawMaterialId: item.rawMaterialId || '',
      code: item.code,
      barcode: item.barcode || '',
      name: item.name,
      unitWeightGrams: item.unitWeightGrams,
      netContentLabel: item.netContentLabel || '',
      currentStock: item.currentStock,
      minStock: item.minStock,
      price: item.price,
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

    const formattedIngredientsList = isBlendProduct 
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

    const autoIngredientsText = isBlendProduct
      ? formattedIngredientsList.map(ing => `${ing.rawMaterialName} (${ing.percentage}%)`).join(', ')
      : data.ingredients;

    const payload = { 
      ...data,
      code: finalCode, 
      dietaryBadgeCodes: badgeCodesArray, 
      barcode: data.barcode || finalCode,
      isBlend: isBlendProduct,
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
    switch (cat) {
      case 'DOYPACK': return 'Bolsa Doypack';
      case 'JAR': return 'Frasco Vidrio';
      case 'LABEL': return 'Etiqueta';
      case 'BOX': return 'Caja Embalaje';
      case 'BAG': return 'Bolsa Vacío';
      default: return 'Envase / Etiqueta';
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
                    setIsBlendProduct(false);
                    setBlendIngredients([
                      { rawMaterialId: rawMaterialsList.length > 0 ? rawMaterialsList[0]?.id || '' : '', percentage: 50 },
                      { rawMaterialId: rawMaterialsList.length > 1 ? rawMaterialsList[1]?.id || '' : '', percentage: 50 },
                    ]);
                    finalForm.reset({
                      rawMaterialId: rawMaterialsList.length > 0 ? rawMaterialsList[0]?.id || '' : '',
                      code: '',
                      barcode: '',
                      name: '',
                      unitWeightGrams: 500,
                      netContentLabel: '500g',
                      currentStock: 0,
                      minStock: 10,
                      price: 0,
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
                      <option key={f.id} value={f.id}>{f.name}</option>
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
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(rawSearch || rawFamilyFilter || rawSupplierFilter || rawStockFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setRawSearch('');
                      setRawFamilyFilter('');
                      setRawSupplierFilter('');
                      setRawStockFilter('ALL');
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
              <div>
                Stock Bajo / Alerta: <strong className="text-terracotta">{filteredRawMaterials.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
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
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRawMaterials.map((item) => {
                      if (!item) return null;
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = item.familyName || (articleFamilies || []).find(f => f && (f.id === item.familyId || f.id === (item as any).articleFamilyId))?.name || 'Sin familia';

                      return (
                        <tr key={item.id}>
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
                          <td className="no-print" style={{ textAlign: 'right' }}>
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

                <div style={{ minWidth: '150px' }}>
                  <label className="text-xs text-text-muted mb-1 block">Categoría</label>
                  <select 
                    value={pkgCategoryFilter} 
                    onChange={(e) => setPkgCategoryFilter(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Todas las categorías</option>
                    <option value="DOYPACK">Bolsa Doypack</option>
                    <option value="JAR">Frasco Vidrio</option>
                    <option value="LABEL">Etiqueta</option>
                    <option value="BOX">Caja Embalaje</option>
                    <option value="BAG">Bolsa Vacío</option>
                    <option value="OTHER">Otro</option>
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
                      <option key={f.id} value={f.id}>{f.name}</option>
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
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(pkgSearch || pkgCategoryFilter || pkgFamilyFilter || pkgSupplierFilter || pkgStockFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setPkgSearch('');
                      setPkgCategoryFilter('');
                      setPkgFamilyFilter('');
                      setPkgSupplierFilter('');
                      setPkgStockFilter('ALL');
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
              <div>
                Stock Bajo / Alerta: <strong className="text-terracotta">{filteredPackagingMaterials.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
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
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPackagingMaterials.map((item) => {
                      if (!item) return null;
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = item.familyName || (articleFamilies || []).find(f => f && (f.id === item.familyId || f.id === (item as any).articleFamilyId))?.name || 'Sin familia';

                      return (
                        <tr key={item.id}>
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
                          <td className="no-print" style={{ textAlign: 'right' }}>
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
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
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
              </div>

              <div className="flex items-end gap-2 pt-4">
                {(finalSearch || finalFamilyFilter || finalStockFilter !== 'ALL') && (
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setFinalSearch('');
                      setFinalFamilyFilter('');
                      setFinalStockFilter('ALL');
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
              <div>
                Stock Bajo / Alerta: <strong className="text-terracotta">{filteredFinalProducts.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length}</strong>
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
                      <th className="no-print" style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFinalProducts.map((item) => {
                      if (!item) return null;
                      const baseRm = rawMaterialsList.find(rm => rm && rm.id === item.rawMaterialId);
                      const currentStock = item.currentStock || 0;
                      const minStock = item.minStock || 0;
                      const familyName = item.familyName || (articleFamilies || []).find(f => f && (f.id === item.familyId || f.id === (item as any).articleFamilyId))?.name || 'Sin familia';

                      return (
                        <tr key={item.id}>
                          <td className="font-semibold text-primary-sage">{item.code}</td>
                          <td className="font-medium">{item.name}</td>
                          <td><span className="badge gray">{familyName}</span></td>
                          <td>
                            <span className={currentStock <= minStock ? 'text-terracotta font-bold' : ''}>
                              {currentStock} un.
                            </span>
                          </td>
                          <td className="font-semibold text-text-dark">{(item.price || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                          <td>{item.unitWeightGrams || 0}g ({item.netContentLabel || `${item.unitWeightGrams || 0}g`})</td>
                          <td><span className="badge gray">{baseRm ? baseRm.name : 'Insumo Base'}</span></td>
                          <td className="no-print" style={{ textAlign: 'right' }}>
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
                <option value="KG">Kilogramos (KG)</option>
                <option value="GR">Gramos (GR)</option>
                <option value="LTS">Litros (LTS)</option>
                <option value="UN">Unidades (UN)</option>
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
              <label>Categoría de Insumo *</label>
              <select {...pkgForm.register('category')}>
                <option value="DOYPACK">Bolsa Doypack con Cierre / Válvula</option>
                <option value="JAR">Frasco / Envase de Vidrio o Plástico</option>
                <option value="LABEL">Etiqueta Autoadhesiva / Térmica</option>
                <option value="BOX">Caja de Cartón / Embalaje</option>
                <option value="BAG">Bolsa de Vacío / Granel</option>
                <option value="OTHER">Otro Material Operativo</option>
              </select>
            </div>

            <div className="form-field">
              <label>Unidad de Medida *</label>
              <select {...pkgForm.register('unit')}>
                <option value="UN">Unidades (UN)</option>
                <option value="ROLL">Rollos (ROLL)</option>
                <option value="PACK">Paquetes (PACK)</option>
              </select>
            </div>
          </div>

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
      <Modal isOpen={isFinalModalOpen} onClose={() => { setIsFinalModalOpen(false); setEditingFinalItem(null); }} title={editingFinalItem ? "✏️ Editar Producto Elaborado Final" : "📦 Nuevo Producto Elaborado Final"} maxWidth="620px">
        <form onSubmit={finalForm.handleSubmit(onFinalSubmit)} className="flex flex-col gap-4">
          
          {/* Selector de Tipo de Producto (Monoproducto vs Blend/Mix) */}
          <div className="form-field">
            <label className="font-semibold text-text-dark mb-2 block">Tipo de Formulación de Producto *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`btn ${!isBlendProduct ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2 py-3`}
                onClick={() => setIsBlendProduct(false)}
              >
                <Package size={18} /> Monoproducto (1 Insumo Base)
              </button>
              <button
                type="button"
                className={`btn ${isBlendProduct ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2 py-3`}
                onClick={() => setIsBlendProduct(true)}
              >
                <Layers size={18} /> Blend / Mix (Varios Insumos)
              </button>
            </div>
          </div>

          {!isBlendProduct ? (
            <div className="form-field">
              <label>Materia Prima Base (Insumo Origen) *</label>
              <select {...finalForm.register('rawMaterialId')}>
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
                placeholder="Ej: Almendras Nonpareil 500g" 
                className={finalForm.formState.errors.name ? 'has-error' : ''} 
              />
              {finalForm.formState.errors.name && (
                <span className="field-error">{finalForm.formState.errors.name.message?.toString()}</span>
              )}
            </div>

            <div className="form-field">
              <label>Familia / Categoría</label>
              <select {...finalForm.register('familyId')}>
                <option value="">Seleccione una familia...</option>
                {finalFamilies.map((fam: any) => fam && (
                  <option key={fam.id} value={fam.id}>
                    {fam.parentName ? `${fam.parentName} > ${fam.name}` : fam.name} ({fam.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-field">
              <label>Precio de Venta ($) *</label>
              <input
                type="number"
                step="any"
                {...finalForm.register('price', { valueAsNumber: true })}
              />
            </div>
            <div className="form-field">
              <label>Peso Neto por Envase (Gramos) *</label>
              <input
                type="number"
                {...finalForm.register('unitWeightGrams', { valueAsNumber: true })}
              />
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
              {createFinal.isPending ? 'Guardando...' : 'Guardar Producto Final'}
            </button>
          </div>
        </form>
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
