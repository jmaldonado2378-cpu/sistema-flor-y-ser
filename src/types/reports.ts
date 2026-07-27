import { AcquisitionChannel } from './customer';

/**
 * KPI 1: Ticket Promedio por Canal y por Cliente
 */
export interface ChannelTicketStat {
  channel: AcquisitionChannel;
  channelName: string;
  orderCount: number;
  totalRevenue: number;
  averageTicket: number;
  percentageOfTotal: number;
}

export interface CustomerTicketStat {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  orderCount: number;
  totalSpent: number;
  averageTicket: number;
  preferredChannel: AcquisitionChannel;
}

export interface TicketPromedioReport {
  overallAverageTicket: number;
  totalOrdersCount: number;
  totalRevenue: number;
  byChannel: ChannelTicketStat[];
  topCustomersByTicket: CustomerTicketStat[];
}

/**
 * KPI 2: Productos Estrella por Perfil Dietético
 */
export interface StarProductItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  dietaryProfiles: string[];
  totalQuantitySold: number;
  totalRevenue: number;
  rankingPosition: number;
}

export interface StarProductsByDietReport {
  dietaryProfileCode: string;
  dietaryProfileName: string;
  badgeColorHex: string;
  products: StarProductItem[];
}

/**
 * KPI 3: Tasa de Recompra (Retención de Clientes)
 */
export interface RepurchaseRateReport {
  totalCustomers: number;
  activeCustomersWithOrders: number;
  oneTimeBuyers: number;
  repeatBuyers: number;
  repurchaseRatePercentage: number;
  averageOrdersPerCustomer: number;
  averageDaysBetweenPurchases: number;
}

/**
 * KPI 4: Clientes Inactivos (30, 60, 90+ días)
 */
export interface InactiveCustomerItem {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  preferredChannel: AcquisitionChannel;
  lastPurchaseDate: string;
  daysInactive: number;
  inactivityRange: '30_DAYS' | '60_DAYS' | '90_DAYS_PLUS';
  totalHistoricalSpent: number;
  totalOrders: number;
  suggestedAction: string;
}

export interface InactiveCustomersReport {
  totalInactive: number;
  inactive30DaysCount: number;
  inactive60DaysCount: number;
  inactive90DaysCount: number;
  customers: InactiveCustomerItem[];
}

/**
 * KPI 5: Arqueo de Caja Diario
 */
export interface DailyCashAuditReport {
  id: string;
  shiftDate: string;
  openedAt: string;
  closedAt?: string;
  status: 'OPEN' | 'CLOSED';
  initialCash: number;
  cashSales: number;
  mercadopagoSales: number;
  transferSales: number;
  cuentaCorrienteSales: number;
  cashWithdrawals: number;
  cashAdditions: number;
  totalSalesGlobal: number;
  expectedCashInHand: number;
  actualCashInHand?: number;
  difference?: number;
  notes?: string;
}

export interface CloseCashShiftDTO {
  shiftId?: string;
  actualCashInHand: number;
  notes?: string;
}

/**
 * KPI 6: Balance Global de Cuentas Corrientes
 */
export interface CustomerAccountBalanceItem {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  currentBalance: number; // Monto adeudado
  creditLimit: number;
  daysOverdue: number;
  lastPurchaseDate?: string;
  lastPaymentDate?: string;
  status: 'NORMAL' | 'NEAR_LIMIT' | 'OVERDUE' | 'EXCEEDED';
}

export interface GlobalCurrentAccountsReport {
  totalGlobalDebt: number;
  totalCustomersWithBalance: number;
  customersOverdueCount: number;
  totalCreditLimitAssigned: number;
  accounts: CustomerAccountBalanceItem[];
}

/**
 * Dashboard Consolidado Executive Summary (Módulo 6)
 */
export interface ExecutiveKpiSummary {
  overallAverageTicket: number;
  repurchaseRatePercentage: number;
  inactiveCustomersTotal: number;
  dailyCashTotalSales: number;
  globalCurrentAccountsDebt: number;
  topDietaryProfile: string;
  timestamp: string;
}
