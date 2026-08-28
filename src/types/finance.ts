/**
 * Tipos e Interfaces para el Módulo Avanzado de Finanzas, Gastos y Estructura de Precios & Costos
 * Sistema Flor y Ser - Almacén Natural ERP/CRM v2.0
 */

/**
 * Categorías de Gastos Operativos
 */
export type ExpenseCategory =
  | 'ALQUILER'
  | 'SERVICIOS'
  | 'SUELDOS'
  | 'COMISIONES'
  | 'LOGISTICA'
  | 'MARKETING'
  | 'MANTENIMIENTO'
  | 'IMPUESTOS'
  | 'OTROS';

/**
 * Tipos de Comprobantes para Gastos Operativos
 */
export type ExpenseVoucherType =
  | 'FACTURA_A'
  | 'FACTURA_B'
  | 'FACTURA_C'
  | 'REMITO'
  | 'RECIBO'
  | 'TICKET'
  | 'SIN_COMPROBANTE';

/**
 * Métodos de Pago para Gastos
 */
export type ExpensePaymentMethod =
  | 'EFECTIVO'
  | 'TRANSFERENCIA'
  | 'MERCADO_PAGO'
  | 'CHEQUE'
  | 'TARJETA_CREDITO'
  | 'TARJETA_DEBITO'
  | 'OTRO';

/**
 * Interfaz Principal de Gasto Operativo
 */
export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  voucherType?: ExpenseVoucherType | string;
  voucherNumber?: string;
  expenseDate: string; // Formato YYYY-MM-DD o ISO
  amount: number;
  paymentMethod: ExpensePaymentMethod | string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO para la Creación de un Gasto Operativo
 */
export interface CreateExpenseDTO {
  description: string;
  category: ExpenseCategory;
  voucherType?: ExpenseVoucherType | string;
  voucherNumber?: string;
  expenseDate: string;
  amount: number;
  paymentMethod?: ExpensePaymentMethod | string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
}

/**
 * DTO para la Actualización de un Gasto Operativo
 */
export interface UpdateExpenseDTO {
  description?: string;
  category?: ExpenseCategory;
  voucherType?: ExpenseVoucherType | string;
  voucherNumber?: string;
  expenseDate?: string;
  amount?: number;
  paymentMethod?: ExpensePaymentMethod | string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
}

/**
 * Filtros de Búsqueda para Gastos Operativos
 */
export interface ExpenseFilterDTO {
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Resumen de Gastos por Categoría
 */
export interface ExpenseCategorySummary {
  category: ExpenseCategory;
  categoryName: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
}

/**
 * Reporte Consolidado de Gastos Operativos
 */
export interface ExpenseSummaryReport {
  totalExpenseAmount: number;
  totalCount: number;
  monthlyAverage: number;
  byCategory: ExpenseCategorySummary[];
  periodStartDate?: string;
  periodEndDate?: string;
}

/**
 * Llaves Identificadoras de Canales de Comercialización
 */
export type PricingChannelKey = 'mostrador' | 'whatsapp' | 'tiendaOnline';

/**
 * Métricas Financieras y Precios Calculados por Canal
 */
export interface ChannelPricingMetrics {
  channelKey: PricingChannelKey;
  channelName: string;         // "Mostrador", "WhatsApp", "Tienda Online"
  commissionPercentage: number; // % Comisión por Canal (ej: MP, Tienda Nube, Tarjetas)
  marginPercentage: number;     // % Margen de Ganancia Objetivo
  suggestedPrice: number;       // Precio Sugerido por la fórmula financiera
  finalPrice: number;           // Precio Final de Venta Aplicado/Configurado
  profitAmount: number;         // Ganancia Neta en Pesos ($) por Unidad vendida en este canal
  realMarginPercentage: number; // % Margen Neto Real obtenido sobre el precio final de venta
}

/**
 * Estructura Integral de Costos y Precios por Producto (PricingStructureItem)
 */
export interface PricingStructureItem {
  id?: string;
  productId: string;
  productSku: string;
  productName: string;
  unitOfMeasure: string;

  // Desglose de Costos Directos por Unidad
  rawMaterialCost: number;     // Costo Insumo Granel ($)
  packagingLabelCost: number;  // Costo Envase y Etiqueta ($)
  laborCost: number;           // Costo Mano de Obra Directa ($)
  totalDirectCost: number;     // Suma: Insumo Granel + Envase/Etiqueta + Mano de Obra

  // Costos Fijos e Impuestos
  allocatedFixedCosts: number; // Costos Fijos Prorrateados ($) por Unidad
  taxPercentage: number;       // Impuestos / IVA / IIBB %

  // Costo Unitario Total Base ($)
  totalUnitCost: number;       // Total Directo + Costos Fijos Prorrateados

  // Estructura de Precios y Márgenes por Canal (Mostrador, WhatsApp, Tienda Online)
  channels: {
    mostrador: ChannelPricingMetrics;
    whatsapp: ChannelPricingMetrics;
    tiendaOnline: ChannelPricingMetrics;
  };

  updatedAt?: string;
}

/**
 * DTO de Entrada para el Cálculo o Definición de Estructura de Precios
 */
export interface CalculatePricingInputDTO {
  productId?: string;
  productSku?: string;
  productName?: string;
  unitOfMeasure?: string;
  rawMaterialCost: number;
  packagingLabelCost: number;
  laborCost: number;
  allocatedFixedCosts?: number;
  taxPercentage: number;
  channels: {
    mostrador: {
      commissionPercentage: number;
      marginPercentage: number;
      finalPrice?: number;
    };
    whatsapp: {
      commissionPercentage: number;
      marginPercentage: number;
      finalPrice?: number;
    };
    tiendaOnline: {
      commissionPercentage: number;
      marginPercentage: number;
      finalPrice?: number;
    };
  };
}

/**
 * DTO para el Prorrateo de Costos Fijos Operativos
 */
export interface AllocateFixedCostsDTO {
  periodMonth?: number;
  periodYear?: number;
  totalMonthlyFixedExpenses?: number;
  allocationMethod?: 'EQUALLY' | 'BY_VOLUME' | 'MANUAL';
  totalActiveProductsCount?: number;
}

/**
 * Reporte General y Comparativo de Estructuras Financieras y Márgenes
 */
export interface FinancialOverviewReport {
  totalActiveProducts: number;
  totalMonthlyOperationalExpenses: number;
  averageProductUnitCost: number;
  channelComparison: {
    channelKey: PricingChannelKey;
    channelName: string;
    averageMarginPercentage: number;
    averageSuggestedPrice: number;
    averageFinalPrice: number;
    totalPotentialRevenue: number;
  }[];
  mostProfitableProduct?: {
    productId: string;
    productName: string;
    maxProfitChannel: string;
    profitAmount: number;
  };
  leastProfitableProduct?: {
    productId: string;
    productName: string;
    minProfitChannel: string;
    profitAmount: number;
  };
  generatedAt: string;
}

// ==========================================
// SECCIÓN: COMISIONES POR VENDEDOR & P&L
// ==========================================

export interface SellerChannelCommissionRate {
  userId: string;
  userName: string;
  channel: 'LOCAL' | 'WHATSAPP' | 'ONLINE_STORE' | 'INSTAGRAM';
  commissionPercentage: number;
}

export interface CommissionSettlement {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  periodStart: string;
  periodEnd: string;
  totalPaidSalesAmount: number;
  ordersCount: number;
  totalCommissionAmount: number;
  expenseId?: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface ProductProfitabilityItem {
  productId: string;
  productName: string;
  category?: string;
  quantitySoldKg: number;
  quantitySoldUnits: number;
  totalRevenue: number;
  totalDirectCost: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface VolumeProfitabilityItem {
  unitType: 'KG' | 'UNIDADES';
  totalVolume: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
}

export interface ChannelProfitabilityItem {
  channel: 'LOCAL' | 'WHATSAPP' | 'ONLINE_STORE' | 'INSTAGRAM';
  channelLabel: string;
  ordersCount: number;
  totalRevenue: number;
  gatewayCommissionsAmount: number;
  sellerCommissionsAmount: number;
  netRevenue: number;
}

export interface SellerProfitabilityItem {
  sellerId: string;
  sellerName: string;
  role: string;
  totalOrders: number;
  totalSalesAmount: number;
  averageTicket: number;
  earnedCommissionsAmount: number;
  settledCommissionsAmount: number;
  pendingCommissionsAmount: number;
}

export interface ProfitabilityMonitorReport {
  periodStart: string;
  periodEnd: string;
  totalGrossRevenue: number;
  totalDirectCostsCMV: number;
  totalOperationalExpenses: number;
  totalSellerCommissions: number;
  netProfit: number;
  netMarginPercentage: number;
  breakdownByProduct: ProductProfitabilityItem[];
  breakdownByVolume: VolumeProfitabilityItem[];
  breakdownByChannel: ChannelProfitabilityItem[];
  breakdownBySeller: SellerProfitabilityItem[];
  generatedAt: string;
}
