import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Wand2, Package, Tag, Box, Pencil, Trash2, Layers } from 'lucide-react';
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
import { Modal } from '../components/ui/Modal';

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
  const [activeTab, setActiveTab] = useState<'raw' | 'pkg' | 'final'>('raw');
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [isFinalModalOpen, setIsFinalModalOpen] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'raw_materials' | 'final_products'>('raw_materials');

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

  const articleFamilies: any[] = Array.isArray(rawFamiliesData) 
    ? rawFamiliesData 
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);

  const getScope = (f: any) => f ? ((f.articleScope || f.scope || 'ALL') + '').toUpperCase() : 'ALL';

  const rawFamilies = articleFamilies.filter((f: any) => {
    const sc = getScope(f);
    return sc === 'RAW_MATERIAL' || sc === 'RAW' || sc === 'MATERIA PRIMA' || sc === 'ALL';
  });

  const pkgFamilies = articleFamilies.filter((f: any) => {
    const sc = getScope(f);
    return sc === 'PACKAGING' || sc === 'PKG' || sc === 'EMPAQUE' || sc === 'EMP' || sc === 'ALL';
  });

  const finalFamilies = articleFamilies.filter((f: any) => {
    const sc = getScope(f);
    return sc === 'FINAL_PRODUCT' || sc === 'FINAL' || sc === 'PRODUCTO FINAL' || sc === 'ALL';
  });

  const createRaw = useCreateRawMaterial();
  const updateRaw = useUpdateRawMaterial();

  const createPkg = useCreatePackagingMaterial();
  const updatePkg = useUpdatePackagingMaterial();

  const createFinal = useCreateFinalProduct();
  const updateFinal = useUpdateFinalProduct();

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
    const existingCount = (rawMaterials || []).filter(rm => rm.code.startsWith(`MP-${prefix}`)).length + 1;
    const num = existingCount.toString().padStart(2, '0');
    return `MP-${prefix}-${num}`;
  };

  const generatePkgCode = (name: string) => {
    if (!name || name.trim().length === 0) return 'ENV-PK-01';
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3).padEnd(3, 'X');
    const existingCount = (packagingMaterials || []).filter(pm => pm.code.startsWith(`ENV-${prefix}`)).length + 1;
    const num = existingCount.toString().padStart(2, '0');
    return `ENV-${prefix}-${num}`;
  };

  const generateFinalCode = (name: string) => {
    if (!name || name.trim().length === 0) return 'PF-PROD-01';
    const clean = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const prefix = clean.slice(0, 3).padEnd(3, 'X');
    const existingCount = (finalProducts || []).filter(fp => fp.code.startsWith(`PF-${prefix}`)).length + 1;
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
      ? blendIngredients.filter(ing => ing.rawMaterialId).map(ing => {
          const rm = (rawMaterials || []).find(r => r.id === ing.rawMaterialId);
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
    ...masterSuppliers.map(s => s.name || s.businessName).filter(Boolean),
    ...defaultSupplierNames,
    ...(rawMaterials || []).map(rm => rm.supplierName).filter(Boolean),
    ...(packagingMaterials || []).map(pm => pm.supplierName).filter(Boolean)
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
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {activeTab === 'raw' 
              ? 'Listado de Materias Primas' 
              : activeTab === 'pkg' 
              ? 'Listado de Materiales de Empaque & Etiquetas' 
              : 'Listado de Productos Finales'}
          </h2>
          <div className="flex gap-2">
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
                  { rawMaterialId: rawMaterials && rawMaterials.length > 0 ? rawMaterials[0].id : '', percentage: 50 },
                  { rawMaterialId: rawMaterials && rawMaterials.length > 1 ? rawMaterials[1].id : '', percentage: 50 },
                ]);
                finalForm.reset({
                  rawMaterialId: rawMaterials && rawMaterials.length > 0 ? rawMaterials[0].id : '',
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
        </div>
      </div>

        {/* Tab 1: Materias Primas */}
        {activeTab === 'raw' && (
          <div>
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
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rawMaterials || []).map((item) => {
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
                          <td style={{ textAlign: 'right' }}>
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
                    {(!rawMaterials || rawMaterials.length === 0) && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-text-muted">
                          No hay materias primas registradas
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
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packagingMaterials?.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold text-primary-sage">{item.code}</td>
                        <td className="font-medium">{item.name}</td>
                        <td>
                          <span className="badge gray text-xs">{getCategoryBadgeLabel(item.category)}</span>
                        </td>
                        <td><span className="badge gray">{item.familyName || articleFamilies.find(f => f.id === item.familyId || f.id === (item as any).articleFamilyId)?.name || 'Sin familia'}</span></td>
                        <td>
                          <span className={item.currentStock <= item.minStock ? 'text-terracotta font-bold' : ''}>
                            {item.currentStock} {item.unit || 'UN'}
                          </span>
                        </td>
                        <td className="font-semibold text-text-dark">
                          {(item.costPerUnit || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </td>
                        <td><span className="badge gray">{item.supplierName || 'Sin asignar'}</span></td>
                        <td className="text-sm text-text-muted">{item.storageLocation || 'Depósito C'}</td>
                        <td style={{ textAlign: 'right' }}>
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
                    ))}
                    {packagingMaterials?.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-text-muted">
                          No hay materiales de empaque o etiquetas registrados
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
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(finalProducts || []).map((item) => {
                      if (!item) return null;
                      const baseRm = (rawMaterials || []).find(rm => rm && rm.id === item.rawMaterialId);
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
                          <td style={{ textAlign: 'right' }}>
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
                    {(!finalProducts || finalProducts.length === 0) && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-text-muted">
                          No hay productos finales registrados
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
                {rawFamilies.map((fam: any) => (
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
                {pkgFamilies.map((fam: any) => (
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
                {rawMaterials?.map(rm => (
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
                      {rawMaterials?.map(rm => (
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
                {finalFamilies.map((fam: any) => (
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

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        type={bulkImportType}
        onSuccess={() => {
          // Refetch stock lists
          window.location.reload();
        }}
      />
    </div>
  );
};
