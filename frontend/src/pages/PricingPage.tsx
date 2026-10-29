import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  usePricingStructures, 
  useSavePricingStructure, 
  useAllocateFixedCosts 
} from '../hooks/usePricing';
import { useFinalProducts, useRawMaterials } from '../hooks/useInventory';
import { usePackagingMaterials } from '../hooks/usePackaging';
import { useArticleFamilies } from '../hooks/useArticleFamilies';
import { useMerchandiseReceipts } from '../hooks/useReceipts';
import { useSettings } from '../hooks/useSettings';
import { Modal } from '../components/ui/Modal';
import { PriceListGeneratorModal } from '../components/pricing/PriceListGeneratorModal';
import { PricingStructure } from '../api/pricing';
import { 
  Calculator, 
  Settings, 
  RefreshCw, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Layers, 
  CheckSquare, 
  Square, 
  Printer, 
  FileText, 
  Gift, 
  Tag, 
  Package, 
  ArrowRight, 
  Info 
} from 'lucide-react';

interface PricingPageProps {
  onTabChange?: (tab: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setSelectedProductPricing] = useState<PricingStructure | null>(null);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string>('');
  const [selectedPackagingIds, setSelectedPackagingIds] = useState<string[]>([]);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switches explícitos en el modal para evitar cualquier número oculto
  const [includePackaging, setIncludePackaging] = useState<boolean>(true);
  const [includeLabor, setIncludeLabor] = useState<boolean>(false);
  const [includeFixedCosts, setIncludeFixedCosts] = useState<boolean>(false);
  const [includeTaxesAndCommissions, setIncludeTaxesAndCommissions] = useState<boolean>(false);

  // Filtros de la tabla principal de Precios y Costos
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ELABORATED' | 'RESALE' | 'PACK'>('ALL');

  const { data: pricingData, isLoading: loadingPricing, isError: errorPricing, refetch } = usePricingStructures();
  const { data: finalProducts, isLoading: loadingProducts, refetch: refetchProducts } = useFinalProducts();
  const { data: rawMaterials } = useRawMaterials();
  const { data: packagingMaterials } = usePackagingMaterials();
  const { data: rawFamiliesData } = useArticleFamilies();
  const { data: receiptsData } = useMerchandiseReceipts();
  const { data: settingsData } = useSettings();

  const familiesList: any[] = Array.isArray(rawFamiliesData)
    ? rawFamiliesData
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);

  const receiptsList: any[] = Array.isArray(receiptsData) ? receiptsData : [];

  const savePricing = useSavePricingStructure();
  const allocateFixed = useAllocateFixedCosts();

  const formatCurrency = (val?: number) =>
    Math.round(Number(val) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  const pricingList: PricingStructure[] = Array.isArray(pricingData) ? pricingData : [];
  const products: any[] = Array.isArray(finalProducts) ? finalProducts : [];
  const raws: any[] = Array.isArray(rawMaterials) ? rawMaterials : [];
  const pkgs: any[] = Array.isArray(packagingMaterials) ? packagingMaterials : [];

  const isProductPack = (fp: any): boolean => {
    if (!fp) return false;
    if (fp.isPack) return true;
    if (Array.isArray(fp.ingredientsList) && fp.ingredientsList.some((ing: any) => Boolean(ing?.isPackItem) || (ing?.quantity !== undefined && Number(ing?.quantity) > 0 && !ing?.percentage))) {
      return true;
    }
    return false;
  };

  const getFamilyDisplayLabel = (item: any) => {
    const famId = item?.familyId || item?.articleFamilyId;
    const famObj = familiesList.find((f: any) => f && f.id === famId);
    if (famObj) {
      if (famObj.parentId) {
        const parentObj = familiesList.find((p: any) => p && p.id === famObj.parentId);
        const pName = famObj.parentName || parentObj?.name;
        return pName ? `${pName} › ${famObj.name}` : famObj.name;
      }
      return famObj.name;
    }
    return item?.familyName || 'Sin familia';
  };

  const matchesFamilyOrSubfamily = (itemFamId: string | undefined, selectedFilterId: string) => {
    if (!selectedFilterId) return true;
    if (!itemFamId) return false;
    if (itemFamId === selectedFilterId) return true;
    const famObj = familiesList.find((f: any) => f && f.id === itemFamId);
    return Boolean(famObj && famObj.parentId === selectedFilterId);
  };

  // Combinar el catálogo de productos finales con la estructura de precios cargada
  const combinedList = products.map(fp => {
    const p = pricingList.find(item => item.productId === fp.id || item.productSku === fp.code);
    return {
      finalProduct: fp,
      pricingStructure: p || null
    };
  });

  const fallbackList = pricingList.map(p => ({
    finalProduct: {
      id: p.productId,
      code: p.productSku || 'SKU',
      name: p.productName || 'Producto',
      price: p.channels?.mostrador?.finalPrice || 0
    },
    pricingStructure: p
  }));

  const rawDisplayList = combinedList.length > 0 ? combinedList : fallbackList;

  const displayList = rawDisplayList.filter(({ finalProduct: fp }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (fp.name || '').toLowerCase().includes(q);
      const matchCode = (fp.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (familyFilter && !matchesFamilyOrSubfamily(fp.familyId || fp.articleFamilyId, familyFilter)) {
      return false;
    }
    const isPack = isProductPack(fp);
    const isResale = Boolean(fp.isResale) && !isPack;
    if (typeFilter === 'PACK' && !isPack) return false;
    if (typeFilter === 'RESALE' && !isResale) return false;
    if (typeFilter === 'ELABORATED' && (isResale || isPack)) return false;
    return true;
  });

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      productId: '',
      productSku: '',
      productName: '',
      unitOfMeasure: 'unidades',
      rawMaterialCost: 0,
      packagingLabelCost: 0,
      laborCost: 0,
      allocatedFixedCosts: 0,
      taxPercentage: 0,
      mostradorCommissionPct: 0,
      mostradorMarginPct: 50,
      mostradorFinalPrice: 0,
      whatsappCommissionPct: 0,
      whatsappMarginPct: 45,
      whatsappFinalPrice: 0,
      onlineCommissionPct: 0,
      onlineMarginPct: 40,
      onlineFinalPrice: 0,
    }
  });

  const watchedProductId = watch('productId');
  const currentModalFp = products.find(p => p.id === watchedProductId);

  const watchedRawCost = Number(watch('rawMaterialCost')) || 0;
  const watchedPackCost = includePackaging ? (Number(watch('packagingLabelCost')) || 0) : 0;
  const watchedLaborCost = includeLabor ? (Number(watch('laborCost')) || 0) : 0;
  const watchedFixedCost = includeFixedCosts ? (Number(watch('allocatedFixedCosts')) || 0) : 0;
  const watchedTaxPct = includeTaxesAndCommissions ? (Number(watch('taxPercentage')) || 0) : 0;

  const totalDirectCost = watchedRawCost + watchedPackCost + watchedLaborCost;
  const totalUnitCost = totalDirectCost + watchedFixedCost;

  // Buscar el último comprobante de compra (Recepción de Mercadería) para trazabilidad real del costo
  const findLastPurchaseReceipt = (fp: any, rmId?: string) => {
    if (!fp && !rmId) return null;
    const targetIds = [fp?.id, fp?.rawMaterialId, rmId].filter(Boolean);
    const targetNames = [fp?.name, raws.find(r => r.id === (rmId || fp?.rawMaterialId))?.name]
      .filter(Boolean)
      .map((n: string) => n.toLowerCase().trim());

    for (const rec of receiptsList) {
      if (!Array.isArray(rec.items)) continue;
      const matchedItem = rec.items.find((it: any) => {
        if (it.productId && targetIds.includes(it.productId)) return true;
        if (it.itemName && targetNames.includes(String(it.itemName).toLowerCase().trim())) return true;
        return false;
      });
      if (matchedItem) {
        return {
          receiptNumber: rec.receiptNumber || `REC-${String(rec.id).slice(0, 6)}`,
          supplierName: rec.supplierName || fp?.supplierName || 'Proveedor registrado',
          date: rec.receptionDate || rec.receiptDate || rec.createdAt,
          unitCost: Number(matchedItem.unitCost) || 0,
          unitOfMeasure: matchedItem.unitOfMeasure || 'UND',
          quantity: matchedItem.quantity || 1,
          itemName: matchedItem.itemName
        };
      }
    }
    return null;
  };

  // Cálculo con detalle exacto paso a paso de conversión de unidades
  const calcRawCostBreakdown = (fp: any, rm: any) => {
    if (!rm) return { cost: 0, formulaText: 'Sin materia prima base seleccionada', factor: 1 };
    const norm = (u?: string) => {
      const c = (u || '').trim().toUpperCase();
      if (c === 'G' || c === 'GR' || c === 'GRS') return 'GRS';
      if (c === 'KG' || c === 'KGS') return 'KG';
      if (c === 'ML' || c === 'CM3' || c === 'CC') return 'ML';
      if (c === 'L' || c === 'LT' || c === 'LTS') return 'LTS';
      if (c === 'UN' || c === 'UND' || c === 'UNI' || c === 'UNIDADES') return 'UND';
      return c || 'GRS';
    };
    const rawU = norm(rm.unit || 'KG');
    const prodU = norm(fp?.unit || 'GRS');
    const amt = Number(fp?.unitWeightGrams) || 500;
    const rawCostPerUnit = Number(rm.costPerUnit) || 0;

    let factor = amt / 1000;
    let explanation = '';
    if (rawU === prodU) {
      factor = amt;
      explanation = `$${rawCostPerUnit.toLocaleString('es-AR')} / ${rawU} × ${amt} ${prodU}`;
    } else if ((rawU === 'KG' && prodU === 'GRS') || (rawU === 'LTS' && prodU === 'ML')) {
      factor = amt / 1000;
      explanation = `$${rawCostPerUnit.toLocaleString('es-AR')} por ${rawU} (÷ 1.000 = $${(rawCostPerUnit / 1000).toFixed(2)}/${prodU.toLowerCase()}) × ${amt} ${prodU.toLowerCase()}`;
    } else if ((rawU === 'GRS' && prodU === 'KG') || (rawU === 'ML' && prodU === 'LTS')) {
      factor = amt * 1000;
      explanation = `$${rawCostPerUnit.toLocaleString('es-AR')} por ${rawU} × 1.000 × ${amt} ${prodU}`;
    } else {
      factor = amt >= 10 ? amt / 1000 : amt;
      explanation = `$${rawCostPerUnit.toLocaleString('es-AR')} (${rawU}) × factor ${factor} (${amt} ${prodU})`;
    }

    const cost = Math.round(factor * rawCostPerUnit);
    return {
      cost,
      formulaText: `${explanation} = $${cost.toLocaleString('es-AR')}`,
      factor
    };
  };

  const calcRawCostWithUnits = (fp: any, rm: any): number => {
    return calcRawCostBreakdown(fp, rm).cost;
  };

  // Helper para calcular métricas paso a paso por canal (Recargo directo sobre Costo + Bidireccional)
  const calcChannelMetrics = (commPctInput: number, markupPctInput: number, customFinalPriceInput: number) => {
    const commPct = includeTaxesAndCommissions ? (Number(commPctInput) || 0) : 0;
    const markupPct = Number(markupPctInput) || 0;
    const customFinalPrice = Number(customFinalPriceInput) || 0;

    // 1. Ganancia deseada aplicando Recargo directo sobre el Costo Unitario Total
    const desiredProfitFromMarkup = Math.round(totalUnitCost * (markupPct / 100));
    const baseWithMarkup = totalUnitCost + desiredProfitFromMarkup;

    // 2. Si el usuario activó Impuestos o Comisiones explícitamente:
    const deductionsRatio = (watchedTaxPct + commPct) / 100;
    let suggested = baseWithMarkup;
    if (deductionsRatio > 0 && deductionsRatio < 1) {
      suggested = Math.round(baseWithMarkup / (1 - deductionsRatio));
    } else if (deductionsRatio >= 1) {
      suggested = Math.round(baseWithMarkup * (1 + deductionsRatio));
    }

    const finalPrice = customFinalPrice > 0 ? Math.round(customFinalPrice) : suggested;
    const commDeduction = Math.round(finalPrice * (commPct / 100));
    const taxDeduction = Math.round(finalPrice * (watchedTaxPct / 100));
    const totalDeductions = commDeduction + taxDeduction;

    const profit = finalPrice - (totalUnitCost + totalDeductions);
    // % de Recargo Real sobre el Costo Total (ej: Costo $1.000 -> Ganancia $500 = +50% s/costo)
    const realMarkupOverCost = totalUnitCost > 0 ? (profit / totalUnitCost) * 100 : 0;
    // % que representa la ganancia sobre el Precio Final de Venta
    const realMarginOverSale = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

    return {
      suggested,
      finalPrice,
      desiredProfitFromMarkup,
      commDeduction,
      taxDeduction,
      totalDeductions,
      profit,
      realMarkupOverCost,
      realMarginOverSale
    };
  };

  const mostradorCalc = calcChannelMetrics(watch('mostradorCommissionPct'), watch('mostradorMarginPct'), watch('mostradorFinalPrice'));
  const whatsappCalc = calcChannelMetrics(watch('whatsappCommissionPct'), watch('whatsappMarginPct'), watch('whatsappFinalPrice'));
  const onlineCalc = calcChannelMetrics(watch('onlineCommissionPct'), watch('onlineMarginPct'), watch('onlineFinalPrice'));

  const handleOpenConfigModal = (p?: PricingStructure | null, fpFallback?: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const matchedFp = fpFallback || (p ? products.find(prod => prod.id === p.productId || prod.code === p.productSku) : null);
    const isPack = isProductPack(matchedFp);
    const isResale = Boolean(matchedFp?.isResale) && !isPack;
    const baseRm = matchedFp ? raws.find(rm => rm.id === matchedFp.rawMaterialId) : null;

    // 1. Calcular el costo de compra / insumo base real sin números ocultos
    let calculatedRawCost = p?.rawMaterialCost || 0;
    if (!calculatedRawCost && matchedFp) {
      if (isPack && Array.isArray(matchedFp.ingredientsList) && matchedFp.ingredientsList.length > 0) {
        calculatedRawCost = matchedFp.ingredientsList.reduce(
          (sum: number, ing: any) => sum + ((Number(ing.quantity) || 1) * (Number(ing.unitCost) || 0)),
          0
        );
        if (!calculatedRawCost && matchedFp.costPrice) {
          calculatedRawCost = Math.round(Number(matchedFp.costPrice));
        }
      } else if (isResale) {
        calculatedRawCost = Math.round(
          Number(matchedFp.costPrice) ||
          Number(baseRm?.costPerUnit) ||
          0
        );
      } else if (matchedFp.isBlend && Array.isArray(matchedFp.ingredientsList) && matchedFp.ingredientsList.length > 0) {
        const totalGrams = Number(matchedFp.unitWeightGrams) || 500;
        calculatedRawCost = Math.round(
          matchedFp.ingredientsList.reduce((sum: number, ing: any) => {
            const rmItem = raws.find(r => r.id === ing.rawMaterialId);
            const pct = (Number(ing.percentage) || 0) / 100;
            const costKg = Number(rmItem?.costPerUnit) || 0;
            return sum + (costKg * (totalGrams / 1000) * pct);
          }, 0)
        );
      } else if (baseRm) {
        calculatedRawCost = calcRawCostWithUnits(matchedFp, baseRm);
      } else if (matchedFp.costPrice) {
        calculatedRawCost = Math.round(Number(matchedFp.costPrice));
      }
    }

    // 2. Empaque: En Reventa o Pack es $0 por defecto salvo que ya tuviera uno guardado
    const defaultPkgs = (isResale || isPack) ? [] : pkgs.filter(pkg => pkg.category === 'DOYPACK' || pkg.category === 'LABEL');
    const initialPkgIds = defaultPkgs.map(item => item.id);
    const calculatedPkgCost = p?.packagingLabelCost !== undefined
      ? Number(p.packagingLabelCost)
      : ((isResale || isPack) ? 0 : defaultPkgs.reduce((sum, item) => sum + (Number(item.costPerUnit) || 0), 0));

    const existingLaborCost = p?.laborCost !== undefined ? Number(p.laborCost) : 0;
    const existingFixedCost = p?.allocatedFixedCosts !== undefined ? Number(p.allocatedFixedCosts) : 0;
    const existingTaxPct = p?.taxPercentage !== undefined ? Number(p.taxPercentage) : 0;

    // Activar switches solo si realmente tienen valores > 0 (o empaque en elaborados)
    setIncludePackaging(calculatedPkgCost > 0 || (!isResale && !isPack));
    setIncludeLabor(existingLaborCost > 0);
    setIncludeFixedCosts(existingFixedCost > 0);
    setIncludeTaxesAndCommissions(existingTaxPct > 0);

    setSelectedRawMaterialId(baseRm ? baseRm.id : '');
    setSelectedPackagingIds(initialPkgIds);

    const activeUnitCost =
      calculatedRawCost +
      ((calculatedPkgCost > 0 || (!isResale && !isPack)) ? calculatedPkgCost : 0) +
      existingLaborCost +
      existingFixedCost;

    // Si el producto ya tiene un precio de venta cargado, calcular qué % de recargo sobre costo representa
    const currentMostradorPrice = p?.channels?.mostrador?.finalPrice || Number(matchedFp?.price) || 0;
    const inferredMarkup = (activeUnitCost > 0 && currentMostradorPrice > 0)
      ? Number((((currentMostradorPrice - activeUnitCost) / activeUnitCost) * 100).toFixed(1))
      : (p?.channels?.mostrador?.marginPercentage || 50);

    if (p) {
      setSelectedProductPricing(p);
      reset({
        productId: p.productId,
        productSku: p.productSku || matchedFp?.code || '',
        productName: p.productName || matchedFp?.name || '',
        unitOfMeasure: p.unitOfMeasure || 'unidades',
        rawMaterialCost: calculatedRawCost,
        packagingLabelCost: calculatedPkgCost,
        laborCost: existingLaborCost,
        allocatedFixedCosts: existingFixedCost,
        taxPercentage: existingTaxPct,
        mostradorCommissionPct: p.channels?.mostrador?.commissionPercentage || 0,
        mostradorMarginPct: p.channels?.mostrador?.marginPercentage || inferredMarkup,
        mostradorFinalPrice: currentMostradorPrice,
        whatsappCommissionPct: p.channels?.whatsapp?.commissionPercentage || 0,
        whatsappMarginPct: p.channels?.whatsapp?.marginPercentage || Math.max(0, inferredMarkup - 5),
        whatsappFinalPrice: p.channels?.whatsapp?.finalPrice || currentMostradorPrice,
        onlineCommissionPct: p.channels?.tiendaOnline?.commissionPercentage || 0,
        onlineMarginPct: p.channels?.tiendaOnline?.marginPercentage || Math.max(0, inferredMarkup - 5),
        onlineFinalPrice: p.channels?.tiendaOnline?.finalPrice || currentMostradorPrice,
      });
    } else if (matchedFp) {
      setSelectedProductPricing(null);
      const defaultSalePrice = currentMostradorPrice > 0
        ? currentMostradorPrice
        : Math.round(activeUnitCost * (1 + inferredMarkup / 100));
      reset({
        productId: matchedFp.id,
        productSku: matchedFp.code || '',
        productName: matchedFp.name || '',
        unitOfMeasure: 'unidades',
        rawMaterialCost: calculatedRawCost,
        packagingLabelCost: calculatedPkgCost,
        laborCost: 0,
        allocatedFixedCosts: 0,
        taxPercentage: 0,
        mostradorCommissionPct: 0,
        mostradorMarginPct: inferredMarkup,
        mostradorFinalPrice: defaultSalePrice,
        whatsappCommissionPct: 0,
        whatsappMarginPct: inferredMarkup,
        whatsappFinalPrice: defaultSalePrice,
        onlineCommissionPct: 0,
        onlineMarginPct: inferredMarkup,
        onlineFinalPrice: defaultSalePrice,
      });
    } else {
      setSelectedProductPricing(null);
      const defaultProd = products[0];
      reset({
        productId: defaultProd?.id || '',
        productSku: defaultProd?.code || '',
        productName: defaultProd?.name || '',
        unitOfMeasure: 'unidades',
        rawMaterialCost: Number(defaultProd?.costPrice) || 1000,
        packagingLabelCost: 0,
        laborCost: 0,
        allocatedFixedCosts: 0,
        taxPercentage: 0,
        mostradorCommissionPct: 0,
        mostradorMarginPct: 50,
        mostradorFinalPrice: Number(defaultProd?.price) || 1500,
        whatsappCommissionPct: 0,
        whatsappMarginPct: 50,
        whatsappFinalPrice: Number(defaultProd?.price) || 1500,
        onlineCommissionPct: 0,
        onlineMarginPct: 50,
        onlineFinalPrice: Number(defaultProd?.price) || 1500,
      });
    }
    setIsModalOpen(true);
  };

  // Recalcular precios sugeridos cuando cambia el costo base en vivo
  const syncChannelPricesWithNewCost = (newTotalUnitCost: number) => {
    const mPct = Number(watch('mostradorMarginPct')) || 0;
    const wPct = Number(watch('whatsappMarginPct')) || 0;
    const oPct = Number(watch('onlineMarginPct')) || 0;
    setValue('mostradorFinalPrice', Math.round(newTotalUnitCost * (1 + mPct / 100)));
    setValue('whatsappFinalPrice', Math.round(newTotalUnitCost * (1 + wPct / 100)));
    setValue('onlineFinalPrice', Math.round(newTotalUnitCost * (1 + oPct / 100)));
  };

  const togglePackagingSelection = (id: string) => {
    let updated: string[];
    if (selectedPackagingIds.includes(id)) {
      updated = selectedPackagingIds.filter(item => item !== id);
    } else {
      updated = [...selectedPackagingIds, id];
    }
    setSelectedPackagingIds(updated);

    const totalCost = updated.reduce((sum, pkgId) => {
      const item = pkgs.find(p => p.id === pkgId);
      return sum + (item ? Number(item.costPerUnit) || 0 : 0);
    }, 0);

    setIncludePackaging(true);
    setValue('packagingLabelCost', totalCost);
  };

  const onSubmitSave = (formData: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const effectivePkgCost = includePackaging ? Number(formData.packagingLabelCost || 0) : 0;
    const effectiveLaborCost = includeLabor ? Number(formData.laborCost || 0) : 0;
    const effectiveFixedCost = includeFixedCosts ? Number(formData.allocatedFixedCosts || 0) : 0;
    const effectiveTaxPct = includeTaxesAndCommissions ? Number(formData.taxPercentage || 0) : 0;

    const dto = {
      productId: formData.productId,
      productSku: formData.productSku,
      productName: formData.productName,
      unitOfMeasure: formData.unitOfMeasure,
      rawMaterialCost: Number(formData.rawMaterialCost || 0),
      packagingLabelCost: effectivePkgCost,
      laborCost: effectiveLaborCost,
      allocatedFixedCosts: effectiveFixedCost,
      taxPercentage: effectiveTaxPct,
      channels: {
        mostrador: {
          commissionPercentage: includeTaxesAndCommissions ? Number(formData.mostradorCommissionPct || 0) : 0,
          marginPercentage: Number(formData.mostradorMarginPct || 0),
          finalPrice: Number(formData.mostradorFinalPrice) > 0 ? Number(formData.mostradorFinalPrice) : mostradorCalc.suggested
        },
        whatsapp: {
          commissionPercentage: includeTaxesAndCommissions ? Number(formData.whatsappCommissionPct || 0) : 0,
          marginPercentage: Number(formData.whatsappMarginPct || 0),
          finalPrice: Number(formData.whatsappFinalPrice) > 0 ? Number(formData.whatsappFinalPrice) : whatsappCalc.suggested
        },
        tiendaOnline: {
          commissionPercentage: includeTaxesAndCommissions ? Number(formData.onlineCommissionPct || 0) : 0,
          marginPercentage: Number(formData.onlineMarginPct || 0),
          finalPrice: Number(formData.onlineFinalPrice) > 0 ? Number(formData.onlineFinalPrice) : onlineCalc.suggested
        }
      }
    };

    savePricing.mutate(dto, {
      onSuccess: () => {
        setSuccessMsg('✅ Estructura de costos y precios guardada y sincronizada con el catálogo.');
        setIsModalOpen(false);
        refetch();
        refetchProducts();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar la estructura de precios.');
      }
    });
  };

  const handleAllocateFixedCosts = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    allocateFixed.mutate({}, {
      onSuccess: (data: any) => {
        setSuccessMsg(`✅ Prorrateo completado: $${data?.allocatedFixedCostPerUnit || 0} asignados por unidad.`);
        refetch();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al prorratear costos fijos.');
      }
    });
  };

  // KPIs de Márgenes Promedio
  const avgMostradorMargin = pricingList.length > 0 
    ? (pricingList.reduce((acc, p) => acc + (p.channels?.mostrador?.marginPercentage || 0), 0) / pricingList.length).toFixed(1)
    : '50.0';
  const avgWhatsappMargin = pricingList.length > 0 
    ? (pricingList.reduce((acc, p) => acc + (p.channels?.whatsapp?.marginPercentage || 0), 0) / pricingList.length).toFixed(1)
    : '45.0';
  const avgOnlineMargin = pricingList.length > 0 
    ? (pricingList.reduce((acc, p) => acc + (p.channels?.tiendaOnline?.marginPercentage || 0), 0) / pricingList.length).toFixed(1)
    : '40.0';

  // Datos para el Escalón 1 en el modal
  const selectedRmObj = raws.find(r => r.id === (selectedRawMaterialId || currentModalFp?.rawMaterialId));
  const lastPurchaseReceipt = findLastPurchaseReceipt(currentModalFp, selectedRawMaterialId);
  const isCurrentModalPack = isProductPack(currentModalFp);
  const isCurrentModalResale = Boolean(currentModalFp?.isResale) && !isCurrentModalPack;
  const isCurrentModalBlend = Boolean(currentModalFp?.isBlend) && !isCurrentModalPack && !isCurrentModalResale;
  const rawBreakdown = (!isCurrentModalPack && !isCurrentModalResale && selectedRmObj)
    ? calcRawCostBreakdown(currentModalFp, selectedRmObj)
    : null;

  // Renderizador de barra visual "¿A dónde va cada peso del precio final?"
  const renderPriceBreakdownBar = (calc: ReturnType<typeof calcChannelMetrics>) => {
    const finalP = Math.max(1, calc.finalPrice);
    const rawPct = Math.min(100, Math.max(0, (watchedRawCost / finalP) * 100));
    const extrasCost = watchedPackCost + watchedLaborCost + watchedFixedCost;
    const extrasPct = Math.min(100 - rawPct, Math.max(0, (extrasCost / finalP) * 100));
    const taxCommPct = Math.min(100 - rawPct - extrasPct, Math.max(0, (calc.totalDeductions / finalP) * 100));
    const profitPct = Math.max(0, 100 - rawPct - extrasPct - taxCommPct);

    return (
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center text-[11px] mb-1">
          <span className="text-text-muted font-medium">
            Fórmula: <strong>{formatCurrency(totalUnitCost)}</strong> (Costo) + <strong>{formatCurrency(calc.profit)}</strong> (Ganancia {calc.realMarkupOverCost >= 0 ? `+${calc.realMarkupOverCost.toFixed(1)}%` : `${calc.realMarkupOverCost.toFixed(1)}%`} s/costo)
            {calc.totalDeductions > 0 ? ` + ${formatCurrency(calc.totalDeductions)} (Imp./Com.)` : ''} = <strong>{formatCurrency(calc.finalPrice)}</strong>
          </span>
          <span className={`font-bold ${calc.profit > 0 ? 'text-primary-sage' : 'text-terracotta'}`}>
            En mano: {formatCurrency(calc.profit)} ({calc.realMarginOverSale.toFixed(1)}% del precio)
          </span>
        </div>

        {/* Barra segmentada proporcional */}
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex border border-gray-200" title="Distribución de cada peso del precio de venta">
          {rawPct > 0 && (
            <div
              style={{ width: `${rawPct}%`, backgroundColor: '#D97706' }}
              title={`Costo Producto/MP: ${formatCurrency(watchedRawCost)} (${rawPct.toFixed(0)}%)`}
            />
          )}
          {extrasPct > 0 && (
            <div
              style={{ width: `${extrasPct}%`, backgroundColor: '#3B82F6' }}
              title={`Empaque / M. Obra / Fijos: ${formatCurrency(extrasCost)} (${extrasPct.toFixed(0)}%)`}
            />
          )}
          {taxCommPct > 0 && (
            <div
              style={{ width: `${taxCommPct}%`, backgroundColor: '#F59E0B' }}
              title={`Impuestos y Comisiones: ${formatCurrency(calc.totalDeductions)} (${taxCommPct.toFixed(0)}%)`}
            />
          )}
          {profitPct > 0 && (
            <div
              style={{ width: `${profitPct}%`, backgroundColor: '#2E5339' }}
              title={`Tu Ganancia Neta: ${formatCurrency(calc.profit)} (${profitPct.toFixed(0)}%)`}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#D97706' }} />
            Costo Compra/Insumos: <strong>{formatCurrency(watchedRawCost)}</strong> ({rawPct.toFixed(0)}%)
          </span>
          {extrasCost > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3B82F6' }} />
              Empaque/M.Obra/Fijos: <strong>{formatCurrency(extrasCost)}</strong> ({extrasPct.toFixed(0)}%)
            </span>
          )}
          {calc.totalDeductions > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#F59E0B' }} />
              Impuestos/Comisión: <strong>{formatCurrency(calc.totalDeductions)}</strong> ({taxCommPct.toFixed(0)}%)
            </span>
          )}
          <span className="flex items-center gap-1 text-primary-sage font-semibold">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#2E5339' }} />
            Ganancia Limpia: <strong>{formatCurrency(calc.profit)}</strong> ({profitPct.toFixed(0)}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <Calculator className="text-primary-sage" />
            Estructura de Precios & Costos
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Constitución transparente paso a paso desde el costo de compra hasta el precio final de venta
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPriceListModalOpen(true)} 
            className="btn btn-secondary flex items-center gap-1.5"
            style={{ borderColor: '#2E5339', color: '#2E5339', backgroundColor: '#E9EFEA', fontWeight: 600 }}
            title="Generar catálogo y lista de precios editable con logo profesional"
          >
            <Printer size={16} />
            📋 Generar Lista de Precios PDF
          </button>
          <button onClick={handleAllocateFixedCosts} className="btn btn-secondary flex items-center gap-2" disabled={allocateFixed.isPending}>
            <RefreshCw size={16} className={allocateFixed.isPending ? 'animate-spin' : ''} />
            Prorratear Costos Fijos
          </button>
          <button onClick={() => handleOpenConfigModal()} className="btn btn-primary flex items-center gap-2">
            <Settings size={16} />
            Simulador de Precios & Costos
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 text-green-800 text-sm rounded mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-terracotta text-sm rounded mb-4 flex items-center gap-2">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Tarjetas KPI Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Recargo Promedio Mostrador</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-primary-sage mt-2">+{avgMostradorMargin}%</div>
          <div className="text-xs text-text-muted mt-1">Venta presencial en sucursal</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Recargo Promedio WhatsApp</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-text-dark mt-2">+{avgWhatsappMargin}%</div>
          <div className="text-xs text-text-muted mt-1">Venta por chat y pedidos directos</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Recargo Promedio Tienda Online</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-primary-sage mt-2">+{avgOnlineMargin}%</div>
          <div className="text-xs text-text-muted mt-1">E-commerce e integración pasarelas</div>
        </div>
      </div>

      {/* Tabla Principal de Precios por Producto */}
      <div className="card">
        <div className="card-header mb-4 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-text-dark">Listado de Precios y Costos por Producto</h2>
          <span className="badge gray text-xs font-semibold">{displayList.length} productos listados</span>
        </div>

        {/* Barra de Filtros por Búsqueda, Familia/Subfamilia y Tipo */}
        <div className="bg-bg-linen p-3 rounded mb-4 border flex flex-wrap gap-3 items-end">
          <div className="flex-1" style={{ minWidth: '220px' }}>
            <label className="text-xs text-text-muted mb-1 block">Buscar Producto</label>
            <input
              type="text"
              placeholder="Buscar por nombre o código SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <label className="text-xs text-text-muted mb-1 block">Familia › Subfamilia</label>
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="w-full text-sm"
            >
              <option value="">Todas las familias</option>
              {familiesList.map((f: any) => f && (
                <option key={f.id} value={f.id}>
                  {f.parentId ? `— ${f.name} (${f.parentName || 'Sub'})` : f.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '180px' }}>
            <label className="text-xs text-text-muted mb-1 block">Tipo de Producto</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full text-sm font-medium"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="ELABORATED">🏭 Elaborados / Fraccionados</option>
              <option value="RESALE">🛍️ Productos de Reventa</option>
              <option value="PACK">🎁 Packs / Combos</option>
            </select>
          </div>
          {(searchQuery || familyFilter || typeFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setFamilyFilter('');
                setTypeFilter('ALL');
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {loadingPricing || loadingProducts ? (
          <div className="py-8 text-center text-text-muted">Cargando catálogo de productos y precios...</div>
        ) : errorPricing ? (
          <div className="py-8 text-center text-terracotta">
            Error al consultar estructuras de precios.{' '}
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Producto / Familia</th>
                  <th className="text-right">Costo Compra / MP</th>
                  <th className="text-right">Costo Total Unit.</th>
                  <th className="text-right">Precio Mostrador</th>
                  <th className="text-right">Ganancia Limpia ($)</th>
                  <th className="text-right">WhatsApp / Online</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(({ finalProduct: fp, pricingStructure: p }) => {
                  const isConfigured = !!p;
                  const isPack = isProductPack(fp);
                  const isResale = Boolean(fp.isResale) && !isPack;
                  const baseRm = raws.find(r => r.id === fp.rawMaterialId);

                  // Calcular costo base aunque aún no tenga estructura guardada
                  const fallbackRawCost = isPack
                    ? (Number(fp.costPrice) || (Array.isArray(fp.ingredientsList) ? fp.ingredientsList.reduce((s: number, i: any) => s + ((Number(i.quantity) || 1) * (Number(i.unitCost) || 0)), 0) : 0))
                    : isResale
                    ? (Number(fp.costPrice) || Number(baseRm?.costPerUnit) || 0)
                    : (baseRm ? calcRawCostWithUnits(fp, baseRm) : (Number(fp.costPrice) || 0));

                  const rawCost = p ? Number(p.rawMaterialCost || 0) : fallbackRawCost;
                  const directCost = p 
                    ? (p.totalDirectCost !== undefined ? p.totalDirectCost : (p.rawMaterialCost + p.packagingLabelCost + p.laborCost)) 
                    : fallbackRawCost;

                  const totalCost = p 
                    ? (p.totalUnitCost !== undefined ? p.totalUnitCost : (directCost + p.allocatedFixedCosts)) 
                    : directCost;

                  const mostradorPrice = p 
                    ? (p.channels?.mostrador?.finalPrice || p.channels?.mostrador?.suggestedPrice || fp.price || 0) 
                    : (fp.price || 0);

                  const profitInHand = mostradorPrice - totalCost;
                  const markupOverCost = totalCost > 0 ? ((profitInHand / totalCost) * 100) : 0;

                  const whatsappPrice = p 
                    ? (p.channels?.whatsapp?.finalPrice || p.channels?.whatsapp?.suggestedPrice || mostradorPrice) 
                    : mostradorPrice;

                  const onlinePrice = p 
                    ? (p.channels?.tiendaOnline?.finalPrice || p.channels?.tiendaOnline?.suggestedPrice || mostradorPrice) 
                    : mostradorPrice;

                  return (
                    <tr key={fp.id}>
                      <td className="font-semibold text-text-dark">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{fp.name} <span className="text-xs text-text-muted font-normal">({fp.code})</span></span>
                            {isPack ? (
                              <span className="badge amber text-[10px]">🎁 Pack / Combo</span>
                            ) : isResale ? (
                              <span className="badge blue text-[10px]">🛍️ Reventa</span>
                            ) : fp.isBlend ? (
                              <span className="badge purple text-[10px]">📚 Blend</span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-text-muted font-normal">
                            {getFamilyDisplayLabel(fp)}
                          </span>
                        </div>
                      </td>
                      <td className="text-right font-medium">
                        {rawCost > 0 ? formatCurrency(rawCost) : <span className="text-xs text-text-muted">$0</span>}
                      </td>
                      <td className="text-right font-bold text-text-dark">
                        {totalCost > 0 ? formatCurrency(totalCost) : <span className="text-xs text-text-muted">Sin costo</span>}
                      </td>
                      <td className="text-right font-bold text-primary-sage">
                        {formatCurrency(mostradorPrice)}{' '}
                        {totalCost > 0 && (
                          <span className="text-xs font-normal text-text-muted block">
                            ({markupOverCost >= 0 ? `+${markupOverCost.toFixed(0)}%` : `${markupOverCost.toFixed(0)}%`} s/costo)
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        {totalCost > 0 && mostradorPrice > 0 ? (
                          <span className={`font-bold text-xs px-2 py-0.5 rounded ${profitInHand > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-terracotta'}`}>
                            {formatCurrency(profitInHand)}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">-</span>
                        )}
                      </td>
                      <td className="text-right text-xs font-medium text-text-muted">
                        <div>WA: <strong className="text-text-dark">{formatCurrency(whatsappPrice)}</strong></div>
                        <div>Web: <strong className="text-text-dark">{formatCurrency(onlinePrice)}</strong></div>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleOpenConfigModal(p, fp)}
                          className={`btn ${isConfigured ? 'btn-secondary' : 'btn-primary'} btn-sm text-xs flex items-center gap-1 mx-auto`}
                          title="Ver paso a paso la formación del precio y ajustar costos/márgenes"
                        >
                          <Calculator size={14} />
                          {isConfigured ? 'Ver / Ajustar Paso a Paso' : 'Formar Precio'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No hay productos que coincidan con los filtros seleccionados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Rediseñado: Constitución Paso a Paso de Precios y Costos (Sin Números Ocultos) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🧮 Constitución Paso a Paso del Precio de Venta (Sin Números Ocultos)"
        maxWidth="840px"
      >
        <form onSubmit={handleSubmit(onSubmitSave)} className="flex flex-col gap-4">
          {/* Selección de Producto y Resumen de Categoría */}
          <div className="p-3 bg-bg-linen rounded-lg border flex flex-col gap-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-xs font-bold text-text-dark uppercase tracking-wide">
                Producto a Analizar / Configurar *
              </label>
              {currentModalFp && (
                <div className="flex items-center gap-1.5">
                  <span className="badge gray text-xs">{getFamilyDisplayLabel(currentModalFp)}</span>
                  {isCurrentModalPack ? (
                    <span className="badge amber text-xs">🎁 Pack / Combo</span>
                  ) : isCurrentModalResale ? (
                    <span className="badge blue text-xs">🛍️ Producto de Reventa</span>
                  ) : isCurrentModalBlend ? (
                    <span className="badge purple text-xs">📚 Blend / Mix</span>
                  ) : (
                    <span className="badge green text-xs">🏭 Elaborado / Fraccionado</span>
                  )}
                </div>
              )}
            </div>
            <select 
              className="input font-semibold"
              {...register('productId')}
              onChange={(e) => {
                const pId = e.target.value;
                const fp = products.find(prod => prod.id === pId);
                const existingP = pricingList.find(item => item.productId === pId);
                if (fp) {
                  handleOpenConfigModal(existingP || null, fp);
                }
              }}
            >
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — {getFamilyDisplayLabel(p)} {isProductPack(p) ? '[Pack/Combo]' : p.isResale ? '[Reventa]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* =====================================================================
              ESCALÓN 1: ORIGEN DEL COSTO (DESDE LA COMPRA / INSUMOS)
             ===================================================================== */}
          <div className="border rounded-lg p-3.5 bg-white shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-sage text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-sm text-text-dark m-0">
                    Costo Base del Producto (Origen en la Compra)
                  </h4>
                  <p className="text-[11px] text-text-muted m-0">
                    De dónde nace el costo de la mercadería antes de sumar cualquier extra
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">Costo Base Producto</span>
                <span className="text-lg font-bold text-primary-sage">{formatCurrency(watchedRawCost)}</span>
              </div>
            </div>

            {/* Trazabilidad del último comprobante de compra si existe */}
            {lastPurchaseReceipt && (
              <div className="p-2.5 bg-green-50/70 border border-green-200 rounded text-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-primary-sage flex-shrink-0" />
                  <span>
                    <strong>Última Compra Registrada:</strong> Comprobante <strong>{lastPurchaseReceipt.receiptNumber}</strong> ({lastPurchaseReceipt.supplierName})
                    {lastPurchaseReceipt.date ? ` el ${new Date(lastPurchaseReceipt.date).toLocaleDateString('es-AR')}` : ''} — Pagado: <strong>{formatCurrency(lastPurchaseReceipt.unitCost)} / {lastPurchaseReceipt.unitOfMeasure}</strong>
                  </span>
                </div>
                {isCurrentModalResale && lastPurchaseReceipt.unitCost > 0 && lastPurchaseReceipt.unitCost !== watchedRawCost && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2"
                    onClick={() => {
                      setValue('rawMaterialCost', Math.round(lastPurchaseReceipt.unitCost));
                      const newTotal = Math.round(lastPurchaseReceipt.unitCost) + watchedPackCost + watchedLaborCost + watchedFixedCost;
                      syncChannelPricesWithNewCost(newTotal);
                    }}
                  >
                    Usar ${lastPurchaseReceipt.unitCost.toLocaleString('es-AR')}
                  </button>
                )}
              </div>
            )}

            {/* Desglose específico según sea Pack/Combo, Reventa, Blend o Monoproducto */}
            {isCurrentModalPack && Array.isArray(currentModalFp?.ingredientsList) && currentModalFp.ingredientsList.length > 0 ? (
              <div className="bg-amber-50/50 border border-amber-200 rounded p-2.5 text-xs flex flex-col gap-2">
                <div className="font-bold text-amber-900 flex justify-between items-center">
                  <span>🎁 Desglose de Productos que integran este Pack / Combo:</span>
                  <button
                    type="button"
                    className="text-primary-sage underline font-semibold cursor-pointer"
                    onClick={() => {
                      const sumPack = currentModalFp.ingredientsList.reduce(
                        (s: number, i: any) => s + ((Number(i.quantity) || 1) * (Number(i.unitCost) || 0)),
                        0
                      );
                      setValue('rawMaterialCost', Math.round(sumPack));
                      syncChannelPricesWithNewCost(Math.round(sumPack) + watchedPackCost + watchedLaborCost + watchedFixedCost);
                    }}
                  >
                    🔄 Actualizar suma del Pack
                  </button>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-text-muted">
                      <th className="text-left py-1">Artículo Integrante</th>
                      <th className="text-center py-1">Cantidad</th>
                      <th className="text-right py-1">Costo Unitario</th>
                      <th className="text-right py-1">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentModalFp.ingredientsList.map((ing: any, i: number) => {
                      const qty = Number(ing.quantity) || 1;
                      const uCost = Number(ing.unitCost) || 0;
                      return (
                        <tr key={i} className="border-b border-amber-100">
                          <td className="py-1 font-medium">{ing.rawMaterialName || 'Componente'}</td>
                          <td className="py-1 text-center">{qty} {ing.unit || 'UND'}</td>
                          <td className="py-1 text-right">{formatCurrency(uCost)}</td>
                          <td className="py-1 text-right font-bold">{formatCurrency(qty * uCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : isCurrentModalResale ? (
              <div className="p-2.5 bg-blue-50/50 border border-blue-200 rounded text-xs flex justify-between items-center flex-wrap gap-2">
                <div>
                  <strong>🛍️ Producto de Reventa Directa:</strong> Costo de compra cargado en ficha:{' '}
                  <strong>{formatCurrency(currentModalFp?.costPrice || watchedRawCost)}</strong> por unidad
                  {currentModalFp?.supplierName ? ` • Proveedor: ${currentModalFp.supplierName}` : ''}.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-bg-linen p-2.5 rounded border text-xs">
                <div>
                  <label className="font-semibold text-text-dark mb-1 block">🌾 Materia Prima Base (Granel)</label>
                  <select 
                    className="input text-xs"
                    value={selectedRawMaterialId}
                    onChange={(e) => {
                      const rmId = e.target.value;
                      setSelectedRawMaterialId(rmId);
                      const rm = raws.find(r => r.id === rmId);
                      if (rm && currentModalFp) {
                        const newCost = calcRawCostWithUnits(currentModalFp, rm);
                        setValue('rawMaterialCost', newCost);
                      } else if (rm) {
                        setValue('rawMaterialCost', Math.round(rm.costPerUnit || 0));
                      }
                    }}
                  >
                    <option value="">Seleccionar insumo granel...</option>
                    {raws.map(rm => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} (${rm.costPerUnit?.toLocaleString('es-AR')} por {rm.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-text-muted font-medium">Conversión de Compra a Unidad de Venta:</span>
                  <span className="font-bold text-text-dark mt-0.5">
                    {rawBreakdown ? rawBreakdown.formulaText : `Presentación: ${currentModalFp?.unitWeightGrams || 1} ${currentModalFp?.unit || 'GRS'}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-xs font-medium text-text-dark">
                Monto exacto de Costo de Compra / Materia Prima para 1 unidad ($):
              </span>
              <input
                type="number"
                step="0.01"
                className="input font-bold text-right w-40"
                {...register('rawMaterialCost', {
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    const newTotal = val + watchedPackCost + watchedLaborCost + watchedFixedCost;
                    syncChannelPricesWithNewCost(newTotal);
                  }
                })}
              />
            </div>
          </div>

          {/* =====================================================================
              ESCALÓN 2: EMPAQUE Y MANO DE OBRA (CON SWITCHES VISIBLES)
             ===================================================================== */}
          <div className="border rounded-lg p-3.5 bg-white shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-sage text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-sm text-text-dark m-0">
                    Empaque, Etiqueta y Mano de Obra Directa
                  </h4>
                  <p className="text-[11px] text-text-muted m-0">
                    Activa o desactiva cada ítem. Si está desactivado suma exactamente $0.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-muted block">Subtotal Costo Directo (1 + 2)</span>
                <span className="text-lg font-bold text-text-dark">{formatCurrency(totalDirectCost)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sub-bloque Empaque */}
              <div className={`p-2.5 rounded border ${includePackaging ? 'bg-bg-linen border-primary-sage/40' : 'bg-gray-50 opacity-75'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePackaging}
                      onChange={(e) => {
                        setIncludePackaging(e.target.checked);
                        const pkgVal = e.target.checked ? (Number(watch('packagingLabelCost')) || 0) : 0;
                        syncChannelPricesWithNewCost(watchedRawCost + pkgVal + watchedLaborCost + watchedFixedCost);
                      }}
                    />
                    <span>📦 Sumar Material de Empaque / Etiqueta</span>
                  </label>
                  <span className="font-bold text-xs text-primary-sage">
                    + {formatCurrency(watchedPackCost)}
                  </span>
                </div>

                {includePackaging && (
                  <>
                    <div className="border rounded bg-white p-1.5 max-h-28 overflow-y-auto flex flex-col gap-1 text-xs mb-2">
                      {pkgs.map((pkg) => {
                        const isSelected = selectedPackagingIds.includes(pkg.id);
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => togglePackagingSelection(pkg.id)}
                            className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                              isSelected 
                                ? 'bg-green-50 border border-primary-sage text-primary-sage font-semibold' 
                                : 'hover:bg-gray-50 text-text-dark'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {isSelected ? <CheckSquare size={13} className="text-primary-sage" /> : <Square size={13} className="text-text-muted" />}
                              <span>{pkg.name}</span>
                            </div>
                            <span className="font-bold">${pkg.costPerUnit?.toLocaleString('es-AR')}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Costo Empaque Manual ($):</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input text-right font-semibold w-28 py-1 text-xs"
                        {...register('packagingLabelCost')}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sub-bloque Mano de Obra */}
              <div className={`p-2.5 rounded border flex flex-col justify-between ${includeLabor ? 'bg-bg-linen border-primary-sage/40' : 'bg-gray-50 opacity-75'}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeLabor}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIncludeLabor(checked);
                          if (checked && Number(watch('laborCost')) === 0) {
                            setValue('laborCost', 150);
                          }
                        }}
                      />
                      <span>👩‍🍳 Sumar Mano de Obra de Fraccionado</span>
                    </label>
                    <span className="font-bold text-xs text-primary-sage">
                      + {formatCurrency(watchedLaborCost)}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted m-0">
                    Tiempo de envasado, pesado y etiquetado. En productos de reventa suele ser $0.
                  </p>
                </div>

                {includeLabor && (
                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                    <span>Monto Mano de Obra por unidad ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      className="input text-right font-semibold w-28 py-1 text-xs"
                      {...register('laborCost')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =====================================================================
              ESCALÓN 3 Y 4: COSTOS FIJOS E IMPUESTOS (100% OPCIONALES Y VISIBLES)
             ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Escalón 3: Costos Fijos */}
            <div className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between ${includeFixedCosts ? 'border-primary-sage' : ''}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <input
                      type="checkbox"
                      checked={includeFixedCosts}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeFixedCosts(checked);
                        if (checked && Number(watch('allocatedFixedCosts')) === 0) {
                          setValue('allocatedFixedCosts', 250);
                        }
                      }}
                    />
                    <span>🏢 Sumar Costos Fijos Prorrateados</span>
                  </label>
                  <span className="font-bold text-xs text-primary-sage">
                    + {formatCurrency(watchedFixedCost)}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted m-0">
                  {includeFixedCosts
                    ? 'Suma una porción de alquiler/servicios a cada unidad.'
                    : 'Desactivado ($0). No se suma ningún costo fijo oculto.'}
                </p>
              </div>
              {includeFixedCosts && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                  <span>Costo Fijo por unidad ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input text-right font-semibold w-28 py-1 text-xs"
                    {...register('allocatedFixedCosts')}
                  />
                </div>
              )}
            </div>

            {/* Escalón 4: Impuestos / Comisiones */}
            <div className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between ${includeTaxesAndCommissions ? 'border-primary-sage' : ''}`}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    <input
                      type="checkbox"
                      checked={includeTaxesAndCommissions}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeTaxesAndCommissions(checked);
                        if (checked && Number(watch('taxPercentage')) === 0) {
                          setValue('taxPercentage', 21);
                        }
                      }}
                    />
                    <span>🏛️ Incluir Impuestos / Comisiones (%)</span>
                  </label>
                  <span className="font-bold text-xs text-amber-700">
                    {includeTaxesAndCommissions ? `${watchedTaxPct}% Imp.` : '0% (Directo)'}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted m-0">
                  {includeTaxesAndCommissions
                    ? 'Se adiciona el porcentaje impositivo al precio sugerido.'
                    : 'Desactivado (0%). El precio se calcula directo: Costo + % Recargo.'}
                </p>
              </div>
              {includeTaxesAndCommissions && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                  <span>% Impuestos / IVA sobre venta:</span>
                  <input
                    type="number"
                    step="0.1"
                    className="input text-right font-semibold w-24 py-1 text-xs"
                    {...register('taxPercentage')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Banner Resumen de Costo Total (Punto de Equilibrio) */}
          <div className="p-3 bg-primary-sage/10 rounded-lg border border-primary-sage flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs text-text-dark">
              <strong>Cuenta del Costo Total Unitario:</strong>{' '}
              Compra/MP (<strong>{formatCurrency(watchedRawCost)}</strong>)
              {watchedPackCost > 0 ? ` + Empaque (${formatCurrency(watchedPackCost)})` : ''}
              {watchedLaborCost > 0 ? ` + Mano de Obra (${formatCurrency(watchedLaborCost)})` : ''}
              {watchedFixedCost > 0 ? ` + Costos Fijos (${formatCurrency(watchedFixedCost)})` : ''}
            </div>
            <div className="text-base font-bold text-primary-sage">
              = COSTO TOTAL UNITARIO: {formatCurrency(totalUnitCost)}
            </div>
          </div>

          {/* =====================================================================
              ESCALÓN 5: FORMACIÓN BIDIRECCIONAL DEL PRECIO Y GANANCIA POR CANAL
             ===================================================================== */}
          <div className="flex items-center justify-between border-b pb-1 mt-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-sage text-white text-xs font-bold flex items-center justify-center">
                5
              </span>
              <h4 className="font-bold text-sm text-text-dark m-0">
                Formación del Precio de Venta (Cálculo Bidireccional: % Recargo ⇄ Precio Final $)
              </h4>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-xs py-1 px-2.5"
              onClick={() => {
                setValue('mostradorFinalPrice', mostradorCalc.suggested);
                setValue('whatsappFinalPrice', whatsappCalc.suggested);
                setValue('onlineFinalPrice', onlineCalc.suggested);
              }}
              title="Adoptar los precios sugeridos según el % de recargo actual"
            >
              ⚡ Aplicar Precios Sugeridos
            </button>
          </div>

          {/* Canal 1: Mostrador */}
          <div className="p-3.5 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">🏪 Canal 1: Mostrador / Venta Presencial</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido por fórmula: {formatCurrency(mostradorCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo sobre Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage"
                  {...register('mostradorMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('mostradorCommissionPct') || 0) : 0)) / 100;
                      const base = totalUnitCost * (1 + pct / 100);
                      const nextPrice = ded > 0 && ded < 1 ? Math.round(base / (1 - ded)) : Math.round(base);
                      setValue('mostradorFinalPrice', nextPrice);
                    }
                  })}
                />
              </div>
              {includeTaxesAndCommissions && (
                <div>
                  <label className="mb-1 block font-medium text-text-muted">% Comisión Canal</label>
                  <input type="number" step="0.5" className="input" {...register('mostradorCommissionPct')} />
                </div>
              )}
              <div className={includeTaxesAndCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($) <span className="font-normal text-text-muted">(Editable: recalcula tu % de ganancia)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={mostradorCalc.suggested.toString()}
                  className="input font-bold border-primary-sage text-base"
                  {...register('mostradorFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('mostradorCommissionPct') || 0) : 0)) / 100;
                        const netAfterTax = priceVal * (1 - ded);
                        const newPct = Number((((netAfterTax - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
                        setValue('mostradorMarginPct', newPct);
                      }
                    }
                  })}
                />
              </div>
            </div>
            {renderPriceBreakdownBar(mostradorCalc)}
          </div>

          {/* Canal 2: WhatsApp */}
          <div className="p-3.5 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">📱 Canal 2: WhatsApp / Pedidos Directos</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido por fórmula: {formatCurrency(whatsappCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo sobre Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage"
                  {...register('whatsappMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('whatsappCommissionPct') || 0) : 0)) / 100;
                      const base = totalUnitCost * (1 + pct / 100);
                      const nextPrice = ded > 0 && ded < 1 ? Math.round(base / (1 - ded)) : Math.round(base);
                      setValue('whatsappFinalPrice', nextPrice);
                    }
                  })}
                />
              </div>
              {includeTaxesAndCommissions && (
                <div>
                  <label className="mb-1 block font-medium text-text-muted">% Comisión Canal</label>
                  <input type="number" step="0.5" className="input" {...register('whatsappCommissionPct')} />
                </div>
              )}
              <div className={includeTaxesAndCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($) <span className="font-normal text-text-muted">(Editable: recalcula tu % de ganancia)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={whatsappCalc.suggested.toString()}
                  className="input font-bold"
                  {...register('whatsappFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('whatsappCommissionPct') || 0) : 0)) / 100;
                        const netAfterTax = priceVal * (1 - ded);
                        const newPct = Number((((netAfterTax - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
                        setValue('whatsappMarginPct', newPct);
                      }
                    }
                  })}
                />
              </div>
            </div>
            {renderPriceBreakdownBar(whatsappCalc)}
          </div>

          {/* Canal 3: Tienda Online */}
          <div className="p-3.5 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">🌐 Canal 3: Tienda Online / E-commerce</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido por fórmula: {formatCurrency(onlineCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo sobre Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage"
                  {...register('onlineMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('onlineCommissionPct') || 0) : 0)) / 100;
                      const base = totalUnitCost * (1 + pct / 100);
                      const nextPrice = ded > 0 && ded < 1 ? Math.round(base / (1 - ded)) : Math.round(base);
                      setValue('onlineFinalPrice', nextPrice);
                    }
                  })}
                />
              </div>
              {includeTaxesAndCommissions && (
                <div>
                  <label className="mb-1 block font-medium text-text-muted">% Comisión Pasarela</label>
                  <input type="number" step="0.5" className="input" {...register('onlineCommissionPct')} />
                </div>
              )}
              <div className={includeTaxesAndCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($) <span className="font-normal text-text-muted">(Editable: recalcula tu % de ganancia)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={onlineCalc.suggested.toString()}
                  className="input font-bold"
                  {...register('onlineFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const ded = (watchedTaxPct + (includeTaxesAndCommissions ? Number(watch('onlineCommissionPct') || 0) : 0)) / 100;
                        const netAfterTax = priceVal * (1 - ded);
                        const newPct = Number((((netAfterTax - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
                        setValue('onlineMarginPct', newPct);
                      }
                    }
                  })}
                />
              </div>
            </div>
            {renderPriceBreakdownBar(onlineCalc)}
          </div>

          <div className="form-actions flex justify-end gap-3 mt-2 border-t pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savePricing.isPending}>
              {savePricing.isPending ? 'Guardando...' : '💾 Guardar Precios y Actualizar Catálogo'}
            </button>
          </div>
        </form>
      </Modal>

      <PriceListGeneratorModal
        isOpen={isPriceListModalOpen}
        onClose={() => setIsPriceListModalOpen(false)}
        products={products}
        families={familiesList}
        settings={settingsData}
      />
    </div>
  );
};
