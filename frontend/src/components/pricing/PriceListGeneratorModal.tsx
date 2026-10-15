import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Square, 
  Percent, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Phone, 
  MapPin, 
  FileText,
  Sliders,
  Layers,
  Columns
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export interface PriceListGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  families: any[];
  settings?: any;
}

interface EditablePriceItem {
  id: string;
  code: string;
  name: string;
  familyId?: string;
  familyName: string;
  unitWeightGrams?: number;
  netContentLabel?: string;
  ingredients?: string;
  currentStock: number;
  basePrice: number;
  customPrice: number;
  selected: boolean;
}

export const PriceListGeneratorModal: React.FC<PriceListGeneratorModalProps> = ({
  isOpen,
  onClose,
  products = [],
  families = [],
  settings
}) => {
  // Document customization state
  const [docTitle, setDocTitle] = useState('Catálogo & Lista de Precios');
  const [docSubtitle, setDocSubtitle] = useState('Almacén Natural • Productos Conscientes & Seleccionados');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [footerNotes, setFooterNotes] = useState('Precios válidos hasta fin de mes o agotar stock • Envíos a todo el país • Efectivo, Transferencia o Tarjeta.');
  
  // Layout and display toggles
  const [groupByFamily, setGroupByFamily] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showWeight, setShowWeight] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);
  const [columnsLayout, setColumnsLayout] = useState<'single' | 'double'>('double');
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState('ALL');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Mass percentage input
  const [customPercent, setCustomPercent] = useState<number>(10);

  // Editable items state
  const [items, setItems] = useState<EditablePriceItem[]>([]);

  // Initialize items from products
  useEffect(() => {
    if (products && products.length > 0) {
      const initialItems: EditablePriceItem[] = products.map((p) => {
        const fam = families.find(f => f.id === p.familyId || f.id === p.articleFamilyId);
        const price = Number(p.price) || 0;
        return {
          id: p.id,
          code: p.code || '',
          name: p.name || 'Producto',
          familyId: p.familyId || p.articleFamilyId || '',
          familyName: fam?.name || 'Sin Categoría',
          unitWeightGrams: p.unitWeightGrams,
          netContentLabel: p.netContentLabel || (p.unitWeightGrams ? `${p.unitWeightGrams}g` : ''),
          ingredients: p.ingredients || '',
          currentStock: Number(p.currentStock) || 0,
          basePrice: price,
          customPrice: price,
          selected: true,
        };
      });
      setItems(initialItems);
    }
  }, [products, families]);

  // Sync settings contact info
  useEffect(() => {
    if (settings) {
      setContactPhone(settings.whatsapp || settings.phone || '+54 9 11 5543-9821');
      setContactAddress(settings.address || 'Av. Corrientes 3421, CABA, Argentina');
    } else {
      setContactPhone('+54 9 11 5543-9821');
      setContactAddress('Av. Corrientes 3421, CABA, Argentina');
    }
  }, [settings]);

  // Mass selection toggles
  const handleSelectAll = (select: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected: select })));
  };

  const handleToggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, customPrice: Math.max(0, newPrice) } : item));
  };

  // Mass percentage modifier (+10%, -15%, etc.)
  const applyPercentageAdjustment = (percentage: number) => {
    setItems(prev => prev.map(item => {
      if (!item.selected) return item;
      const multiplier = 1 + (percentage / 100);
      // Round to clean multiples of 50 or 10
      const rawPrice = item.basePrice * multiplier;
      const roundedPrice = Math.round(rawPrice / 10) * 10;
      return {
        ...item,
        customPrice: roundedPrice
      };
    }));
  };

  const resetToCatalogPrices = () => {
    setItems(prev => prev.map(item => ({ ...item, customPrice: item.basePrice })));
  };

  // Filtered items based on family filter and stock filter
  const displayedItems = useMemo(() => {
    return items.filter(item => {
      if (selectedFamilyFilter !== 'ALL' && item.familyId !== selectedFamilyFilter) {
        return false;
      }
      if (hideOutOfStock && item.currentStock <= 0) {
        return false;
      }
      return true;
    });
  }, [items, selectedFamilyFilter, hideOutOfStock]);

  const selectedForPrint = useMemo(() => {
    return displayedItems.filter(i => i.selected);
  }, [displayedItems]);

  // Group items by family if enabled
  const groupedItems = useMemo(() => {
    if (!groupByFamily) {
      return [{ category: 'Todos los Productos', items: selectedForPrint }];
    }
    const groups: { [key: string]: EditablePriceItem[] } = {};
    selectedForPrint.forEach(item => {
      const cat = item.familyName || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items
    }));
  }, [groupByFamily, selectedForPrint]);

  // Print function
  const handlePrint = () => {
    document.body.classList.add('printing-price-list');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-price-list');
    }, 1000);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="📋 Generador de Listas de Precios & Catálogo PDF" 
      maxWidth="1100px"
    >
      <div className="flex flex-col gap-4">
        {/* Navigation / Switch between Editor & Live Preview */}
        <div className="no-print flex justify-between items-center bg-bg-linen p-2 rounded border">
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5`}
              onClick={() => setActiveTab('editor')}
            >
              <Sliders size={14} /> 1. Configurar & Editar Precios
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-1.5`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} /> 2. Vista Previa Impresión ({selectedForPrint.length} ítems)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1.5"
              style={{ backgroundColor: '#2E5339', borderColor: '#2E5339' }}
              onClick={handlePrint}
              disabled={selectedForPrint.length === 0}
            >
              <Printer size={15} /> 🖨️ Imprimir / Guardar como PDF
            </button>
          </div>
        </div>

        {/* TAB 1: EDITOR & CUSTOMIZATION */}
        {activeTab === 'editor' && (
          <div className="no-print flex flex-col gap-4">
            {/* Header info settings */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-bg-linen rounded border">
              <div>
                <label className="text-xs font-semibold text-text-dark mb-1 block">Título del Catálogo / Lista</label>
                <input 
                  type="text" 
                  value={docTitle} 
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ej: Lista de Precios Minorista - Octubre 2026"
                  className="text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-dark mb-1 block">Subtítulo / Bajada de Marca</label>
                <input 
                  type="text" 
                  value={docSubtitle} 
                  onChange={(e) => setDocSubtitle(e.target.value)}
                  placeholder="Ej: Almacén Natural • Productos Agroecológicos"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-dark mb-1 block">Teléfono / WhatsApp de Pedidos</label>
                <input 
                  type="text" 
                  value={contactPhone} 
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-dark mb-1 block">Dirección / Local / Redes</label>
                <input 
                  type="text" 
                  value={contactAddress} 
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="Dirección, Instagram o Local"
                  className="text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-text-dark mb-1 block">Nota al Pie / Condiciones de Venta</label>
                <input 
                  type="text" 
                  value={footerNotes} 
                  onChange={(e) => setFooterNotes(e.target.value)}
                  placeholder="Validez de la lista, medios de pago, envíos..."
                  className="text-sm"
                />
              </div>
            </div>

            {/* Quick modifiers & layout options */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-white rounded border items-center">
              {/* Quick % modifier */}
              <div className="col-span-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-text-dark flex items-center gap-1">
                  <Percent size={14} className="text-primary-sage" /> Ajuste Masivo:
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2"
                  onClick={() => applyPercentageAdjustment(10)}
                  title="Sumar 10% a los seleccionados"
                >
                  +10%
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2"
                  onClick={() => applyPercentageAdjustment(20)}
                  title="Sumar 20% a los seleccionados"
                >
                  +20%
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2"
                  style={{ color: '#D97706' }}
                  onClick={() => applyPercentageAdjustment(-15)}
                  title="Descuento 15% (Mayorista)"
                >
                  -15% (Mayorista)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2"
                  style={{ color: '#DC2626' }}
                  onClick={() => applyPercentageAdjustment(-20)}
                  title="Descuento 20% (Distribuidores)"
                >
                  -20%
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs py-1 px-2 flex items-center gap-1"
                  onClick={resetToCatalogPrices}
                  title="Restablecer a precios oficiales del catálogo"
                >
                  <RotateCcw size={12} /> Catálogo Original
                </button>
              </div>

              {/* Toggles */}
              <div className="col-span-6 flex flex-wrap justify-end items-center gap-4 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={groupByFamily} 
                    onChange={(e) => setGroupByFamily(e.target.checked)}
                  />
                  <span>Agrupar por Familia</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSku} 
                    onChange={(e) => setShowSku(e.target.checked)}
                  />
                  <span>Ver SKU</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showWeight} 
                    onChange={(e) => setShowWeight(e.target.checked)}
                  />
                  <span>Ver Peso / Contenido</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={columnsLayout === 'double'} 
                    onChange={(e) => setColumnsLayout(e.target.checked ? 'double' : 'single')}
                  />
                  <span>Formato 2 Columnas</span>
                </label>
              </div>
            </div>

            {/* Filter selection row */}
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <select 
                  value={selectedFamilyFilter} 
                  onChange={(e) => setSelectedFamilyFilter(e.target.value)}
                  className="text-xs py-1"
                  style={{ width: 'auto' }}
                >
                  <option value="ALL">Todas las familias ({products.length} productos)</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hideOutOfStock} 
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                  />
                  <span>Solo con stock disponible</span>
                </label>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  className="text-primary-sage font-semibold hover:underline"
                  onClick={() => handleSelectAll(true)}
                >
                  Marcar Todos
                </button>
                <span>•</span>
                <button
                  type="button"
                  className="text-text-muted hover:underline"
                  onClick={() => handleSelectAll(false)}
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Interactive items editor table */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }} className="border rounded">
              <table className="data-table w-full text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">Incluir</th>
                    <th>Código</th>
                    <th>Producto Elaborado</th>
                    <th>Familia</th>
                    <th>Presentación</th>
                    <th>Stock Actual</th>
                    <th className="text-right" style={{ width: '140px' }}>Precio a Publicar ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item) => (
                    <tr key={item.id} className={!item.selected ? 'opacity-50 bg-gray-50' : ''}>
                      <td className="text-center">
                        <input 
                          type="checkbox" 
                          checked={item.selected} 
                          onChange={() => handleToggleItem(item.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="font-semibold text-text-muted">{item.code || '-'}</td>
                      <td className="font-medium text-text-dark">{item.name}</td>
                      <td><span className="badge gray text-[11px]">{item.familyName}</span></td>
                      <td>{item.netContentLabel || '-'}</td>
                      <td>
                        <span className={item.currentStock <= 0 ? 'text-terracotta font-bold' : ''}>
                          {item.currentStock} un.
                        </span>
                      </td>
                      <td className="text-right">
                        <input 
                          type="number" 
                          step="any"
                          value={item.customPrice} 
                          onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                          className="text-right font-bold text-xs py-1 px-2 border rounded"
                          style={{ width: '110px', color: item.customPrice !== item.basePrice ? '#2E5339' : '#111827' }}
                        />
                      </td>
                    </tr>
                  ))}
                  {displayedItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-text-muted">
                        No hay productos que coincidan con los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs text-text-muted border-t pt-2">
              <div>
                <strong>{selectedForPrint.length}</strong> productos seleccionados para incluir en la lista de precios.
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                onClick={() => setActiveTab('preview')}
              >
                <Eye size={14} /> Ver Vista Previa del Catálogo
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE PREVIEW & PRINTABLE CATALOG */}
        <div className={activeTab !== 'preview' ? 'print-only' : 'block'}>
          <div className="no-print flex justify-between items-center mb-2 px-1">
            <span className="text-xs text-text-muted">
              Previsualización tamaño A4 con diseño editorial Flor y Ser. Haz clic en "Imprimir / Guardar como PDF" para generar el archivo.
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('editor')}
            >
              ← Volver al Editor de Precios
            </button>
          </div>

          {/* Printable Document Container */}
          <div 
            id="printable-price-catalog"
            className="price-list-preview-container bg-white p-6 sm:p-8 rounded border shadow-sm"
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              color: '#18261E',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {/* Header with Flor y Ser Branding */}
            <div className="border-b-2 pb-4 mb-5" style={{ borderColor: '#2E5339' }}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="Flor y Ser" 
                    style={{ height: '62px', width: 'auto', objectFit: 'contain' }}
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h1 style={{ 
                      fontSize: '22pt', 
                      fontWeight: 'bold', 
                      color: '#2E5339', 
                      margin: 0, 
                      letterSpacing: '-0.5px',
                      fontFamily: 'Georgia, serif' 
                    }}>
                      Flor y Ser
                    </h1>
                    <div style={{ fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6B7280', fontWeight: 600 }}>
                      Almacén Natural
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '8.5pt', color: '#4B5563', lineHeight: 1.4 }}>
                  <div className="font-semibold text-text-dark flex items-center justify-end gap-1">
                    <Phone size={12} className="text-primary-sage" /> {contactPhone}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <MapPin size={12} className="text-primary-sage" /> {contactAddress}
                  </div>
                  <div style={{ color: '#9CA3AF', marginTop: '2px' }}>
                    Emisión: {new Date().toLocaleDateString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <div>
                  <h2 style={{ fontSize: '15pt', fontWeight: 700, color: '#18261E', margin: 0 }}>
                    {docTitle}
                  </h2>
                  <p style={{ fontSize: '9.5pt', color: '#6B7280', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                    {docSubtitle}
                  </p>
                </div>
                <div style={{ fontSize: '8.5pt', color: '#2E5339', fontWeight: 600 }} className="no-print">
                  {selectedForPrint.length} productos
                </div>
              </div>
            </div>

            {/* Catalog Content (Grouped by Category) */}
            <div className="flex flex-col gap-5">
              {groupedItems.map((group, groupIdx) => (
                <div key={groupIdx} className="catalog-group">
                  {/* Category Banner */}
                  {groupByFamily && (
                    <div 
                      style={{ 
                        backgroundColor: '#E9EFEA', 
                        color: '#2E5339',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '9.5pt',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        marginBottom: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>🌿 {group.category}</span>
                      <span style={{ fontSize: '8pt', opacity: 0.8 }}>{group.items.length} ítems</span>
                    </div>
                  )}

                  {/* Items Grid (1 or 2 columns) */}
                  <div className={columnsLayout === 'double' ? 'grid grid-cols-2 gap-x-6 gap-y-2' : 'flex flex-col gap-2'}>
                    {group.items.map((item) => (
                      <div 
                        key={item.id} 
                        className="py-1 flex items-baseline justify-between border-b border-gray-100 text-sm"
                        style={{ breakInside: 'avoid' }}
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-semibold text-text-dark text-xs sm:text-sm">
                              {item.name}
                            </span>
                            {showWeight && item.netContentLabel && (
                              <span style={{ fontSize: '7.5pt', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '1px 4px', borderRadius: '3px' }}>
                                {item.netContentLabel}
                              </span>
                            )}
                            {showSku && item.code && (
                              <span style={{ fontSize: '7.5pt', color: '#9CA3AF' }}>
                                #{item.code}
                              </span>
                            )}
                          </div>
                          {showIngredients && item.ingredients && (
                            <div style={{ fontSize: '7.5pt', color: '#6B7280', fontStyle: 'italic', marginTop: '1px' }}>
                              {item.ingredients}
                            </div>
                          )}
                        </div>

                        {/* Leader dots & price */}
                        <div className="flex items-baseline font-bold" style={{ color: '#2E5339', fontSize: '10.5pt', whiteSpace: 'nowrap' }}>
                          {formatCurrency(item.customPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {selectedForPrint.length === 0 && (
                <div className="text-center py-10 text-text-muted">
                  No se han seleccionado productos para la lista de precios
                </div>
              )}
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-text-muted">
              <p className="font-medium text-text-dark mb-1" style={{ fontSize: '8.5pt' }}>
                {footerNotes}
              </p>
              <p style={{ fontSize: '7.5pt', color: '#9CA3AF' }}>
                Flor y Ser • Alimentación Consciente, Hierbas Medicinales & Cosmética Natural
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
