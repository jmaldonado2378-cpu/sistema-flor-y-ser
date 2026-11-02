import React, { useState, useEffect } from 'react';
import {
  usePricingStructures,
  useSavePricingStructure,
} from '../hooks/usePricing';
import { useFinalProducts, useRawMaterials } from '../hooks/useInventory';
import { usePackagingMaterials } from '../hooks/usePackaging';
import { useArticleFamilies } from '../hooks/useArticleFamilies';
import { useMerchandiseReceipts } from '../hooks/useReceipts';
import { useSettings, useUpdatePricingParameters, useUpdateCommissions } from '../hooks/useSettings';
import { Modal } from '../components/ui/Modal';
import { PriceListGeneratorModal } from '../components/pricing/PriceListGeneratorModal';
import { PricingStructure } from '../api/pricing';
import {
  Calculator,
  Settings,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
  Package,
  Sliders,
  ExternalLink,
  Save
} from 'lucide-react';

interface PricingPageProps {
  onTabChange?: (tab: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onTabChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGlobalConfigOpen, setIsGlobalConfigOpen] = useState(false);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros de la tabla principal
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [familyFilter, setFamilyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ELABORATED' | 'RESALE' | 'PACK'>('ALL');

  const { data: pricingData, isLoading: loadingPricing, isError: errorPricing, refetch } = usePricingStructures();
  const { data: finalProducts, isLoading: loadingProducts, refetch: refetchProducts } = useFinalProducts();
  const { data: rawMaterials } = useRawMaterials();
  const { data: packagingMaterials } = usePackagingMaterials();
  const { data: rawFamiliesData } = useArticleFamilies();
  const { data: receiptsData } = useMerchandiseReceipts();
  const { data: settingsData, refetch: refetchSettings } = useSettings();

  const savePricing = useSavePricingStructure();
  const updatePricingParams = useUpdatePricingParameters();
  const updateCommissions = useUpdateCommissions();

  const familiesList: any[] = Array.isArray(rawFamiliesData)
    ? rawFamiliesData
    : (rawFamiliesData && Array.isArray((rawFamiliesData as any).data) ? (rawFamiliesData as any).data : []);
  const receiptsList: any[] = Array.isArray(receiptsData) ? receiptsData : [];
  const pricingList: PricingStructure[] = Array.isArray(pricingData) ? pricingData : [];
  const products: any[] = Array.isArray(finalProducts) ? finalProducts : [];
  const raws: any[] = Array.isArray(rawMaterials) ? rawMaterials : [];
  const pkgs: any[] = Array.isArray(packagingMaterials) ? packagingMaterials : [];

  // Parámetros Globales desde el Panel de Configuración
  const globalPricingParams = settingsData?.pricingParameters || {
    fixedCostPercentage: 8.0,
    laborHourlyRate: 4000,
    defaultBatchHours: 2,
    defaultBatchUnits: 40,
    laborCostPercentage: 10.0,
    applyLaborToResale: false,
    taxPercentage: 0.0,
    roundingMultiple: 100,
    roundingMode: 'UP' as 'UP' | 'NEAREST',
    defaultMostradorMarginPct: 50,
    defaultWhatsappMarginPct: 45,
    defaultOnlineMarginPct: 40,
  };

  const globalCommissions = settingsData?.channelCommissions || {
    mostrador: 0.0,
    whatsapp: 2.5,
    tiendaOnline: 5.0,
    mercadoPago: 4.5,
    tarjetas: 3.5,
  };

  // Estado local del editor rápido de Parámetros Globales (sincronizado con Configuración)
  const [cfgFixedPct, setCfgFixedPct] = useState<number>(8.0);
  const [cfgLaborHourlyRate, setCfgLaborHourlyRate] = useState<number>(4000);
  const [cfgBatchHours, setCfgBatchHours] = useState<number>(2);
  const [cfgBatchUnits, setCfgBatchUnits] = useState<number>(40);
  const [cfgLaborPct, setCfgLaborPct] = useState<number>(10.0);
  const [cfgApplyLaborResale, setCfgApplyLaborResale] = useState<boolean>(false);
  const [cfgTaxPct, setCfgTaxPct] = useState<number>(0.0);
  const [cfgRoundingMultiple, setCfgRoundingMultiple] = useState<number>(100);
  const [cfgRoundingMode, setCfgRoundingMode] = useState<'UP' | 'NEAREST'>('UP');
  const [cfgCommMostrador, setCfgCommMostrador] = useState<number>(0);
  const [cfgCommWhatsapp, setCfgCommWhatsapp] = useState<number>(2.5);
  const [cfgCommOnline, setCfgCommOnline] = useState<number>(5.0);

  useEffect(() => {
    if (settingsData) {
      const pp = settingsData.pricingParameters || {};
      const cc = settingsData.channelCommissions || {};
      setCfgFixedPct(pp.fixedCostPercentage ?? 8.0);
      setCfgLaborHourlyRate(pp.laborHourlyRate ?? 4000);
      setCfgBatchHours(pp.defaultBatchHours ?? 2);
      setCfgBatchUnits(pp.defaultBatchUnits ?? 40);
      setCfgLaborPct(pp.laborCostPercentage ?? 10.0);
      setCfgApplyLaborResale(Boolean(pp.applyLaborToResale));
      setCfgTaxPct(pp.taxPercentage ?? 0.0);
      setCfgRoundingMultiple(pp.roundingMultiple ?? 100);
      setCfgRoundingMode(pp.roundingMode || 'UP');
      setCfgCommMostrador(cc.mostrador ?? 0);
      setCfgCommWhatsapp(cc.whatsapp ?? 2.5);
      setCfgCommOnline(cc.tiendaOnline ?? 5.0);
    }
  }, [settingsData]);

  // Estado del Producto seleccionado en el Modal de Tabla de Composición
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [batchHoursForProduct, setBatchHoursForProduct] = useState<number>(2);
  const [batchUnitsForProduct, setBatchUnitsForProduct] = useState<number>(40);
  const [laborModeForProduct, setLaborModeForProduct] = useState<'BATCH_INCIDENCE' | 'GLOBAL_PCT'>('BATCH_INCIDENCE');
  const [mostradorMarginPct, setMostradorMarginPct] = useState<number>(50);
  const [whatsappMarginPct, setWhatsappMarginPct] = useState<number>(45);
  const [onlineMarginPct, setOnlineMarginPct] = useState<number>(40);
  const [customMostradorPrice, setCustomMostradorPrice] = useState<number | null>(null);
  const [customWhatsappPrice, setCustomWhatsappPrice] = useState<number | null>(null);
  const [customOnlinePrice, setCustomOnlinePrice] = useState<number | null>(null);

  const formatCurrency = (val?: number, decimals = 0) =>
    (Number(val) || 0).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const isProductPack = (fp: any): boolean => {
    if (!fp) return false;
    if (fp.isPack) return true;
    if (
      Array.isArray(fp.ingredientsList) &&
      fp.ingredientsList.some(
        (ing: any) =>
          Boolean(ing?.isPackItem) ||
          (ing?.quantity !== undefined && Number(ing?.quantity) > 0 && !ing?.percentage)
      )
    ) {
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

  // Cálculo de costo de materia prima según conversión de unidad
  const calcRawCostWithUnits = (fp: any, rm: any): { cost: number; detail: string } => {
    if (!rm) return { cost: 0, detail: 'Sin materia prima asignada' };
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
    if (rawU === prodU) {
      factor = amt;
    } else if ((rawU === 'KG' && prodU === 'GRS') || (rawU === 'LTS' && prodU === 'ML')) {
      factor = amt / 1000;
    } else if ((rawU === 'GRS' && prodU === 'KG') || (rawU === 'ML' && prodU === 'LTS')) {
      factor = amt * 1000;
    } else {
      factor = amt >= 10 ? amt / 1000 : amt;
    }
    const cost = Math.round(factor * rawCostPerUnit * 100) / 100;
    return {
      cost,
      detail: `${rm.name} ($${rawCostPerUnit.toLocaleString('es-AR')}/${rawU} × ${amt} ${prodU})`,
    };
  };

  // Función que obtiene los componentes de la Ficha del Producto (Item 1: Compra/MP, Item 2: Envase Primario, Item 3: Etiqueta/Secundario)
  const getFichaProductCostBreakdown = (fp: any, savedPricing?: PricingStructure | null) => {
    if (!fp) {
      return {
        purchaseCost: 0,
        purchaseDetail: 'Sin producto',
        primaryPkgName: 'Sin envase primario',
        primaryPkgCost: 0,
        secondaryPkgName: 'Sin etiqueta / embalaje secundario',
        secondaryPkgCost: 0,
        packagingCost: 0,
        productCost: 0,
      };
    }

    const isPack = isProductPack(fp);
    const isResale = Boolean(fp.isResale) && !isPack;
    const baseRm = raws.find(r => r.id === fp.rawMaterialId);

    // 1. Costo de Compra / Materia Prima definido en la ficha
    let purchaseCost = 0;
    let purchaseDetail = '';

    if (isPack && Array.isArray(fp.ingredientsList) && fp.ingredientsList.length > 0) {
      purchaseCost = fp.ingredientsList.reduce(
        (sum: number, ing: any) => sum + (Number(ing.quantity) || 1) * (Number(ing.unitCost) || 0),
        0
      );
      if (!purchaseCost && fp.costPrice) purchaseCost = Number(fp.costPrice);
      purchaseDetail = `Pack / Combo (${fp.ingredientsList.length} integrantes en ficha)`;
    } else if (isResale) {
      purchaseCost = Number(fp.costPrice) || Number(baseRm?.costPerUnit) || Number(savedPricing?.rawMaterialCost) || 0;
      purchaseDetail = `Producto de Reventa${fp.supplierName ? ` • Prov: ${fp.supplierName}` : ''}`;
    } else if (fp.isBlend && Array.isArray(fp.ingredientsList) && fp.ingredientsList.length > 0) {
      const totalGrams = Number(fp.unitWeightGrams) || 500;
      purchaseCost = fp.ingredientsList.reduce((sum: number, ing: any) => {
        const rmItem = raws.find(r => r.id === ing.rawMaterialId);
        const pct = (Number(ing.percentage) || 0) / 100;
        const costKg = Number(rmItem?.costPerUnit) || 0;
        return sum + costKg * (totalGrams / 1000) * pct;
      }, 0);
      purchaseDetail = `Blend / Mix (${fp.ingredientsList.length} insumos para ${totalGrams}g)`;
    } else if (baseRm) {
      const conv = calcRawCostWithUnits(fp, baseRm);
      purchaseCost = conv.cost;
      purchaseDetail = conv.detail;
    } else {
      purchaseCost = Number(fp.costPrice) || Number(savedPricing?.rawMaterialCost) || 0;
      purchaseDetail = 'Costo base en ficha de producto';
    }

    // 2. Envase Primario y Etiqueta / Embalaje Secundario definidos en la ficha
    const primaryPkgObj = pkgs.find(pk => pk.id === fp.primaryPackagingId);
    const secondaryPkgObj = pkgs.find(pk => pk.id === fp.secondaryPackagingId);

    const primaryPkgName = fp.primaryPackagingName || primaryPkgObj?.name || 'Sin envase primario asignado';
    const primaryPkgCost = Number(fp.primaryPackagingCost ?? primaryPkgObj?.costPerUnit) || 0;

    const secondaryPkgName = fp.secondaryPackagingName || secondaryPkgObj?.name || 'Sin etiqueta / embalaje secundario';
    const secondaryPkgCost = Number(fp.secondaryPackagingCost ?? secondaryPkgObj?.costPerUnit) || 0;

    const totalFichaPkgCost = primaryPkgCost + secondaryPkgCost;
    const packagingCost = totalFichaPkgCost > 0
      ? totalFichaPkgCost
      : (!fp.primaryPackagingId && !fp.secondaryPackagingId && savedPricing?.packagingLabelCost && !isResale
          ? Number(savedPricing.packagingLabelCost)
          : 0);

    const productCost = purchaseCost + packagingCost;

    return {
      purchaseCost,
      purchaseDetail,
      primaryPkgName,
      primaryPkgCost,
      secondaryPkgName,
      secondaryPkgCost,
      packagingCost,
      productCost,
    };
  };

  // Redondeo según múltiplo y modo configurado
  const applyRoundingByMultiple = (exactPrice: number, multiple: number, mode: 'UP' | 'NEAREST'): number => {
    if (exactPrice <= 0) return 0;
    const mult = Math.max(1, Number(multiple) || 1);
    if (mult <= 1) return Math.round(exactPrice);
    if (mode === 'NEAREST') {
      return Math.round(exactPrice / mult) * mult;
    }
    return Math.ceil(exactPrice / mult) * mult;
  };

  // Cálculo completo ítem por ítem para un producto
  const computeFullComposition = (
    fp: any,
    savedPricing: PricingStructure | null,
    options?: {
      batchHours?: number;
      batchUnits?: number;
      laborMode?: 'BATCH_INCIDENCE' | 'GLOBAL_PCT';
      mMargin?: number;
      wMargin?: number;
      oMargin?: number;
      customMPrice?: number | null;
      customWPrice?: number | null;
      customOPrice?: number | null;
    }
  ) => {
    const ficha = getFichaProductCostBreakdown(fp, savedPricing);
    const costoProducto = ficha.productCost;

    const isPack = isProductPack(fp);
    const isResale = Boolean(fp?.isResale) && !isPack;

    // Ítem 4: Costo Fijo (% Global sobre Costo Producto)
    const fixedCostPct = Number(globalPricingParams.fixedCostPercentage) || 0;
    const fixedCostAmount = costoProducto * (fixedCostPct / 100);

    // Ítem 5: Mano de Obra (Opción C: Horas por Lote Procesado / % Incidencia sobre Costo Producto)
    const hourlyRate = Number(globalPricingParams.laborHourlyRate) || 0;
    const bHours = options?.batchHours ?? (Number(globalPricingParams.defaultBatchHours) || 2);
    const bUnits = Math.max(1, options?.batchUnits ?? (Number(globalPricingParams.defaultBatchUnits) || 40));
    const mode = options?.laborMode || 'BATCH_INCIDENCE';

    const batchTotalLaborCost = hourlyRate * bHours;
    const batchUnitLaborCost = batchTotalLaborCost / bUnits;

    let effectiveLaborPct = 0;
    let laborCostAmount = 0;

    if (isResale && !globalPricingParams.applyLaborToResale) {
      effectiveLaborPct = 0;
      laborCostAmount = 0;
    } else if (mode === 'BATCH_INCIDENCE' && costoProducto > 0) {
      // Opción C: El lote define el costo operativo por unidad y su % de incidencia sobre el Costo Producto
      effectiveLaborPct = (batchUnitLaborCost / costoProducto) * 100;
      laborCostAmount = costoProducto * (effectiveLaborPct / 100); // equivale a batchUnitLaborCost
    } else {
      effectiveLaborPct = Number(globalPricingParams.laborCostPercentage) || 0;
      laborCostAmount = costoProducto * (effectiveLaborPct / 100);
    }

    const totalUnitCost = costoProducto + fixedCostAmount + laborCostAmount;

    // Impuestos y Comisiones desde el Panel de Configuración
    const taxPct = Number(globalPricingParams.taxPercentage) || 0;
    const mCommPct = Number(globalCommissions.mostrador) || 0;
    const wCommPct = Number(globalCommissions.whatsapp) || 0;
    const oCommPct = Number(globalCommissions.tiendaOnline) || 0;

    const mMargin = options?.mMargin ?? (savedPricing?.channels?.mostrador?.marginPercentage ?? globalPricingParams.defaultMostradorMarginPct ?? 50);
    const wMargin = options?.wMargin ?? (savedPricing?.channels?.whatsapp?.marginPercentage ?? globalPricingParams.defaultWhatsappMarginPct ?? 45);
    const oMargin = options?.oMargin ?? (savedPricing?.channels?.tiendaOnline?.marginPercentage ?? globalPricingParams.defaultOnlineMarginPct ?? 40);

    const buildChannelColumn = (marginPct: number, commPct: number, customFinal: number | null | undefined) => {
      const marginAmount = totalUnitCost * (marginPct / 100);
      const basePlusMargin = totalUnitCost + marginAmount;
      const deductionRatio = (taxPct + commPct) / 100;
      const exactPrice =
        deductionRatio > 0 && deductionRatio < 0.95
          ? basePlusMargin / (1 - deductionRatio)
          : basePlusMargin * (1 + deductionRatio);

      const taxAmount = exactPrice * (taxPct / 100);
      const commAmount = exactPrice * (commPct / 100);

      const roundedSuggested = applyRoundingByMultiple(
        exactPrice,
        globalPricingParams.roundingMultiple || 100,
        globalPricingParams.roundingMode || 'UP'
      );

      const finalPrice = customFinal !== null && customFinal !== undefined && customFinal > 0
        ? customFinal
        : roundedSuggested;

      const roundingDiff = finalPrice - exactPrice;
      const finalTaxAmount = finalPrice * (taxPct / 100);
      const finalCommAmount = finalPrice * (commPct / 100);
      const netProfit = finalPrice - totalUnitCost - finalTaxAmount - finalCommAmount;
      const realMarkupPct = totalUnitCost > 0 ? (netProfit / totalUnitCost) * 100 : 0;

      return {
        marginPct,
        marginAmount,
        taxPct,
        taxAmount,
        commPct,
        commAmount,
        exactPrice,
        roundedSuggested,
        roundingDiff,
        finalPrice,
        netProfit,
        realMarkupPct,
      };
    };

    return {
      ficha,
      costoProducto,
      fixedCostPct,
      fixedCostAmount,
      hourlyRate,
      batchHours: bHours,
      batchUnits: bUnits,
      batchTotalLaborCost,
      batchUnitLaborCost,
      effectiveLaborPct,
      laborCostAmount,
      totalUnitCost,
      channels: {
        mostrador: buildChannelColumn(mMargin, mCommPct, options?.customMPrice),
        whatsapp: buildChannelColumn(wMargin, wCommPct, options?.customWPrice),
        tiendaOnline: buildChannelColumn(oMargin, oCommPct, options?.customOPrice),
      },
    };
  };

  // Combinar productos finales con sus estructuras guardadas
  const combinedList = products.map(fp => {
    const p = pricingList.find(item => item.productId === fp.id || item.productSku === fp.code);
    return {
      finalProduct: fp,
      pricingStructure: p || null,
    };
  });

  const displayList = combinedList.filter(({ finalProduct: fp }) => {
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

  const handleOpenConfigModal = (p?: PricingStructure | null, fpFallback?: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const matchedFp =
      fpFallback ||
      (p ? products.find(prod => prod.id === p.productId || prod.code === p.productSku) : products[0]);

    if (!matchedFp) return;

    setSelectedProductId(matchedFp.id);
    setBatchHoursForProduct(Number(globalPricingParams.defaultBatchHours) || 2);
    setBatchUnitsForProduct(Math.max(1, Number(globalPricingParams.defaultBatchUnits) || 40));
    setLaborModeForProduct('BATCH_INCIDENCE');

    setMostradorMarginPct(p?.channels?.mostrador?.marginPercentage ?? globalPricingParams.defaultMostradorMarginPct ?? 50);
    setWhatsappMarginPct(p?.channels?.whatsapp?.marginPercentage ?? globalPricingParams.defaultWhatsappMarginPct ?? 45);
    setOnlineMarginPct(p?.channels?.tiendaOnline?.marginPercentage ?? globalPricingParams.defaultOnlineMarginPct ?? 40);

    setCustomMostradorPrice(null);
    setCustomWhatsappPrice(null);
    setCustomOnlinePrice(null);

    setIsModalOpen(true);
  };

  const currentModalFp = products.find(p => p.id === selectedProductId);
  const currentModalSavedPricing = pricingList.find(item => item.productId === selectedProductId) || null;

  const modalCalc = currentModalFp
    ? computeFullComposition(currentModalFp, currentModalSavedPricing, {
        batchHours: batchHoursForProduct,
        batchUnits: batchUnitsForProduct,
        laborMode: laborModeForProduct,
        mMargin: mostradorMarginPct,
        wMargin: whatsappMarginPct,
        oMargin: onlineMarginPct,
        customMPrice: customMostradorPrice,
        customWPrice: customWhatsappPrice,
        customOPrice: customOnlinePrice,
      })
    : null;

  const handleSaveModalPricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentModalFp || !modalCalc) return;

    const dto = {
      productId: currentModalFp.id,
      productSku: currentModalFp.code || '',
      productName: currentModalFp.name || '',
      unitOfMeasure: currentModalFp.unit || 'unidades',
      rawMaterialCost: Math.round(modalCalc.ficha.purchaseCost * 100) / 100,
      packagingLabelCost: Math.round(modalCalc.ficha.packagingCost * 100) / 100,
      laborCost: Math.round(modalCalc.laborCostAmount * 100) / 100,
      allocatedFixedCosts: Math.round(modalCalc.fixedCostAmount * 100) / 100,
      taxPercentage: modalCalc.channels.mostrador.taxPct,
      channels: {
        mostrador: {
          commissionPercentage: modalCalc.channels.mostrador.commPct,
          marginPercentage: mostradorMarginPct,
          finalPrice: modalCalc.channels.mostrador.finalPrice,
        },
        whatsapp: {
          commissionPercentage: modalCalc.channels.whatsapp.commPct,
          marginPercentage: whatsappMarginPct,
          finalPrice: modalCalc.channels.whatsapp.finalPrice,
        },
        tiendaOnline: {
          commissionPercentage: modalCalc.channels.tiendaOnline.commPct,
          marginPercentage: onlineMarginPct,
          finalPrice: modalCalc.channels.tiendaOnline.finalPrice,
        },
      },
    };

    savePricing.mutate(dto, {
      onSuccess: () => {
        setSuccessMsg(
          `✅ Precio final de "${currentModalFp.name}" guardado (${formatCurrency(modalCalc.channels.mostrador.finalPrice)}) y sincronizado en el catálogo.`
        );
        setIsModalOpen(false);
        refetch();
        refetchProducts();
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Error al guardar la estructura de precios.');
      },
    });
  };

  const handleSaveQuickGlobalConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updatePricingParams.mutateAsync({
        fixedCostPercentage: Number(cfgFixedPct) || 0,
        laborHourlyRate: Number(cfgLaborHourlyRate) || 0,
        defaultBatchHours: Number(cfgBatchHours) || 1,
        defaultBatchUnits: Math.max(1, Number(cfgBatchUnits) || 1),
        laborCostPercentage: Number(cfgLaborPct) || 0,
        applyLaborToResale: Boolean(cfgApplyLaborResale),
        taxPercentage: Number(cfgTaxPct) || 0,
        roundingMultiple: Number(cfgRoundingMultiple) || 100,
        roundingMode: cfgRoundingMode,
      });
      await updateCommissions.mutateAsync({
        ...globalCommissions,
        mostrador: Number(cfgCommMostrador) || 0,
        whatsapp: Number(cfgCommWhatsapp) || 0,
        tiendaOnline: Number(cfgCommOnline) || 0,
      });
      await refetchSettings();
      setIsGlobalConfigOpen(false);
      setSuccessMsg('✅ Parámetros globales de Costo Fijo (%), Mano de Obra por Lote, Impuestos, Comisiones y Redondeo actualizados.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los parámetros globales.');
    }
  };

  const batchStandardUnitCost = Math.round(
    ((Number(globalPricingParams.laborHourlyRate) || 0) * (Number(globalPricingParams.defaultBatchHours) || 2)) /
      Math.max(1, Number(globalPricingParams.defaultBatchUnits) || 40)
  );

  return (
    <div className="page-container">
      <div className="page-header flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <Calculator className="text-primary-sage" />
            Estructura de Precios &amp; Costos
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Composición en tabla ítem por ítem: Costo Producto (Ficha) + Costo Fijo (%) + Mano de Obra (Por Lote) + Margen + Impuestos/Comisiones + Redondeo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsPriceListModalOpen(true)}
            className="btn btn-secondary flex items-center gap-1.5"
            style={{ borderColor: '#2E5339', color: '#2E5339', backgroundColor: '#E9EFEA', fontWeight: 600 }}
          >
            <Printer size={16} />
            📋 Lista de Precios PDF
          </button>
          <button
            onClick={() => setIsGlobalConfigOpen(!isGlobalConfigOpen)}
            className="btn btn-secondary flex items-center gap-1.5"
          >
            <Sliders size={16} />
            ⚙️ Parámetros del Panel ({globalPricingParams.fixedCostPercentage}% Fijo • Múltiplo ${globalPricingParams.roundingMultiple})
          </button>
          <button onClick={() => handleOpenConfigModal()} className="btn btn-primary flex items-center gap-2">
            <Calculator size={16} />
            Ver Tabla de Composición
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
          <button type="button" className="text-xs underline" onClick={() => setSuccessMsg(null)}>Cerrar</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-terracotta text-sm rounded-lg mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} /> {errorMsg}
          </div>
          <button type="button" className="text-xs underline" onClick={() => setErrorMsg(null)}>Cerrar</button>
        </div>
      )}

      {/* Resumen de Parámetros Globales Activos (Fijados en el Panel de Configuración) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="card p-3.5 border-l-4" style={{ borderLeftColor: '#2E5339' }}>
          <div className="text-[11px] font-bold uppercase text-text-muted">1. Costo Producto (Base)</div>
          <div className="text-sm font-bold text-text-dark mt-1">Compra + Envase + Etiqueta</div>
          <div className="text-xs text-text-muted mt-0.5">Tomado directo de la Ficha en Stock</div>
        </div>

        <div className="card p-3.5 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
          <div className="text-[11px] font-bold uppercase text-text-muted">2. Costo Fijo Global (%)</div>
          <div className="text-xl font-bold text-blue-700 mt-0.5">+{globalPricingParams.fixedCostPercentage}%</div>
          <div className="text-xs text-text-muted">Aplicado s/ Costo Producto</div>
        </div>

        <div className="card p-3.5 border-l-4" style={{ borderLeftColor: '#D97706' }}>
          <div className="text-[11px] font-bold uppercase text-text-muted">3. Mano de Obra (Opción C: Por Lote)</div>
          <div className="text-sm font-bold text-amber-800 mt-1">
            {formatCurrency(globalPricingParams.laborHourlyRate)}/h × {globalPricingParams.defaultBatchHours}h ÷ {globalPricingParams.defaultBatchUnits} u. = {formatCurrency(batchStandardUnitCost)}/u.
          </div>
          <div className="text-xs text-text-muted">
            Incidencia s/ Costo Producto (Reventa: {globalPricingParams.applyLaborToResale ? 'Sí' : '0%'})
          </div>
        </div>

        <div className="card p-3.5 border-l-4" style={{ borderLeftColor: '#8B5CF6' }}>
          <div className="text-[11px] font-bold uppercase text-text-muted">4. Impuestos &amp; Redondeo</div>
          <div className="text-sm font-bold text-purple-800 mt-1">
            Impuestos: {globalPricingParams.taxPercentage}% • Múltiplo: ${globalPricingParams.roundingMultiple}
          </div>
          <div className="text-xs text-text-muted">
            Redondeo {globalPricingParams.roundingMode === 'NEAREST' ? 'al más cercano' : 'siempre hacia arriba'}
          </div>
        </div>
      </div>

      {/* Panel Desplegable de Configuración Global Rápida */}
      {isGlobalConfigOpen && (
        <div className="card p-4 mb-5 bg-bg-linen border-2 border-primary-sage">
          <form onSubmit={handleSaveQuickGlobalConfig} className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-text-dark flex items-center gap-1.5 m-0">
                  <Settings size={16} className="text-primary-sage" />
                  Panel de Configuración Global de Costos, Mano de Obra (Por Lote), Impuestos y Redondeo
                </h3>
                <p className="text-xs text-text-muted m-0">
                  Cualquier cambio aquí se guarda en el Panel de Configuración del Sistema y actualiza toda la tabla de precios.
                </p>
              </div>
              <div className="flex gap-2">
                {onTabChange && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                    onClick={() => onTabChange('settings')}
                  >
                    <ExternalLink size={13} /> Abrir Panel Configuración Completo
                  </button>
                )}
                <button type="submit" className="btn btn-primary btn-sm text-xs flex items-center gap-1" disabled={updatePricingParams.isPending}>
                  <Save size={14} /> {updatePricingParams.isPending ? 'Guardando...' : 'Guardar en Configuración'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="font-bold text-text-dark block mb-1">% Costo Fijo Global</label>
                <input
                  type="number"
                  step="0.1"
                  className="input text-xs font-bold"
                  value={cfgFixedPct}
                  onChange={(e) => setCfgFixedPct(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-text-muted">s/ Costo Producto</span>
              </div>

              <div>
                <label className="font-bold text-text-dark block mb-1">Valor Hora M.O. ($/h)</label>
                <input
                  type="number"
                  step="50"
                  className="input text-xs font-bold"
                  value={cfgLaborHourlyRate}
                  onChange={(e) => setCfgLaborHourlyRate(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-text-muted">Opción C (Por lote)</span>
              </div>

              <div>
                <label className="font-bold text-text-dark block mb-1">Hs por Lote Estándar</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.1"
                  className="input text-xs font-bold"
                  value={cfgBatchHours}
                  onChange={(e) => setCfgBatchHours(parseFloat(e.target.value) || 0.5)}
                />
                <span className="text-[10px] text-text-muted">Horas procesadas</span>
              </div>

              <div>
                <label className="font-bold text-text-dark block mb-1">Unidades por Lote</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="input text-xs font-bold"
                  value={cfgBatchUnits}
                  onChange={(e) => setCfgBatchUnits(Math.max(1, parseFloat(e.target.value) || 1))}
                />
                <span className="text-[10px] text-text-muted">
                  = {formatCurrency((cfgLaborHourlyRate * cfgBatchHours) / Math.max(1, cfgBatchUnits))}/un.
                </span>
              </div>

              <div>
                <label className="font-bold text-text-dark block mb-1">% Impuestos Venta</label>
                <input
                  type="number"
                  step="0.1"
                  className="input text-xs font-bold"
                  value={cfgTaxPct}
                  onChange={(e) => setCfgTaxPct(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-text-muted">Fijado en panel</span>
              </div>

              <div>
                <label className="font-bold text-text-dark block mb-1">Múltiplo Redondeo</label>
                <select
                  className="input text-xs font-bold"
                  value={cfgRoundingMultiple}
                  onChange={(e) => setCfgRoundingMultiple(Number(e.target.value) || 100)}
                >
                  <option value={1}>Sin redondeo ($1)</option>
                  <option value={10}>Múltiplo de $10</option>
                  <option value={50}>Múltiplo de $50</option>
                  <option value={100}>Múltiplo de $100</option>
                  <option value={500}>Múltiplo de $500</option>
                  <option value={1000}>Múltiplo de $1.000</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t text-xs items-center">
              <div>
                <label className="font-semibold text-text-dark block mb-1">% Com. Mostrador / Local</label>
                <input
                  type="number"
                  step="0.1"
                  className="input text-xs"
                  value={cfgCommMostrador}
                  onChange={(e) => setCfgCommMostrador(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="font-semibold text-text-dark block mb-1">% Com. WhatsApp</label>
                <input
                  type="number"
                  step="0.1"
                  className="input text-xs"
                  value={cfgCommWhatsapp}
                  onChange={(e) => setCfgCommWhatsapp(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="font-semibold text-text-dark block mb-1">% Com. Tienda Online</label>
                <input
                  type="number"
                  step="0.1"
                  className="input text-xs"
                  value={cfgCommOnline}
                  onChange={(e) => setCfgCommOnline(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgApplyLaborResale}
                    onChange={(e) => setCfgApplyLaborResale(e.target.checked)}
                  />
                  <span>Aplicar M.O. en Reventa (por defecto 0%)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">Dirección:</span>
                  <select
                    className="input text-xs py-0.5"
                    value={cfgRoundingMode}
                    onChange={(e) => setCfgRoundingMode(e.target.value as 'UP' | 'NEAREST')}
                  >
                    <option value="UP">🔼 Hacia arriba</option>
                    <option value="NEAREST">⚖️ Más cercano</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tabla Principal de Productos con Desglose de Costos y Precio Redondeado */}
      <div className="card">
        <div className="card-header mb-4 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-text-dark">
            Tabla General de Costos y Precios Finales ({displayList.length} productos)
          </h2>
          {onTabChange && (
            <button
              type="button"
              onClick={() => onTabChange('stock')}
              className="text-xs font-semibold text-primary-sage hover:underline flex items-center gap-1"
            >
              <Package size={14} /> Ir a Stock para editar Costo de Compra o Envase en la Ficha →
            </button>
          )}
        </div>

        {/* Barra de Filtros */}
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
        </div>

        {loadingPricing || loadingProducts ? (
          <div className="py-8 text-center text-text-muted">Cargando catálogo de productos y estructura de costos...</div>
        ) : errorPricing ? (
          <div className="py-8 text-center text-terracotta">
            Error al consultar estructuras de precios.{' '}
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm mt-2">Reintentar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-xs">
              <thead>
                <tr>
                  <th>Producto / Familia</th>
                  <th className="text-right">1. Compra + Envase (Ficha)</th>
                  <th className="text-right">2. Costo Fijo ({globalPricingParams.fixedCostPercentage}%)</th>
                  <th className="text-right">3. Mano de Obra (Lote / %)</th>
                  <th className="text-right">= Costo Total Unit.</th>
                  <th className="text-right">🏪 Mostrador (Redondeado)</th>
                  <th className="text-right">📱 WhatsApp / 🌐 Web</th>
                  <th className="text-center">Composición</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(({ finalProduct: fp, pricingStructure: p }) => {
                  const comp = computeFullComposition(fp, p);
                  const isPack = isProductPack(fp);
                  const isResale = Boolean(fp.isResale) && !isPack;
                  const mostradorFinal = p?.channels?.mostrador?.finalPrice || comp.channels.mostrador.finalPrice;
                  const whatsappFinal = p?.channels?.whatsapp?.finalPrice || comp.channels.whatsapp.finalPrice;
                  const onlineFinal = p?.channels?.tiendaOnline?.finalPrice || comp.channels.tiendaOnline.finalPrice;

                  return (
                    <tr key={fp.id}>
                      <td>
                        <div className="font-semibold text-text-dark flex items-center gap-1.5 flex-wrap">
                          <span>{fp.name}</span>
                          <span className="text-[11px] text-text-muted font-normal">({fp.code})</span>
                          {isPack ? (
                            <span className="badge amber text-[10px]">🎁 Pack</span>
                          ) : isResale ? (
                            <span className="badge blue text-[10px]">🛍️ Reventa</span>
                          ) : fp.isBlend ? (
                            <span className="badge purple text-[10px]">📚 Blend</span>
                          ) : (
                            <span className="badge green text-[10px]">🏭 Fraccionado</span>
                          )}
                        </div>
                        <div className="text-[11px] text-text-muted">{getFamilyDisplayLabel(fp)}</div>
                      </td>

                      <td className="text-right">
                        <div className="font-bold text-text-dark">{formatCurrency(comp.costoProducto)}</div>
                        <div className="text-[10px] text-text-muted">
                          Compra: {formatCurrency(comp.ficha.purchaseCost)}
                          {comp.ficha.packagingCost > 0 ? ` + Env: ${formatCurrency(comp.ficha.packagingCost)}` : ''}
                        </div>
                      </td>

                      <td className="text-right">
                        <div className="font-medium text-blue-800">+{formatCurrency(comp.fixedCostAmount)}</div>
                        <div className="text-[10px] text-text-muted">{comp.fixedCostPct}% s/Costo Prod.</div>
                      </td>

                      <td className="text-right">
                        <div className="font-medium text-amber-800">+{formatCurrency(comp.laborCostAmount)}</div>
                        <div className="text-[10px] text-text-muted">
                          {comp.laborCostAmount > 0 ? `${comp.effectiveLaborPct.toFixed(1)}% s/Costo Prod.` : '0% (Reventa)'}
                        </div>
                      </td>

                      <td className="text-right font-bold text-text-dark bg-bg-linen/60">
                        {formatCurrency(comp.totalUnitCost)}
                      </td>

                      <td className="text-right">
                        <div className="font-bold text-sm text-primary-sage">{formatCurrency(mostradorFinal)}</div>
                        <div className="text-[10px] text-text-muted">
                          Margen +{comp.channels.mostrador.marginPct}% • Ganancia: {formatCurrency(comp.channels.mostrador.netProfit)}
                        </div>
                      </td>

                      <td className="text-right text-xs">
                        <div>WA: <strong>{formatCurrency(whatsappFinal)}</strong></div>
                        <div>Web: <strong>{formatCurrency(onlineFinal)}</strong></div>
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenConfigModal(p, fp)}
                          className="btn btn-primary btn-sm text-xs flex items-center gap-1 mx-auto"
                        >
                          <Calculator size={13} /> Ver Tabla Ítem x Ítem
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      No hay productos que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL REDISEÑADO: TABLA ÍTEM POR ÍTEM HASTA EL PRECIO FINAL CON REDONDEO
         ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="📊 Tabla de Composición Ítem por Ítem hasta el Precio Final"
        maxWidth="920px"
      >
        {modalCalc && currentModalFp && (
          <form onSubmit={handleSaveModalPricing} className="flex flex-col gap-4">
            {/* Selector de Producto y Acceso a Ficha */}
            <div className="p-3 bg-bg-linen rounded-lg border flex flex-wrap justify-between items-center gap-3">
              <div className="flex-1" style={{ minWidth: '280px' }}>
                <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                  Producto Analizado
                </label>
                <select
                  className="input font-bold text-sm w-full"
                  value={selectedProductId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const fp = products.find(prod => prod.id === pId);
                    const existingP = pricingList.find(item => item.productId === pId);
                    if (fp) {
                      handleOpenConfigModal(existingP || null, fp);
                    }
                  }}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {getFamilyDisplayLabel(p)} {isProductPack(p) ? '[Pack]' : p.isResale ? '[Reventa]' : '[Elaborado/Fracc.]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="badge gray text-xs">{getFamilyDisplayLabel(currentModalFp)}</span>
                  {isProductPack(currentModalFp) ? (
                    <span className="badge amber text-xs">🎁 Pack / Combo</span>
                  ) : currentModalFp.isResale ? (
                    <span className="badge blue text-xs">🛍️ Reventa Directa</span>
                  ) : (
                    <span className="badge green text-xs">🏭 Elaborado / Fraccionado</span>
                  )}
                </div>
                {onTabChange && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      onTabChange('stock');
                    }}
                    className="text-xs text-primary-sage font-semibold hover:underline flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Editar Compra o Envases en Ficha de Stock
                  </button>
                )}
              </div>
            </div>

            {/* ===================================================================
                TABLA PARTE 1: COMPOSICIÓN DEL COSTO PRODUCTO Y COSTO TOTAL UNITARIO
               =================================================================== */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-primary-sage text-white px-3.5 py-2 flex justify-between items-center text-xs font-bold">
                <span>PARTE 1 — COMPOSICIÓN DEL COSTO UNITARIO (FICHA + PANEL DE CONFIGURACIÓN)</span>
                <span>Múltiplo de Redondeo Activo: ${globalPricingParams.roundingMultiple} ({globalPricingParams.roundingMode === 'NEAREST' ? 'Más cercano' : 'Hacia arriba'})</span>
              </div>

              <table className="data-table w-full text-xs">
                <thead>
                  <tr className="bg-bg-linen">
                    <th style={{ width: '42px' }}>#</th>
                    <th>Concepto / Ítem de Costo</th>
                    <th>Origen / Base de Cálculo</th>
                    <th className="text-center">% Incidencia</th>
                    <th className="text-right">Importe Unitario ($)</th>
                    <th className="text-right">Subtotal Acumulado ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Ítem 1: Costo de Compra / Materia Prima */}
                  <tr>
                    <td className="font-bold text-center text-primary-sage">1</td>
                    <td className="font-semibold text-text-dark">Costo de Compra / Materia Prima</td>
                    <td className="text-text-muted">
                      Ficha de Producto: <strong className="text-text-dark">{modalCalc.ficha.purchaseDetail}</strong>
                    </td>
                    <td className="text-center text-text-muted">—</td>
                    <td className="text-right font-semibold">{formatCurrency(modalCalc.ficha.purchaseCost, 2)}</td>
                    <td className="text-right font-semibold">{formatCurrency(modalCalc.ficha.purchaseCost, 2)}</td>
                  </tr>

                  {/* Ítem 2: Envase Primario */}
                  <tr>
                    <td className="font-bold text-center text-primary-sage">2</td>
                    <td className="font-semibold text-text-dark">Envase Primario</td>
                    <td className="text-text-muted">
                      Ficha de Producto: <strong className="text-text-dark">📦 {modalCalc.ficha.primaryPkgName}</strong>
                    </td>
                    <td className="text-center text-text-muted">—</td>
                    <td className="text-right font-semibold">+{formatCurrency(modalCalc.ficha.primaryPkgCost, 2)}</td>
                    <td className="text-right font-semibold">
                      {formatCurrency(modalCalc.ficha.purchaseCost + modalCalc.ficha.primaryPkgCost, 2)}
                    </td>
                  </tr>

                  {/* Ítem 3: Etiqueta / Embalaje Secundario */}
                  <tr>
                    <td className="font-bold text-center text-primary-sage">3</td>
                    <td className="font-semibold text-text-dark">Etiqueta / Embalaje Secundario</td>
                    <td className="text-text-muted">
                      Ficha de Producto: <strong className="text-text-dark">🏷️ {modalCalc.ficha.secondaryPkgName}</strong>
                    </td>
                    <td className="text-center text-text-muted">—</td>
                    <td className="text-right font-semibold">+{formatCurrency(modalCalc.ficha.secondaryPkgCost, 2)}</td>
                    <td className="text-right font-semibold">{formatCurrency(modalCalc.costoProducto, 2)}</td>
                  </tr>

                  {/* SUBTOTAL 1: COSTO PRODUCTO */}
                  <tr style={{ backgroundColor: '#E9EFEA', fontWeight: 700 }}>
                    <td className="text-center text-primary-sage">=</td>
                    <td className="text-primary-sage font-bold">COSTO PRODUCTO (Compra + Envase/Embalaje)</td>
                    <td className="text-xs text-primary-sage">Suma Ítems 1 + 2 + 3 (Definido en la Ficha)</td>
                    <td className="text-center">
                      <span className="badge green text-[10px]">Base 100%</span>
                    </td>
                    <td className="text-right text-primary-sage">{formatCurrency(modalCalc.costoProducto, 2)}</td>
                    <td className="text-right text-sm text-primary-sage">{formatCurrency(modalCalc.costoProducto, 2)}</td>
                  </tr>

                  {/* Ítem 4: Costo Fijo Global (%) */}
                  <tr>
                    <td className="font-bold text-center text-blue-700">4</td>
                    <td className="font-semibold text-text-dark">Costo Fijo Global (%)</td>
                    <td className="text-text-muted">
                      Panel de Configuración (<strong>{modalCalc.fixedCostPct}%</strong> sobre Costo Producto de {formatCurrency(modalCalc.costoProducto)})
                    </td>
                    <td className="text-center font-bold text-blue-700">+{modalCalc.fixedCostPct}%</td>
                    <td className="text-right font-semibold text-blue-800">+{formatCurrency(modalCalc.fixedCostAmount, 2)}</td>
                    <td className="text-right font-semibold">
                      {formatCurrency(modalCalc.costoProducto + modalCalc.fixedCostAmount, 2)}
                    </td>
                  </tr>

                  {/* Ítem 5: Mano de Obra (Opción C: Horas por Lote Procesado / Incidencia %) */}
                  <tr>
                    <td className="font-bold text-center text-amber-700">5</td>
                    <td className="font-semibold text-text-dark">
                      Mano de Obra (Opción C: Lote Procesado)
                    </td>
                    <td>
                      {currentModalFp.isResale && !globalPricingParams.applyLaborToResale ? (
                        <span className="text-text-muted">
                          Producto de Reventa Directa (Sin proceso de fraccionado = <strong>0%</strong>)
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-text-muted">
                            Valor Hora: <strong>{formatCurrency(modalCalc.hourlyRate)}/h</strong> ×
                          </span>
                          <label className="flex items-center gap-1">
                            <span>Hs Lote:</span>
                            <input
                              type="number"
                              step="0.25"
                              min="0.1"
                              className="input text-xs py-0.5 px-1.5 w-16 font-bold text-center"
                              value={batchHoursForProduct}
                              onChange={(e) => setBatchHoursForProduct(parseFloat(e.target.value) || 0.5)}
                            />
                          </label>
                          <label className="flex items-center gap-1">
                            <span>÷ Unid. Lote:</span>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              className="input text-xs py-0.5 px-1.5 w-16 font-bold text-center"
                              value={batchUnitsForProduct}
                              onChange={(e) => setBatchUnitsForProduct(Math.max(1, parseFloat(e.target.value) || 1))}
                            />
                          </label>
                          <span className="text-[11px] text-amber-900 font-semibold">
                            (= {formatCurrency(modalCalc.batchUnitLaborCost)}/u.)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="text-center font-bold text-amber-800">
                      +{modalCalc.effectiveLaborPct.toFixed(1)}%
                    </td>
                    <td className="text-right font-semibold text-amber-800">
                      +{formatCurrency(modalCalc.laborCostAmount, 2)}
                    </td>
                    <td className="text-right font-semibold">
                      {formatCurrency(modalCalc.totalUnitCost, 2)}
                    </td>
                  </tr>

                  {/* SUBTOTAL 2: COSTO TOTAL UNITARIO */}
                  <tr style={{ backgroundColor: '#FEF3C7', fontWeight: 700 }}>
                    <td className="text-center text-amber-900">=</td>
                    <td className="text-amber-900 font-bold">COSTO TOTAL UNITARIO</td>
                    <td className="text-xs text-amber-900">
                      Costo Producto ({formatCurrency(modalCalc.costoProducto)}) + Costo Fijo ({formatCurrency(modalCalc.fixedCostAmount)}) + Mano de Obra ({formatCurrency(modalCalc.laborCostAmount)})
                    </td>
                    <td className="text-center font-bold text-amber-900">
                      +{(modalCalc.fixedCostPct + modalCalc.effectiveLaborPct).toFixed(1)}% s/Prod.
                    </td>
                    <td className="text-right text-amber-900">{formatCurrency(modalCalc.totalUnitCost, 2)}</td>
                    <td className="text-right text-sm text-amber-900">{formatCurrency(modalCalc.totalUnitCost, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ===================================================================
                TABLA PARTE 2: FORMACIÓN DEL PRECIO POR CANAL HASTA REDONDEO FINAL
               =================================================================== */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-text-dark text-white px-3.5 py-2 flex justify-between items-center text-xs font-bold">
                <span>PARTE 2 — FORMACIÓN DEL PRECIO POR CANAL HASTA PRECIO FINAL REDONDEADO</span>
                <span>Impuestos Panel: {globalPricingParams.taxPercentage}% • Comisiones Panel: Mostrador {globalCommissions.mostrador}% | WA {globalCommissions.whatsapp}% | Web {globalCommissions.tiendaOnline}%</span>
              </div>

              <table className="data-table w-full text-xs">
                <thead>
                  <tr className="bg-bg-linen">
                    <th style={{ width: '42px' }}>#</th>
                    <th>Concepto / Escalón</th>
                    <th>Base de Cálculo</th>
                    <th className="text-right">🏪 Canal Mostrador</th>
                    <th className="text-right">📱 Canal WhatsApp</th>
                    <th className="text-right">🌐 Canal Tienda Online</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base: Costo Total Unitario */}
                  <tr className="bg-amber-50/40 font-semibold">
                    <td className="text-center">Base</td>
                    <td>Costo Total Unitario</td>
                    <td className="text-text-muted">Suma ítems 1 a 5</td>
                    <td className="text-right">{formatCurrency(modalCalc.totalUnitCost, 2)}</td>
                    <td className="text-right">{formatCurrency(modalCalc.totalUnitCost, 2)}</td>
                    <td className="text-right">{formatCurrency(modalCalc.totalUnitCost, 2)}</td>
                  </tr>

                  {/* Ítem 6: Margen de Ganancia (%) */}
                  <tr>
                    <td className="font-bold text-center text-primary-sage">6</td>
                    <td className="font-semibold text-text-dark">+ Margen de Ganancia (%)</td>
                    <td className="text-text-muted">% sobre Costo Total Unitario</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input text-xs font-bold text-right w-16 py-0.5 px-1.5 text-primary-sage"
                          value={mostradorMarginPct}
                          onChange={(e) => {
                            setMostradorMarginPct(parseFloat(e.target.value) || 0);
                            setCustomMostradorPrice(null);
                          }}
                        />
                        <span className="font-bold text-primary-sage">%</span>
                        <span className="text-text-muted">
                          (+{formatCurrency(modalCalc.channels.mostrador.marginAmount, 0)})
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input text-xs font-bold text-right w-16 py-0.5 px-1.5 text-primary-sage"
                          value={whatsappMarginPct}
                          onChange={(e) => {
                            setWhatsappMarginPct(parseFloat(e.target.value) || 0);
                            setCustomWhatsappPrice(null);
                          }}
                        />
                        <span className="font-bold text-primary-sage">%</span>
                        <span className="text-text-muted">
                          (+{formatCurrency(modalCalc.channels.whatsapp.marginAmount, 0)})
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input text-xs font-bold text-right w-16 py-0.5 px-1.5 text-primary-sage"
                          value={onlineMarginPct}
                          onChange={(e) => {
                            setOnlineMarginPct(parseFloat(e.target.value) || 0);
                            setCustomOnlinePrice(null);
                          }}
                        />
                        <span className="font-bold text-primary-sage">%</span>
                        <span className="text-text-muted">
                          (+{formatCurrency(modalCalc.channels.tiendaOnline.marginAmount, 0)})
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Ítem 7: Impuestos sobre Venta (%) */}
                  <tr>
                    <td className="font-bold text-center text-amber-700">7</td>
                    <td className="font-semibold text-text-dark">+ Impuestos sobre Venta (%)</td>
                    <td className="text-text-muted">
                      Fijado en Panel de Configuración ({modalCalc.channels.mostrador.taxPct}%)
                    </td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.mostrador.taxAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.mostrador.taxPct}%)</span>
                    </td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.whatsapp.taxAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.whatsapp.taxPct}%)</span>
                    </td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.tiendaOnline.taxAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.tiendaOnline.taxPct}%)</span>
                    </td>
                  </tr>

                  {/* Ítem 8: Comisión por Canal (%) */}
                  <tr>
                    <td className="font-bold text-center text-purple-700">8</td>
                    <td className="font-semibold text-text-dark">+ Comisión del Canal (%)</td>
                    <td className="text-text-muted">Fijado en Panel de Configuración</td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.mostrador.commAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.mostrador.commPct}%)</span>
                    </td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.whatsapp.commAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.whatsapp.commPct}%)</span>
                    </td>
                    <td className="text-right">
                      +{formatCurrency(modalCalc.channels.tiendaOnline.commAmount, 2)}{' '}
                      <span className="text-[10px] text-text-muted">({modalCalc.channels.tiendaOnline.commPct}%)</span>
                    </td>
                  </tr>

                  {/* SUBTOTAL 3: PRECIO CALCULADO EXACTO */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="text-center">=</td>
                    <td>PRECIO CALCULADO (Exacto sin redondear)</td>
                    <td className="text-text-muted">Costo Total + Margen + Impuestos + Comisión</td>
                    <td className="text-right">{formatCurrency(modalCalc.channels.mostrador.exactPrice, 2)}</td>
                    <td className="text-right">{formatCurrency(modalCalc.channels.whatsapp.exactPrice, 2)}</td>
                    <td className="text-right">{formatCurrency(modalCalc.channels.tiendaOnline.exactPrice, 2)}</td>
                  </tr>

                  {/* Ítem 9: Ajuste por Redondeo (Múltiplo) */}
                  <tr>
                    <td className="font-bold text-center text-primary-sage">9</td>
                    <td className="font-semibold text-text-dark">Ajuste por Redondeo</td>
                    <td className="text-text-muted">
                      Múltiplo de <strong>${globalPricingParams.roundingMultiple}</strong> ({globalPricingParams.roundingMode === 'NEAREST' ? 'Al más cercano' : 'Hacia arriba'})
                    </td>
                    <td className="text-right font-medium text-primary-sage">
                      {modalCalc.channels.mostrador.roundingDiff >= 0 ? '+' : ''}
                      {formatCurrency(modalCalc.channels.mostrador.roundingDiff, 2)}
                    </td>
                    <td className="text-right font-medium text-primary-sage">
                      {modalCalc.channels.whatsapp.roundingDiff >= 0 ? '+' : ''}
                      {formatCurrency(modalCalc.channels.whatsapp.roundingDiff, 2)}
                    </td>
                    <td className="text-right font-medium text-primary-sage">
                      {modalCalc.channels.tiendaOnline.roundingDiff >= 0 ? '+' : ''}
                      {formatCurrency(modalCalc.channels.tiendaOnline.roundingDiff, 2)}
                    </td>
                  </tr>

                  {/* FILA FINAL: PRECIO FINAL REDONDEADO */}
                  <tr style={{ backgroundColor: '#E9EFEA', fontWeight: 800 }}>
                    <td className="text-center text-primary-sage text-sm">★</td>
                    <td className="text-primary-sage text-sm font-bold">PRECIO FINAL REDONDEADO ($)</td>
                    <td className="text-xs text-primary-sage">Precio final de venta al público</td>
                    <td className="text-right">
                      <input
                        type="number"
                        step={globalPricingParams.roundingMultiple || 10}
                        className="input font-bold text-right text-sm w-28 py-1 border-primary-sage text-primary-sage"
                        value={modalCalc.channels.mostrador.finalPrice}
                        onChange={(e) => setCustomMostradorPrice(parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        step={globalPricingParams.roundingMultiple || 10}
                        className="input font-bold text-right text-sm w-28 py-1 border-primary-sage text-primary-sage"
                        value={modalCalc.channels.whatsapp.finalPrice}
                        onChange={(e) => setCustomWhatsappPrice(parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="text-right">
                      <input
                        type="number"
                        step={globalPricingParams.roundingMultiple || 10}
                        className="input font-bold text-right text-sm w-28 py-1 border-primary-sage text-primary-sage"
                        value={modalCalc.channels.tiendaOnline.finalPrice}
                        onChange={(e) => setCustomOnlinePrice(parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  </tr>

                  {/* Fila de Ganancia Neta Limpia en Mano */}
                  <tr className="bg-green-50/50">
                    <td className="text-center font-bold text-green-800">✓</td>
                    <td className="font-bold text-green-900">Ganancia Limpia en Mano ($)</td>
                    <td className="text-text-muted">Precio Final − Costo Total − Impuestos − Comisión</td>
                    <td className="text-right font-bold text-green-800">
                      {formatCurrency(modalCalc.channels.mostrador.netProfit)} ({modalCalc.channels.mostrador.realMarkupPct.toFixed(1)}%)
                    </td>
                    <td className="text-right font-bold text-green-800">
                      {formatCurrency(modalCalc.channels.whatsapp.netProfit)} ({modalCalc.channels.whatsapp.realMarkupPct.toFixed(1)}%)
                    </td>
                    <td className="text-right font-bold text-green-800">
                      {formatCurrency(modalCalc.channels.tiendaOnline.netProfit)} ({modalCalc.channels.tiendaOnline.realMarkupPct.toFixed(1)}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="form-actions flex justify-between items-center border-t pt-3">
              <span className="text-xs text-text-muted">
                Al guardar, el Precio Final de Mostrador (<strong>{formatCurrency(modalCalc.channels.mostrador.finalPrice)}</strong>) actualiza automáticamente el precio del producto en Stock y Punto de Venta.
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savePricing.isPending}>
                  {savePricing.isPending ? 'Guardando...' : '💾 Guardar Precios Finales'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Generador de Lista de Precios en PDF con Logo */}
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
