import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  usePricingStructures, 
  useSavePricingStructure, 
  useAllocateFixedCosts 
} from '../hooks/usePricing';
import { useFinalProducts, useRawMaterials } from '../hooks/useInventory';
import { usePackagingMaterials } from '../hooks/usePackaging';
import { Modal } from '../components/ui/Modal';
import { PricingStructure } from '../api/pricing';
import { Calculator, Settings, RefreshCw, DollarSign, CheckCircle2, AlertCircle, PlusCircle, Layers, CheckSquare, Square } from 'lucide-react';

interface PricingPageProps {
  onTabChange?: (tab: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductPricing, setSelectedProductPricing] = useState<PricingStructure | null>(null);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string>('');
  const [selectedPackagingIds, setSelectedPackagingIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: pricingData, isLoading: loadingPricing, isError: errorPricing, refetch } = usePricingStructures();
  const { data: finalProducts, isLoading: loadingProducts } = useFinalProducts();
  const { data: rawMaterials } = useRawMaterials();
  const { data: packagingMaterials } = usePackagingMaterials();

  const savePricing = useSavePricingStructure();
  const allocateFixed = useAllocateFixedCosts();

  const formatCurrency = (val?: number) => (val || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const pricingList: PricingStructure[] = Array.isArray(pricingData) ? pricingData : [];
  const products = Array.isArray(finalProducts) ? finalProducts : [];
  const raws = Array.isArray(rawMaterials) ? rawMaterials : [];
  const pkgs = Array.isArray(packagingMaterials) ? packagingMaterials : [];

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

  const displayList = combinedList.length > 0 ? combinedList : fallbackList;

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
      taxPercentage: 21,
      mostradorCommissionPct: 0,
      mostradorMarginPct: 35,
      mostradorFinalPrice: 0,
      whatsappCommissionPct: 2,
      whatsappMarginPct: 30,
      whatsappFinalPrice: 0,
      onlineCommissionPct: 5,
      onlineMarginPct: 25,
      onlineFinalPrice: 0,
    }
  });

  const watchedRawCost = watch('rawMaterialCost') || 0;
  const watchedPackCost = watch('packagingLabelCost') || 0;
  const watchedLaborCost = watch('laborCost') || 0;
  const watchedFixedCost = watch('allocatedFixedCosts') || 0;
  const watchedTaxPct = watch('taxPercentage') || 0;

  const totalDirectCost = Number(watchedRawCost) + Number(watchedPackCost) + Number(watchedLaborCost);
  const totalUnitCost = totalDirectCost + Number(watchedFixedCost);

  // Helper para calcular métricas simuladas por canal
  const calcChannelMetrics = (commPct: number, marginPct: number, customFinalPrice: number) => {
    const targetMargin = totalUnitCost * (1 + marginPct / 100);
    const deductionsRatio = (Number(watchedTaxPct) + Number(commPct)) / 100;
    
    let suggested = 0;
    if (deductionsRatio < 1) {
      suggested = targetMargin / (1 - deductionsRatio);
    } else {
      suggested = targetMargin * (1 + deductionsRatio);
    }
    suggested = Math.round(suggested);

    const finalPrice = customFinalPrice > 0 ? customFinalPrice : suggested;
    const commDeduction = finalPrice * (commPct / 100);
    const taxDeduction = finalPrice * (watchedTaxPct / 100);
    const profit = finalPrice - (totalUnitCost + commDeduction + taxDeduction);
    const realMargin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;

    return { suggested, finalPrice, profit, realMargin };
  };

  const mostradorCalc = calcChannelMetrics(watch('mostradorCommissionPct'), watch('mostradorMarginPct'), watch('mostradorFinalPrice'));
  const whatsappCalc = calcChannelMetrics(watch('whatsappCommissionPct'), watch('whatsappMarginPct'), watch('whatsappFinalPrice'));
  const onlineCalc = calcChannelMetrics(watch('onlineCommissionPct'), watch('onlineMarginPct'), watch('onlineFinalPrice'));

  const handleOpenConfigModal = (p?: PricingStructure | null, fpFallback?: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const matchedFp = fpFallback || (p ? products.find(prod => prod.id === p.productId || prod.code === p.productSku) : null);
    const baseRm = matchedFp ? raws.find(rm => rm.id === matchedFp.rawMaterialId) : null;
    
    // Auto calcular costo de materia prima base según peso unitario
    let calculatedRawCost = p?.rawMaterialCost || 0;
    if (!p && matchedFp && baseRm) {
      const weightKg = (matchedFp.unitWeightGrams || 500) / 1000;
      calculatedRawCost = Math.round(weightKg * (baseRm.costPerUnit || 0));
    } else if (!p && matchedFp) {
      calculatedRawCost = Math.round((matchedFp.price || 0) * 0.4);
    }

    // Seleccionar por defecto bolsa y etiqueta si existen
    const defaultPkgs = pkgs.filter(pkg => pkg.category === 'DOYPACK' || pkg.category === 'LABEL');
    const initialPkgIds = defaultPkgs.map(item => item.id);
    const calculatedPkgCost = p?.packagingLabelCost || defaultPkgs.reduce((sum, item) => sum + item.costPerUnit, 0);

    setSelectedRawMaterialId(baseRm ? baseRm.id : '');
    setSelectedPackagingIds(initialPkgIds);

    if (p) {
      setSelectedProductPricing(p);
      reset({
        productId: p.productId,
        productSku: p.productSku || matchedFp?.code || '',
        productName: p.productName || matchedFp?.name || '',
        unitOfMeasure: p.unitOfMeasure || 'unidades',
        rawMaterialCost: p.rawMaterialCost || calculatedRawCost,
        packagingLabelCost: p.packagingLabelCost || calculatedPkgCost,
        laborCost: p.laborCost || 150,
        allocatedFixedCosts: p.allocatedFixedCosts || 250,
        taxPercentage: p.taxPercentage !== undefined ? p.taxPercentage : 21,
        mostradorCommissionPct: p.channels?.mostrador?.commissionPercentage || 0,
        mostradorMarginPct: p.channels?.mostrador?.marginPercentage || 35,
        mostradorFinalPrice: p.channels?.mostrador?.finalPrice || matchedFp?.price || 0,
        whatsappCommissionPct: p.channels?.whatsapp?.commissionPercentage || 2,
        whatsappMarginPct: p.channels?.whatsapp?.marginPercentage || 30,
        whatsappFinalPrice: p.channels?.whatsapp?.finalPrice || 0,
        onlineCommissionPct: p.channels?.tiendaOnline?.commissionPercentage || 5,
        onlineMarginPct: p.channels?.tiendaOnline?.marginPercentage || 25,
        onlineFinalPrice: p.channels?.tiendaOnline?.finalPrice || 0,
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
        laborCost: 150,
        allocatedFixedCosts: 250,
        taxPercentage: 21,
        mostradorCommissionPct: 0,
        mostradorMarginPct: 35,
        mostradorFinalPrice: matchedFp.price || 0,
        whatsappCommissionPct: 2,
        whatsappMarginPct: 30,
        whatsappFinalPrice: Math.round((matchedFp.price || 0) * 0.95),
        onlineCommissionPct: 5,
        onlineMarginPct: 25,
        onlineFinalPrice: Math.round((matchedFp.price || 0) * 0.95),
      });
    } else {
      setSelectedProductPricing(null);
      const defaultProd = products[0];
      reset({
        productId: defaultProd?.id || '',
        productSku: defaultProd?.code || '',
        productName: defaultProd?.name || '',
        unitOfMeasure: 'unidades',
        rawMaterialCost: 1000,
        packagingLabelCost: 155,
        laborCost: 150,
        allocatedFixedCosts: 250,
        taxPercentage: 21,
        mostradorCommissionPct: 0,
        mostradorMarginPct: 35,
        mostradorFinalPrice: defaultProd?.price || 0,
        whatsappCommissionPct: 2,
        whatsappMarginPct: 30,
        whatsappFinalPrice: 0,
        onlineCommissionPct: 5,
        onlineMarginPct: 25,
        onlineFinalPrice: 0,
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
      return sum + (item ? item.costPerUnit : 0);
    }, 0);

    setValue('packagingLabelCost', totalCost);
  };

  const onSubmitSave = (formData: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    const dto = {
      productId: formData.productId,
      productSku: formData.productSku,
      productName: formData.productName,
      unitOfMeasure: formData.unitOfMeasure,
      rawMaterialCost: Number(formData.rawMaterialCost),
      packagingLabelCost: Number(formData.packagingLabelCost),
      laborCost: Number(formData.laborCost),
      allocatedFixedCosts: Number(formData.allocatedFixedCosts),
      taxPercentage: Number(formData.taxPercentage),
      channels: {
        mostrador: {
          commissionPercentage: Number(formData.mostradorCommissionPct),
          marginPercentage: Number(formData.mostradorMarginPct),
          finalPrice: Number(formData.mostradorFinalPrice) > 0 ? Number(formData.mostradorFinalPrice) : mostradorCalc.suggested
        },
        whatsapp: {
          commissionPercentage: Number(formData.whatsappCommissionPct),
          marginPercentage: Number(formData.whatsappMarginPct),
          finalPrice: Number(formData.whatsappFinalPrice) > 0 ? Number(formData.whatsappFinalPrice) : whatsappCalc.suggested
        },
        tiendaOnline: {
          commissionPercentage: Number(formData.onlineCommissionPct),
          marginPercentage: Number(formData.onlineMarginPct),
          finalPrice: Number(formData.onlineFinalPrice) > 0 ? Number(formData.onlineFinalPrice) : onlineCalc.suggested
        }
      }
    };

    savePricing.mutate(dto, {
      onSuccess: () => {
        setSuccessMsg('✅ Estructura de precios guardada correctamente.');
        setIsModalOpen(false);
        refetch();
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
    : '35.0';
  const avgWhatsappMargin = pricingList.length > 0 
    ? (pricingList.reduce((acc, p) => acc + (p.channels?.whatsapp?.marginPercentage || 0), 0) / pricingList.length).toFixed(1)
    : '30.0';
  const avgOnlineMargin = pricingList.length > 0 
    ? (pricingList.reduce((acc, p) => acc + (p.channels?.tiendaOnline?.marginPercentage || 0), 0) / pricingList.length).toFixed(1)
    : '25.0';

  return (
    <div className="page-container">
      <div className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <Calculator className="text-primary-sage" />
            Estructura de Precios & Costos
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestión integral de márgenes comerciales, costos fijos/variables y precios por canal
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAllocateFixedCosts} className="btn btn-secondary flex items-center gap-2" disabled={allocateFixed.isPending}>
            <RefreshCw size={16} className={allocateFixed.isPending ? 'animate-spin' : ''} />
            Prorratear Costos Fijos
          </button>
          <button onClick={() => handleOpenConfigModal()} className="btn btn-primary flex items-center gap-2">
            <Settings size={16} />
            Configurar Precios & Márgenes
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
            <span className="text-sm font-medium text-text-muted">Margen Promedio Mostrador</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-primary-sage mt-2">{avgMostradorMargin}%</div>
          <div className="text-xs text-text-muted mt-1">Venta presencial en sucursal</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Margen Promedio WhatsApp</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-text-dark mt-2">{avgWhatsappMargin}%</div>
          <div className="text-xs text-text-muted mt-1">Venta por chat y pedidos directos</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-muted">Margen Promedio Tienda Online</span>
            <DollarSign className="text-primary-sage" size={20} />
          </div>
          <div className="text-2xl font-bold text-primary-sage mt-2">{avgOnlineMargin}%</div>
          <div className="text-xs text-text-muted mt-1">E-commerce e integración pasarelas</div>
        </div>
      </div>

      {/* Tabla Principal de Precios por Producto */}
      <div className="card">
        <div className="card-header mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-text-dark">Listado de Precios y Costos por Producto</h2>
          <span className="badge gray text-xs font-semibold">{displayList.length} productos en catálogo</span>
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
                  <th>Producto</th>
                  <th className="text-right">Costo Directo</th>
                  <th className="text-right">Costo Unit. Total</th>
                  <th className="text-right">Precio Mostrador</th>
                  <th className="text-right">Precio WhatsApp</th>
                  <th className="text-right">Precio Online</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(({ finalProduct: fp, pricingStructure: p }) => {
                  const isConfigured = !!p;
                  const nameStr = `${fp.name} (${fp.code})`;

                  const directCost = p 
                    ? (p.totalDirectCost !== undefined ? p.totalDirectCost : (p.rawMaterialCost + p.packagingLabelCost + p.laborCost)) 
                    : 0;

                  const totalCost = p 
                    ? (p.totalUnitCost !== undefined ? p.totalUnitCost : (directCost + p.allocatedFixedCosts)) 
                    : 0;

                  const mostradorPrice = p 
                    ? (p.channels?.mostrador?.finalPrice || p.channels?.mostrador?.suggestedPrice || fp.price || 0) 
                    : (fp.price || 0);

                  const mostradorMargin = p ? (p.channels?.mostrador?.marginPercentage || 0) : 0;

                  const whatsappPrice = p 
                    ? (p.channels?.whatsapp?.finalPrice || p.channels?.whatsapp?.suggestedPrice || mostradorPrice * 0.95) 
                    : (mostradorPrice > 0 ? mostradorPrice * 0.95 : 0);

                  const onlinePrice = p 
                    ? (p.channels?.tiendaOnline?.finalPrice || p.channels?.tiendaOnline?.suggestedPrice || mostradorPrice * 0.95) 
                    : (mostradorPrice > 0 ? mostradorPrice * 0.95 : 0);

                  return (
                    <tr key={fp.id}>
                      <td className="font-semibold text-text-dark">{nameStr}</td>
                      <td className="text-right font-medium">
                        {isConfigured ? formatCurrency(directCost) : <span className="text-xs text-text-muted">Sin costo</span>}
                      </td>
                      <td className="text-right font-bold text-text-dark">
                        {isConfigured ? formatCurrency(totalCost) : <span className="text-xs text-text-muted">Sin definir</span>}
                      </td>
                      <td className="text-right font-semibold text-primary-sage">
                        {formatCurrency(mostradorPrice)}{' '}
                        {isConfigured && <span className="text-xs font-normal text-text-muted">({mostradorMargin}%)</span>}
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(whatsappPrice)}</td>
                      <td className="text-right font-semibold">{formatCurrency(onlinePrice)}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleOpenConfigModal(p, fp)}
                          className={`btn ${isConfigured ? 'btn-secondary' : 'btn-primary'} btn-sm text-xs flex items-center gap-1 mx-auto`}
                          title="Ajustar costos y márgenes de este producto"
                        >
                          {isConfigured ? (
                            <>
                              <Settings size={14} /> Configurar
                            </>
                          ) : (
                            <>
                              <PlusCircle size={14} /> Definir Costos
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {displayList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      No hay productos registrados en el catálogo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Configurar Estructura de Precios */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="⚙️ Configurar Estructura de Precios & Márgenes" maxWidth="750px">
        <form onSubmit={handleSubmit(onSubmitSave)} className="flex flex-col gap-4">
          <div className="form-field">
            <label className="text-sm font-medium text-text-dark mb-1 block">Producto Elaborado Final *</label>
            <select 
              className="input"
              {...register('productId')}
              onChange={(e) => {
                const pId = e.target.value;
                setValue('productId', pId);
                const fp = products.find(p => p.id === pId);
                if (fp) {
                  setValue('productSku', fp.code);
                  setValue('productName', fp.name);
                  if (fp.price && fp.price > 0) {
                    setValue('mostradorFinalPrice', fp.price);
                  }

                  // Auto vincular materia prima base si existe
                  const baseRm = raws.find(rm => rm.id === fp.rawMaterialId);
                  if (baseRm) {
                    setSelectedRawMaterialId(baseRm.id);
                    const weightKg = (fp.unitWeightGrams || 500) / 1000;
                    setValue('rawMaterialCost', Math.round(weightKg * (baseRm.costPerUnit || 0)));
                  }
                }
              }}
            >
              <option value="">Seleccionar producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          <h4 className="font-bold text-sm text-text-dark border-b pb-1 flex items-center gap-2">
            <Layers size={16} className="text-primary-sage" />
            1. Conexión de Insumos Directos e Indirectos ($)
          </h4>

          {/* Selectores de Vinculación de Insumos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-bg-linen rounded border">
            {/* Materia Prima Granel */}
            <div className="form-field">
              <label className="text-xs font-semibold text-text-dark mb-1 block">🌾 Materia Prima Base (Granel)</label>
              <select 
                className="input text-xs"
                value={selectedRawMaterialId}
                onChange={(e) => {
                  const rmId = e.target.value;
                  setSelectedRawMaterialId(rmId);
                  const rm = raws.find(r => r.id === rmId);
                  const curProdId = watch('productId');
                  const fp = products.find(p => p.id === curProdId);
                  if (rm && fp) {
                    const weightKg = (fp.unitWeightGrams || 500) / 1000;
                    setValue('rawMaterialCost', Math.round(weightKg * (rm.costPerUnit || 0)));
                  } else if (rm) {
                    setValue('rawMaterialCost', Math.round(rm.costPerUnit || 0));
                  }
                }}
              >
                <option value="">Seleccionar insumo granel...</option>
                {raws.map(rm => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} (${rm.costPerUnit?.toLocaleString('es-AR')}/{rm.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Selección Múltiple de Empaques y Etiquetas */}
            <div className="form-field flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-dark flex justify-between items-center">
                <span>📦 Materiales de Empaque & Etiquetas</span>
                <span className="text-[11px] font-normal text-primary-sage font-medium">Selección múltiple</span>
              </label>

              <div className="border rounded bg-white p-2 max-h-36 overflow-y-auto flex flex-col gap-1 text-xs">
                {pkgs.map((pkg) => {
                  const isSelected = selectedPackagingIds.includes(pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => togglePackagingSelection(pkg.id)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition select-none ${
                        isSelected 
                          ? 'bg-green-50 border border-primary-sage text-primary-sage font-semibold' 
                          : 'hover:bg-gray-50 text-text-dark border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <CheckSquare size={14} className="text-primary-sage flex-shrink-0" />
                        ) : (
                          <Square size={14} className="text-text-muted flex-shrink-0" />
                        )}
                        <span>{pkg.name}</span>
                      </div>
                      <span className="font-bold ml-2">${pkg.costPerUnit?.toLocaleString('es-AR')}</span>
                    </div>
                  );
                })}

                {pkgs.length === 0 && (
                  <span className="text-text-muted text-center py-2">No hay materiales de empaque registrados</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="form-field">
              <label className="text-xs font-medium text-text-dark mb-1 block">Costo Materia Prima ($)</label>
              <input type="number" step="0.01" className="input font-semibold" {...register('rawMaterialCost')} />
            </div>

            <div className="form-field">
              <label className="text-xs font-medium text-text-dark mb-1 block">Costo Empaque/Etiqueta ($)</label>
              <input type="number" step="0.01" className="input font-semibold" {...register('packagingLabelCost')} />
            </div>

            <div className="form-field">
              <label className="text-xs font-medium text-text-dark mb-1 block">Mano de Obra ($)</label>
              <input type="number" step="0.01" className="input" {...register('laborCost')} />
            </div>

            <div className="form-field">
              <label className="text-xs font-medium text-text-dark mb-1 block">Costos Fijos Asign. ($)</label>
              <input type="number" step="0.01" className="input" {...register('allocatedFixedCosts')} />
            </div>
          </div>

          <div className="p-3 bg-white rounded border text-sm flex justify-between items-center shadow-sm">
            <span>Costo Directo Subtotal: <strong>{formatCurrency(totalDirectCost)}</strong></span>
            <span className="font-bold text-primary-sage text-base">Costo Unitario Total Base: {formatCurrency(totalUnitCost)}</span>
          </div>

          <h4 className="font-bold text-sm text-text-dark border-b pb-1 mt-2">2. Configuración de Precios y Márgenes por Canal</h4>
          
          {/* Mostrador */}
          <div className="p-3 border rounded bg-white">
            <div className="font-bold text-sm text-text-dark mb-2">🏪 Canal: Mostrador / Venta Presencial</div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div>
                <label className="mb-1 block">% Comisión Canal</label>
                <input type="number" step="0.1" className="input" {...register('mostradorCommissionPct')} />
              </div>
              <div>
                <label className="mb-1 block">% Margen Deseado</label>
                <input type="number" step="0.1" className="input" {...register('mostradorMarginPct')} />
              </div>
              <div>
                <label className="mb-1 block">Precio Final Venta ($)</label>
                <input type="number" step="1" placeholder={mostradorCalc.suggested.toString()} className="input font-bold" {...register('mostradorFinalPrice')} />
              </div>
            </div>
            <div className="text-xs text-text-muted flex justify-between border-t pt-2">
              <span>Precio Sugerido: <strong>{formatCurrency(mostradorCalc.suggested)}</strong></span>
              <span className="text-primary-sage font-semibold">Ganancia Neta: {formatCurrency(mostradorCalc.profit)} ({mostradorCalc.realMargin.toFixed(1)}% real)</span>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="p-3 border rounded bg-white">
            <div className="font-bold text-sm text-text-dark mb-2">📱 Canal: WhatsApp / Pedidos Chat</div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div>
                <label className="mb-1 block">% Comisión Canal</label>
                <input type="number" step="0.1" className="input" {...register('whatsappCommissionPct')} />
              </div>
              <div>
                <label className="mb-1 block">% Margen Deseado</label>
                <input type="number" step="0.1" className="input" {...register('whatsappMarginPct')} />
              </div>
              <div>
                <label className="mb-1 block">Precio Final Venta ($)</label>
                <input type="number" step="1" placeholder={whatsappCalc.suggested.toString()} className="input font-bold" {...register('whatsappFinalPrice')} />
              </div>
            </div>
            <div className="text-xs text-text-muted flex justify-between border-t pt-2">
              <span>Precio Sugerido: <strong>{formatCurrency(whatsappCalc.suggested)}</strong></span>
              <span className="text-primary-sage font-semibold">Ganancia Neta: {formatCurrency(whatsappCalc.profit)} ({whatsappCalc.realMargin.toFixed(1)}% real)</span>
            </div>
          </div>

          {/* Tienda Online */}
          <div className="p-3 border rounded bg-white">
            <div className="font-bold text-sm text-text-dark mb-2">🌐 Canal: Tienda Online / E-commerce</div>
            <div className="grid grid-cols-3 gap-3 text-xs mb-2">
              <div>
                <label className="mb-1 block">% Comisión Canal</label>
                <input type="number" step="0.1" className="input" {...register('onlineCommissionPct')} />
              </div>
              <div>
                <label className="mb-1 block">% Margen Deseado</label>
                <input type="number" step="0.1" className="input" {...register('onlineMarginPct')} />
              </div>
              <div>
                <label className="mb-1 block">Precio Final Venta ($)</label>
                <input type="number" step="1" placeholder={onlineCalc.suggested.toString()} className="input font-bold" {...register('onlineFinalPrice')} />
              </div>
            </div>
            <div className="text-xs text-text-muted flex justify-between border-t pt-2">
              <span>Precio Sugerido: <strong>{formatCurrency(onlineCalc.suggested)}</strong></span>
              <span className="text-primary-sage font-semibold">Ganancia Neta: {formatCurrency(onlineCalc.profit)} ({onlineCalc.realMargin.toFixed(1)}% real)</span>
            </div>
          </div>

          <div className="form-actions flex justify-end gap-3 mt-4 border-t pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savePricing.isPending}>
              {savePricing.isPending ? 'Guardando...' : '💾 Guardar Estructura'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
