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

  // Switches explícitos en el modal (Impuestos y Comisiones 100% separados)
  const [includePackaging, setIncludePackaging] = useState<boolean>(false);
  const [includeLabor, setIncludeLabor] = useState<boolean>(false);
  const [includeFixedCosts, setIncludeFixedCosts] = useState<boolean>(false);
  const [includeTaxes, setIncludeTaxes] = useState<boolean>(false);
  const [includeCommissions, setIncludeCommissions] = useState<boolean>(false);
  const [showStepHelp, setShowStepHelp] = useState<boolean>(false);

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
  const watchedTaxPct = includeTaxes ? (Number(watch('taxPercentage')) || 0) : 0;

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

  // Helper para calcular precio sugerido de un canal según costo, % recargo, % impuesto y % comisión separados
  const computeSuggestedChannelPrice = (
    unitCost: number,
    markupPct: number,
    taxPct: number,
    commPct: number
  ): number => {
    const baseWithMarkup = unitCost * (1 + (Number(markupPct) || 0) / 100);
    const dedRatio = ((Number(taxPct) || 0) + (Number(commPct) || 0)) / 100;
    if (dedRatio > 0 && dedRatio < 0.95) {
      return Math.round(baseWithMarkup / (1 - dedRatio));
    }
    if (dedRatio >= 0.95) {
      return Math.round(baseWithMarkup * (1 + dedRatio));
    }
    return Math.round(baseWithMarkup);
  };

  // Recalcular en tiempo real los precios finales de todos los canales cuando cambia CUALQUIER escalón (1, 2, 3, 4 o 5)
  const recalculateAllChannelsLive = (overrides?: {
    rawCost?: number;
    pkgCost?: number;
    laborCost?: number;
    fixedCost?: number;
    taxPct?: number;
    incPkg?: boolean;
    incLabor?: boolean;
    incFixed?: boolean;
    incTax?: boolean;
    incComm?: boolean;
    mCommPct?: number;
    wCommPct?: number;
    oCommPct?: number;
    mMarginPct?: number;
    wMarginPct?: number;
    oMarginPct?: number;
  }) => {
    const useIncPkg = overrides?.incPkg !== undefined ? overrides.incPkg : includePackaging;
    const useIncLabor = overrides?.incLabor !== undefined ? overrides.incLabor : includeLabor;
    const useIncFixed = overrides?.incFixed !== undefined ? overrides.incFixed : includeFixedCosts;
    const useIncTax = overrides?.incTax !== undefined ? overrides.incTax : includeTaxes;
    const useIncComm = overrides?.incComm !== undefined ? overrides.incComm : includeCommissions;

    const rCost = overrides?.rawCost !== undefined ? overrides.rawCost : (Number(watch('rawMaterialCost')) || 0);
    const pCost = useIncPkg
      ? (overrides?.pkgCost !== undefined ? overrides.pkgCost : (Number(watch('packagingLabelCost')) || 0))
      : 0;
    const lCost = useIncLabor
      ? (overrides?.laborCost !== undefined ? overrides.laborCost : (Number(watch('laborCost')) || 0))
      : 0;
    const fCost = useIncFixed
      ? (overrides?.fixedCost !== undefined ? overrides.fixedCost : (Number(watch('allocatedFixedCosts')) || 0))
      : 0;
    const tPct = useIncTax
      ? (overrides?.taxPct !== undefined ? overrides.taxPct : (Number(watch('taxPercentage')) || 0))
      : 0;

    const nextUnitCost = rCost + pCost + lCost + fCost;

    const mMargin = overrides?.mMarginPct !== undefined ? overrides.mMarginPct : (Number(watch('mostradorMarginPct')) || 0);
    const wMargin = overrides?.wMarginPct !== undefined ? overrides.wMarginPct : (Number(watch('whatsappMarginPct')) || 0);
    const oMargin = overrides?.oMarginPct !== undefined ? overrides.oMarginPct : (Number(watch('onlineMarginPct')) || 0);

    const mComm = useIncComm
      ? (overrides?.mCommPct !== undefined ? overrides.mCommPct : (Number(watch('mostradorCommissionPct')) || 0))
      : 0;
    const wComm = useIncComm
      ? (overrides?.wCommPct !== undefined ? overrides.wCommPct : (Number(watch('whatsappCommissionPct')) || 0))
      : 0;
    const oComm = useIncComm
      ? (overrides?.oCommPct !== undefined ? overrides.oCommPct : (Number(watch('onlineCommissionPct')) || 0))
      : 0;

    setValue('mostradorFinalPrice', computeSuggestedChannelPrice(nextUnitCost, mMargin, tPct, mComm));
    setValue('whatsappFinalPrice', computeSuggestedChannelPrice(nextUnitCost, wMargin, tPct, wComm));
    setValue('onlineFinalPrice', computeSuggestedChannelPrice(nextUnitCost, oMargin, tPct, oComm));
  };

  // Helper para calcular métricas paso a paso por canal (Impuestos y Comisiones separados)
  const calcChannelMetrics = (commPctInput: number, markupPctInput: number, customFinalPriceInput: number) => {
    const commPct = includeCommissions ? (Number(commPctInput) || 0) : 0;
    const markupPct = Number(markupPctInput) || 0;
    const customFinalPrice = Number(customFinalPriceInput) || 0;

    const desiredProfitFromMarkup = Math.round(totalUnitCost * (markupPct / 100));
    const suggested = computeSuggestedChannelPrice(totalUnitCost, markupPct, watchedTaxPct, commPct);

    const finalPrice = customFinalPrice > 0 ? Math.round(customFinalPrice) : suggested;
    const taxDeduction = Math.round(finalPrice * (watchedTaxPct / 100));
    const commDeduction = Math.round(finalPrice * (commPct / 100));
    const totalDeductions = taxDeduction + commDeduction;

    const profit = finalPrice - (totalUnitCost + totalDeductions);
    const realMarkupOverCost = totalUnitCost > 0 ? (profit / totalUnitCost) * 100 : 0;
    const realMarginOverSale = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

    return {
      suggested,
      finalPrice,
      desiredProfitFromMarkup,
      taxPct: watchedTaxPct,
      commPct,
      taxDeduction,
      commDeduction,
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
    setShowStepHelp(false);

    const matchedFp = fpFallback || (p ? products.find(prod => prod.id === p.productId || prod.code === p.productSku) : null);
    const isPack = isProductPack(matchedFp);
    const isResale = Boolean(matchedFp?.isResale) && !isPack;
    const baseRm = matchedFp ? raws.find(rm => rm.id === matchedFp.rawMaterialId) : null;

    // 1. Calcular el costo de compra / insumo base real
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

    // 2. Detectar si el registro existente tenía los valores antiguos por defecto (labor=150, fixed=250, tax=21, waComm=15)
    // pero el precio de venta del producto fue calculado directo sin esos cargos
    const currentMostradorPrice = p?.channels?.mostrador?.finalPrice || Number(matchedFp?.price) || 0;
    const savedMargin = p?.channels?.mostrador?.marginPercentage || 50;
    const isDirectPriceWithoutExtras =
      calculatedRawCost > 0 &&
      currentMostradorPrice > 0 &&
      Math.abs(currentMostradorPrice - Math.round(calculatedRawCost * (1 + savedMargin / 100))) <= 5;

    const defaultPkgs = (isResale || isPack) ? [] : pkgs.filter(pkg => pkg.category === 'DOYPACK' || pkg.category === 'LABEL');
    const initialPkgIds = defaultPkgs.map(item => item.id);
    const calculatedPkgCost = p?.packagingLabelCost !== undefined
      ? (isDirectPriceWithoutExtras ? 0 : Number(p.packagingLabelCost))
      : ((isResale || isPack) ? 0 : defaultPkgs.reduce((sum, item) => sum + (Number(item.costPerUnit) || 0), 0));

    const existingLaborCost = (p?.laborCost !== undefined && !isDirectPriceWithoutExtras && !(isResale && Number(p.laborCost) === 150))
      ? Number(p.laborCost)
      : 0;
    const existingFixedCost = (p?.allocatedFixedCosts !== undefined && !isDirectPriceWithoutExtras && !(isResale && Number(p.allocatedFixedCosts) === 250))
      ? Number(p.allocatedFixedCosts)
      : 0;
    const existingTaxPct = (p?.taxPercentage !== undefined && !isDirectPriceWithoutExtras && !(Number(p.taxPercentage) === 21 && isResale))
      ? Number(p.taxPercentage)
      : 0;

    const existingMostradorComm = (!isDirectPriceWithoutExtras && p?.channels?.mostrador?.commissionPercentage) ? Number(p.channels.mostrador.commissionPercentage) : 0;
    const existingWhatsappComm = (!isDirectPriceWithoutExtras && p?.channels?.whatsapp?.commissionPercentage && !(Number(p.channels.whatsapp.commissionPercentage) === 15 && isResale))
      ? Number(p.channels.whatsapp.commissionPercentage)
      : 0;
    const existingOnlineComm = (!isDirectPriceWithoutExtras && p?.channels?.tiendaOnline?.commissionPercentage) ? Number(p.channels.tiendaOnline.commissionPercentage) : 0;
    const hasActiveComm = (existingMostradorComm > 0 || existingWhatsappComm > 0 || existingOnlineComm > 0);

    const nextIncPkg = calculatedPkgCost > 0;
    const nextIncLabor = existingLaborCost > 0;
    const nextIncFixed = existingFixedCost > 0;
    const nextIncTax = existingTaxPct > 0;
    const nextIncComm = hasActiveComm;

    setIncludePackaging(nextIncPkg);
    setIncludeLabor(nextIncLabor);
    setIncludeFixedCosts(nextIncFixed);
    setIncludeTaxes(nextIncTax);
    setIncludeCommissions(nextIncComm);

    setSelectedRawMaterialId(baseRm ? baseRm.id : '');
    setSelectedPackagingIds(nextIncPkg ? initialPkgIds : []);

    const activeUnitCost =
      calculatedRawCost +
      (nextIncPkg ? calculatedPkgCost : 0) +
      (nextIncLabor ? existingLaborCost : 0) +
      (nextIncFixed ? existingFixedCost : 0);

    const inferredMarkup = (activeUnitCost > 0 && currentMostradorPrice > 0)
      ? Number((((currentMostradorPrice - activeUnitCost) / activeUnitCost) * 100).toFixed(1))
      : (p?.channels?.mostrador?.marginPercentage || 50);

    const defaultSalePrice = currentMostradorPrice > 0
      ? currentMostradorPrice
      : computeSuggestedChannelPrice(activeUnitCost, inferredMarkup, nextIncTax ? existingTaxPct : 0, nextIncComm ? existingMostradorComm : 0);

    if (p) {
      setSelectedProductPricing(p);
      const waPrice = p.channels?.whatsapp?.finalPrice || defaultSalePrice;
      const onPrice = p.channels?.tiendaOnline?.finalPrice || defaultSalePrice;
      const waMarkup = (activeUnitCost > 0 && waPrice > 0)
        ? Number((((waPrice - activeUnitCost) / activeUnitCost) * 100).toFixed(1))
        : inferredMarkup;
      const onMarkup = (activeUnitCost > 0 && onPrice > 0)
        ? Number((((onPrice - activeUnitCost) / activeUnitCost) * 100).toFixed(1))
        : inferredMarkup;

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
        mostradorCommissionPct: existingMostradorComm,
        mostradorMarginPct: inferredMarkup,
        mostradorFinalPrice: defaultSalePrice,
        whatsappCommissionPct: existingWhatsappComm,
        whatsappMarginPct: waMarkup,
        whatsappFinalPrice: waPrice,
        onlineCommissionPct: existingOnlineComm,
        onlineMarginPct: onMarkup,
        onlineFinalPrice: onPrice,
      });
    } else if (matchedFp) {
      setSelectedProductPricing(null);
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
    recalculateAllChannelsLive({ incPkg: true, pkgCost: totalCost });
  };

  const onSubmitSave = (formData: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const effectivePkgCost = includePackaging ? Number(formData.packagingLabelCost || 0) : 0;
    const effectiveLaborCost = includeLabor ? Number(formData.laborCost || 0) : 0;
    const effectiveFixedCost = includeFixedCosts ? Number(formData.allocatedFixedCosts || 0) : 0;
    const effectiveTaxPct = includeTaxes ? Number(formData.taxPercentage || 0) : 0;

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
          commissionPercentage: includeCommissions ? Number(formData.mostradorCommissionPct || 0) : 0,
          marginPercentage: Number(formData.mostradorMarginPct || 0),
          finalPrice: Number(formData.mostradorFinalPrice) > 0 ? Number(formData.mostradorFinalPrice) : mostradorCalc.suggested
        },
        whatsapp: {
          commissionPercentage: includeCommissions ? Number(formData.whatsappCommissionPct || 0) : 0,
          marginPercentage: Number(formData.whatsappMarginPct || 0),
          finalPrice: Number(formData.whatsappFinalPrice) > 0 ? Number(formData.whatsappFinalPrice) : whatsappCalc.suggested
        },
        tiendaOnline: {
          commissionPercentage: includeCommissions ? Number(formData.onlineCommissionPct || 0) : 0,
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

  // Renderizador de desglose con Impuestos y Comisiones 100% separados
  const renderPriceBreakdownBar = (calc: ReturnType<typeof calcChannelMetrics>) => {
    const finalP = Math.max(1, calc.finalPrice);
    const rawPct = Math.min(100, Math.max(0, (watchedRawCost / finalP) * 100));
    const extrasCost = watchedPackCost + watchedLaborCost + watchedFixedCost;
    const extrasPct = Math.min(100 - rawPct, Math.max(0, (extrasCost / finalP) * 100));
    const taxBarPct = Math.min(100 - rawPct - extrasPct, Math.max(0, (calc.taxDeduction / finalP) * 100));
    const commBarPct = Math.min(100 - rawPct - extrasPct - taxBarPct, Math.max(0, (calc.commDeduction / finalP) * 100));
    const profitPct = Math.max(0, 100 - rawPct - extrasPct - taxBarPct - commBarPct);

    return (
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center text-[11px] mb-1 flex-wrap gap-1">
          <span className="text-text-muted font-medium">
            Costo Total: <strong>{formatCurrency(totalUnitCost)}</strong> + Ganancia: <strong>{formatCurrency(calc.profit)}</strong> ({calc.realMarkupOverCost >= 0 ? `+${calc.realMarkupOverCost.toFixed(1)}%` : `${calc.realMarkupOverCost.toFixed(1)}%`} s/costo)
            {calc.taxDeduction > 0 ? ` + Impuestos: ${formatCurrency(calc.taxDeduction)} (${calc.taxPct}%)` : ''}
            {calc.commDeduction > 0 ? ` + Comisión: ${formatCurrency(calc.commDeduction)} (${calc.commPct}%)` : ''}
            {' '}= <strong>{formatCurrency(calc.finalPrice)}</strong>
          </span>
          <span className={`font-bold ${calc.profit >= 0 ? 'text-primary-sage' : 'text-terracotta'}`}>
            Ganancia limpia: {formatCurrency(calc.profit)} ({calc.realMarginOverSale.toFixed(1)}% s/venta)
          </span>
        </div>

        {/* Barra segmentada proporcional */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex border border-gray-200">
          {rawPct > 0 && (
            <div
              style={{ width: `${rawPct}%`, backgroundColor: '#D97706' }}
              title={`Costo Compra/Insumos: ${formatCurrency(watchedRawCost)} (${rawPct.toFixed(0)}%)`}
            />
          )}
          {extrasPct > 0 && (
            <div
              style={{ width: `${extrasPct}%`, backgroundColor: '#3B82F6' }}
              title={`Empaque / Mano de Obra / Fijos: ${formatCurrency(extrasCost)} (${extrasPct.toFixed(0)}%)`}
            />
          )}
          {taxBarPct > 0 && (
            <div
              style={{ width: `${taxBarPct}%`, backgroundColor: '#F59E0B' }}
              title={`Impuestos (${calc.taxPct}%): ${formatCurrency(calc.taxDeduction)}`}
            />
          )}
          {commBarPct > 0 && (
            <div
              style={{ width: `${commBarPct}%`, backgroundColor: '#8B5CF6' }}
              title={`Comisión Canal (${calc.commPct}%): ${formatCurrency(calc.commDeduction)}`}
            />
          )}
          {profitPct > 0 && (
            <div
              style={{ width: `${profitPct}%`, backgroundColor: '#2E5339' }}
              title={`Ganancia Limpia: ${formatCurrency(calc.profit)} (${profitPct.toFixed(0)}%)`}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#D97706' }} />
            Costo Base: <strong>{formatCurrency(watchedRawCost)}</strong>
          </span>
          {extrasCost > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#3B82F6' }} />
              Empaque/M.Obra/Fijos: <strong>{formatCurrency(extrasCost)}</strong>
            </span>
          )}
          {calc.taxDeduction > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#F59E0B' }} />
              Impuestos ({calc.taxPct}%): <strong>{formatCurrency(calc.taxDeduction)}</strong>
            </span>
          )}
          {calc.commDeduction > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#8B5CF6' }} />
              Comisión Canal ({calc.commPct}%): <strong>{formatCurrency(calc.commDeduction)}</strong>
            </span>
          )}
          <span className="flex items-center gap-1 text-primary-sage font-semibold">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#2E5339' }} />
            Ganancia Limpia: <strong>{formatCurrency(calc.profit)}</strong>
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

      {/* Modal Rediseñado: Constitución Paso a Paso de Precios y Costos */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🧮 Constitución Paso a Paso del Precio de Venta"
        maxWidth="840px"
      >
        <form onSubmit={handleSubmit(onSubmitSave)} className="flex flex-col gap-3.5">
          {/* Selección de Producto y Botón para Mostrar/Ocultar Indicaciones */}
          <div className="p-3 bg-bg-linen rounded-lg border flex flex-col gap-2">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-xs font-bold text-text-dark uppercase tracking-wide">
                Producto a Configurar *
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {currentModalFp && (
                  <div className="flex items-center gap-1.5">
                    <span className="badge gray text-xs">{getFamilyDisplayLabel(currentModalFp)}</span>
                    {isCurrentModalPack ? (
                      <span className="badge amber text-xs">🎁 Pack / Combo</span>
                    ) : isCurrentModalResale ? (
                      <span className="badge blue text-xs">🛍️ Reventa</span>
                    ) : isCurrentModalBlend ? (
                      <span className="badge purple text-xs">📚 Blend</span>
                    ) : (
                      <span className="badge green text-xs">🏭 Elaborado</span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowStepHelp(!showStepHelp)}
                  className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2 flex items-center gap-1"
                  title="Mostrar u ocultar las explicaciones de cada escalón"
                >
                  <Info size={13} />
                  {showStepHelp ? 'Ocultar indicaciones' : '? Ver indicaciones'}
                </button>
              </div>
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
              ESCALÓN 1: COSTO BASE DEL PRODUCTO (COMPRA / MATERIA PRIMA)
             ===================================================================== */}
          <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2.5">
            <div className="flex justify-between items-center border-b pb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-sm text-text-dark m-0">
                    Costo Base de Compra / Materia Prima
                  </h4>
                  {showStepHelp && (
                    <p className="text-[11px] text-text-muted m-0">
                      Costo puro de adquisición de la mercadería o suma de sus insumos antes de agregar extras.
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-text-muted block">Subtotal Escalón 1</span>
                <span className="text-base font-bold text-primary-sage">{formatCurrency(watchedRawCost)}</span>
              </div>
            </div>

            {lastPurchaseReceipt && (
              <div className="p-2 bg-green-50/70 border border-green-200 rounded text-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-primary-sage flex-shrink-0" />
                  <span>
                    <strong>Última Compra:</strong> {lastPurchaseReceipt.receiptNumber} ({lastPurchaseReceipt.supplierName})
                    {lastPurchaseReceipt.date ? ` • ${new Date(lastPurchaseReceipt.date).toLocaleDateString('es-AR')}` : ''} — <strong>{formatCurrency(lastPurchaseReceipt.unitCost)} / {lastPurchaseReceipt.unitOfMeasure}</strong>
                  </span>
                </div>
                {isCurrentModalResale && lastPurchaseReceipt.unitCost > 0 && lastPurchaseReceipt.unitCost !== watchedRawCost && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-[11px] py-0.5 px-2"
                    onClick={() => {
                      const nextRaw = Math.round(lastPurchaseReceipt.unitCost);
                      setValue('rawMaterialCost', nextRaw);
                      recalculateAllChannelsLive({ rawCost: nextRaw });
                    }}
                  >
                    Aplicar ${lastPurchaseReceipt.unitCost.toLocaleString('es-AR')}
                  </button>
                )}
              </div>
            )}

            {isCurrentModalPack && Array.isArray(currentModalFp?.ingredientsList) && currentModalFp.ingredientsList.length > 0 ? (
              <div className="bg-amber-50/50 border border-amber-200 rounded p-2 text-xs flex flex-col gap-1.5">
                <div className="font-bold text-amber-900 flex justify-between items-center">
                  <span>🎁 Integrantes del Pack / Combo:</span>
                  <button
                    type="button"
                    className="text-primary-sage underline font-semibold cursor-pointer"
                    onClick={() => {
                      const sumPack = Math.round(
                        currentModalFp.ingredientsList.reduce(
                          (s: number, i: any) => s + ((Number(i.quantity) || 1) * (Number(i.unitCost) || 0)),
                          0
                        )
                      );
                      setValue('rawMaterialCost', sumPack);
                      recalculateAllChannelsLive({ rawCost: sumPack });
                    }}
                  >
                    🔄 Recalcular suma del Pack
                  </button>
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-text-muted">
                      <th className="text-left py-0.5">Artículo</th>
                      <th className="text-center py-0.5">Cant.</th>
                      <th className="text-right py-0.5">Costo Unit.</th>
                      <th className="text-right py-0.5">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentModalFp.ingredientsList.map((ing: any, i: number) => {
                      const qty = Number(ing.quantity) || 1;
                      const uCost = Number(ing.unitCost) || 0;
                      return (
                        <tr key={i} className="border-b border-amber-100">
                          <td className="py-0.5 font-medium">{ing.rawMaterialName || 'Componente'}</td>
                          <td className="py-0.5 text-center">{qty} {ing.unit || 'UND'}</td>
                          <td className="py-0.5 text-right">{formatCurrency(uCost)}</td>
                          <td className="py-0.5 text-right font-bold">{formatCurrency(qty * uCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : isCurrentModalResale ? (
              showStepHelp && (
                <div className="p-2 bg-blue-50/50 border border-blue-200 rounded text-xs">
                  <strong>🛍️ Producto de Reventa:</strong> Costo de compra en ficha: <strong>{formatCurrency(currentModalFp?.costPrice || watchedRawCost)}</strong>
                  {currentModalFp?.supplierName ? ` • Proveedor: ${currentModalFp.supplierName}` : ''}.
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-bg-linen p-2 rounded border text-xs">
                <div>
                  <label className="font-semibold text-text-dark mb-1 block">🌾 Materia Prima Base (Granel)</label>
                  <select 
                    className="input text-xs py-1"
                    value={selectedRawMaterialId}
                    onChange={(e) => {
                      const rmId = e.target.value;
                      setSelectedRawMaterialId(rmId);
                      const rm = raws.find(r => r.id === rmId);
                      let nextRaw = watchedRawCost;
                      if (rm && currentModalFp) {
                        nextRaw = calcRawCostWithUnits(currentModalFp, rm);
                      } else if (rm) {
                        nextRaw = Math.round(rm.costPerUnit || 0);
                      }
                      setValue('rawMaterialCost', nextRaw);
                      recalculateAllChannelsLive({ rawCost: nextRaw });
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
                  <span className="text-text-muted">Conversión a presentación:</span>
                  <span className="font-bold text-text-dark">
                    {rawBreakdown ? rawBreakdown.formulaText : `${currentModalFp?.unitWeightGrams || 1} ${currentModalFp?.unit || 'GRS'}`}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-text-dark">
                Costo de Compra / Insumos por unidad ($):
              </span>
              <input
                type="number"
                step="0.01"
                className="input font-bold text-right w-36 py-1"
                {...register('rawMaterialCost', {
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    recalculateAllChannelsLive({ rawCost: val });
                  }
                })}
              />
            </div>
          </div>

          {/* =====================================================================
              ESCALONES 2, 3, 4 Y 5: ADICIONALES E IMPUESTOS / COMISIONES SEPARADOS
             ===================================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Escalón 2A: Empaque / Etiqueta */}
            <div className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between ${includePackaging ? 'border-primary-sage' : 'opacity-80'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <input
                      type="checkbox"
                      checked={includePackaging}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludePackaging(checked);
                        recalculateAllChannelsLive({ incPkg: checked });
                      }}
                    />
                    <span>📦 Empaque y Etiqueta</span>
                  </label>
                  <span className="font-bold text-xs text-primary-sage">
                    + {formatCurrency(watchedPackCost)}
                  </span>
                </div>
                {showStepHelp && (
                  <p className="text-[11px] text-text-muted m-0 mt-1">
                    Suma bolsa doypack, frasco o etiqueta. Si está destildado suma $0.
                  </p>
                )}
              </div>

              {includePackaging && (
                <div className="mt-2 pt-2 border-t flex flex-col gap-2">
                  <div className="border rounded bg-bg-linen p-1.5 max-h-24 overflow-y-auto flex flex-col gap-1 text-xs">
                    {pkgs.map((pkg) => {
                      const isSelected = selectedPackagingIds.includes(pkg.id);
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => togglePackagingSelection(pkg.id)}
                          className={`flex items-center justify-between p-1 rounded cursor-pointer transition select-none ${
                            isSelected 
                              ? 'bg-green-50 border border-primary-sage text-primary-sage font-semibold' 
                              : 'hover:bg-white text-text-dark'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isSelected ? <CheckSquare size={12} className="text-primary-sage" /> : <Square size={12} className="text-text-muted" />}
                            <span>{pkg.name}</span>
                          </div>
                          <span className="font-bold">${pkg.costPerUnit?.toLocaleString('es-AR')}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Costo Empaque ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      className="input text-right font-semibold w-28 py-1 text-xs"
                      {...register('packagingLabelCost', {
                        onChange: (e) => {
                          const val = parseFloat(e.target.value) || 0;
                          recalculateAllChannelsLive({ incPkg: true, pkgCost: val });
                        }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Escalón 2B: Mano de Obra */}
            <div className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between ${includeLabor ? 'border-primary-sage' : 'opacity-80'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <input
                      type="checkbox"
                      checked={includeLabor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeLabor(checked);
                        let lVal = Number(watch('laborCost')) || 0;
                        if (checked && lVal === 0) {
                          lVal = 150;
                          setValue('laborCost', lVal);
                        }
                        recalculateAllChannelsLive({ incLabor: checked, laborCost: lVal });
                      }}
                    />
                    <span>👩‍🍳 Mano de Obra Fraccionado</span>
                  </label>
                  <span className="font-bold text-xs text-primary-sage">
                    + {formatCurrency(watchedLaborCost)}
                  </span>
                </div>
                {showStepHelp && (
                  <p className="text-[11px] text-text-muted m-0 mt-1">
                    Tiempo de fraccionado/armado por unidad. En reventa suele ser $0.
                  </p>
                )}
              </div>

              {includeLabor && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                  <span>Mano de Obra por unidad ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input text-right font-semibold w-28 py-1 text-xs"
                    {...register('laborCost', {
                      onChange: (e) => {
                        const val = parseFloat(e.target.value) || 0;
                        recalculateAllChannelsLive({ incLabor: true, laborCost: val });
                      }
                    })}
                  />
                </div>
              )}
            </div>

            {/* Escalón 4: Costos Fijos Prorrateados */}
            <div className={`border rounded-lg p-3 bg-white shadow-sm flex flex-col justify-between ${includeFixedCosts ? 'border-primary-sage' : 'opacity-80'}`}>
              <div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                    <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    <input
                      type="checkbox"
                      checked={includeFixedCosts}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIncludeFixedCosts(checked);
                        let fVal = Number(watch('allocatedFixedCosts')) || 0;
                        if (checked && fVal === 0) {
                          fVal = 250;
                          setValue('allocatedFixedCosts', fVal);
                        }
                        recalculateAllChannelsLive({ incFixed: checked, fixedCost: fVal });
                      }}
                    />
                    <span>🏢 Costos Fijos Prorrateados</span>
                  </label>
                  <span className="font-bold text-xs text-primary-sage">
                    + {formatCurrency(watchedFixedCost)}
                  </span>
                </div>
                {showStepHelp && (
                  <p className="text-[11px] text-text-muted m-0 mt-1">
                    Cuota de alquiler/servicios por unidad. Destildado suma $0.
                  </p>
                )}
              </div>
              {includeFixedCosts && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                  <span>Costo Fijo por unidad ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    className="input text-right font-semibold w-28 py-1 text-xs"
                    {...register('allocatedFixedCosts', {
                      onChange: (e) => {
                        const val = parseFloat(e.target.value) || 0;
                        recalculateAllChannelsLive({ incFixed: true, fixedCost: val });
                      }
                    })}
                  />
                </div>
              )}
            </div>

            {/* Escalón 5: Impuestos y Comisiones (Con switches independientes, sin mezclar) */}
            <div className="border rounded-lg p-3 bg-white shadow-sm flex flex-col gap-2">
              {/* Sub-switch Impuestos */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                  <span className="w-5 h-5 rounded-full bg-primary-sage text-white text-[11px] font-bold flex items-center justify-center">
                    5
                  </span>
                  <input
                    type="checkbox"
                    checked={includeTaxes}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIncludeTaxes(checked);
                      let tVal = Number(watch('taxPercentage')) || 0;
                      if (checked && tVal === 0) {
                        tVal = 21;
                        setValue('taxPercentage', tVal);
                      }
                      recalculateAllChannelsLive({ incTax: checked, taxPct: tVal });
                    }}
                  />
                  <span>🏛️ Impuestos sobre Venta (%)</span>
                </label>
                {includeTaxes ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      className="input text-right font-bold w-20 py-0.5 px-1.5 text-xs"
                      {...register('taxPercentage', {
                        onChange: (e) => {
                          const val = parseFloat(e.target.value) || 0;
                          recalculateAllChannelsLive({ incTax: true, taxPct: val });
                        }
                      })}
                    />
                    <span className="text-xs font-bold text-amber-700">%</span>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted font-medium">0% (Sin impuestos)</span>
                )}
              </div>

              {/* Sub-switch Comisiones de Canal (separado de Impuestos) */}
              <div className="flex items-center justify-between pt-1.5 border-t">
                <label className="flex items-center gap-2 text-xs font-bold text-text-dark cursor-pointer">
                  <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center">
                    6
                  </span>
                  <input
                    type="checkbox"
                    checked={includeCommissions}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIncludeCommissions(checked);
                      recalculateAllChannelsLive({ incComm: checked });
                    }}
                  />
                  <span>💳 Comisiones por Canal (%)</span>
                </label>
                <span className="text-xs font-medium text-purple-700">
                  {includeCommissions ? 'Habilitado por canal' : '0% (Sin comisión en precio)'}
                </span>
              </div>

              {showStepHelp && (
                <p className="text-[11px] text-text-muted m-0">
                  Impuestos y Comisiones se calculan por separado. Si están destildados no alteran el precio ni descuentan ganancia.
                </p>
              )}
            </div>
          </div>

          {/* Banner Resumen de Costo Total Unitario */}
          <div className="p-2.5 bg-primary-sage/10 rounded-lg border border-primary-sage flex justify-between items-center flex-wrap gap-2">
            <div className="text-xs text-text-dark">
              <strong>Suma de Costo Unitario:</strong>{' '}
              Base (<strong>{formatCurrency(watchedRawCost)}</strong>)
              {watchedPackCost > 0 ? ` + Empaque (${formatCurrency(watchedPackCost)})` : ''}
              {watchedLaborCost > 0 ? ` + Mano de Obra (${formatCurrency(watchedLaborCost)})` : ''}
              {watchedFixedCost > 0 ? ` + Fijos (${formatCurrency(watchedFixedCost)})` : ''}
            </div>
            <div className="text-sm font-bold text-primary-sage">
              = COSTO TOTAL UNITARIO: {formatCurrency(totalUnitCost)}
            </div>
          </div>

          {/* =====================================================================
              PRECIOS DE VENTA POR CANAL (CÁLCULO BIDIRECCIONAL EN VIVO)
             ===================================================================== */}
          <div className="flex items-center justify-between border-b pb-1">
            <h4 className="font-bold text-sm text-text-dark m-0">
              Formación del Precio de Venta por Canal (% Recargo ⇄ Precio Final $)
            </h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-xs py-1 px-2.5"
              onClick={() => recalculateAllChannelsLive()}
              title="Recalcular los precios finales según los escalones activos y el % de recargo"
            >
              ⚡ Aplicar Precios Sugeridos
            </button>
          </div>

          {/* Canal 1: Mostrador */}
          <div className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">🏪 Canal 1: Mostrador / Venta Presencial</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido: {formatCurrency(mostradorCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo s/Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage py-1"
                  {...register('mostradorMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const mComm = includeCommissions ? (Number(watch('mostradorCommissionPct')) || 0) : 0;
                      setValue('mostradorFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, mComm));
                    }
                  })}
                />
              </div>
              {includeCommissions && (
                <div>
                  <label className="mb-1 block font-semibold text-purple-800">% Comisión Mostrador</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input py-1"
                    {...register('mostradorCommissionPct', {
                      onChange: (e) => {
                        const comm = parseFloat(e.target.value) || 0;
                        const pct = Number(watch('mostradorMarginPct')) || 0;
                        setValue('mostradorFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, comm));
                      }
                    })}
                  />
                </div>
              )}
              <div className={includeCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={mostradorCalc.suggested.toString()}
                  className="input font-bold border-primary-sage py-1"
                  {...register('mostradorFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const mComm = includeCommissions ? (Number(watch('mostradorCommissionPct')) || 0) : 0;
                        const ded = (watchedTaxPct + mComm) / 100;
                        const netAfterDeductions = priceVal * (1 - ded);
                        const newPct = Number((((netAfterDeductions - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
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
          <div className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">📱 Canal 2: WhatsApp / Pedidos Directos</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido: {formatCurrency(whatsappCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo s/Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage py-1"
                  {...register('whatsappMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const wComm = includeCommissions ? (Number(watch('whatsappCommissionPct')) || 0) : 0;
                      setValue('whatsappFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, wComm));
                    }
                  })}
                />
              </div>
              {includeCommissions && (
                <div>
                  <label className="mb-1 block font-semibold text-purple-800">% Comisión WhatsApp</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input py-1"
                    {...register('whatsappCommissionPct', {
                      onChange: (e) => {
                        const comm = parseFloat(e.target.value) || 0;
                        const pct = Number(watch('whatsappMarginPct')) || 0;
                        setValue('whatsappFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, comm));
                      }
                    })}
                  />
                </div>
              )}
              <div className={includeCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={whatsappCalc.suggested.toString()}
                  className="input font-bold py-1"
                  {...register('whatsappFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const wComm = includeCommissions ? (Number(watch('whatsappCommissionPct')) || 0) : 0;
                        const ded = (watchedTaxPct + wComm) / 100;
                        const netAfterDeductions = priceVal * (1 - ded);
                        const newPct = Number((((netAfterDeductions - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
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
          <div className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm text-text-dark">🌐 Canal 3: Tienda Online / E-commerce</span>
              <span className="text-xs bg-green-50 text-primary-sage px-2 py-0.5 rounded font-semibold border border-green-200">
                Sugerido: {formatCurrency(onlineCalc.suggested)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-dark">
                  + % Recargo s/Costo ({formatCurrency(totalUnitCost)})
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input font-bold text-primary-sage py-1"
                  {...register('onlineMarginPct', {
                    onChange: (e) => {
                      const pct = parseFloat(e.target.value) || 0;
                      const oComm = includeCommissions ? (Number(watch('onlineCommissionPct')) || 0) : 0;
                      setValue('onlineFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, oComm));
                    }
                  })}
                />
              </div>
              {includeCommissions && (
                <div>
                  <label className="mb-1 block font-semibold text-purple-800">% Comisión Pasarela</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input py-1"
                    {...register('onlineCommissionPct', {
                      onChange: (e) => {
                        const comm = parseFloat(e.target.value) || 0;
                        const pct = Number(watch('onlineMarginPct')) || 0;
                        setValue('onlineFinalPrice', computeSuggestedChannelPrice(totalUnitCost, pct, watchedTaxPct, comm));
                      }
                    })}
                  />
                </div>
              )}
              <div className={includeCommissions ? '' : 'md:col-span-2'}>
                <label className="mb-1 block font-bold text-text-dark">
                  = Precio Final de Venta ($)
                </label>
                <input
                  type="number"
                  step="1"
                  placeholder={onlineCalc.suggested.toString()}
                  className="input font-bold py-1"
                  {...register('onlineFinalPrice', {
                    onChange: (e) => {
                      const priceVal = parseFloat(e.target.value) || 0;
                      if (totalUnitCost > 0 && priceVal > 0) {
                        const oComm = includeCommissions ? (Number(watch('onlineCommissionPct')) || 0) : 0;
                        const ded = (watchedTaxPct + oComm) / 100;
                        const netAfterDeductions = priceVal * (1 - ded);
                        const newPct = Number((((netAfterDeductions - totalUnitCost) / totalUnitCost) * 100).toFixed(1));
                        setValue('onlineMarginPct', newPct);
                      }
                    }
                  })}
                />
              </div>
            </div>
            {renderPriceBreakdownBar(onlineCalc)}
          </div>

          <div className="form-actions flex justify-end gap-3 mt-1 border-t pt-3">
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
