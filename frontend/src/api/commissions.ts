import { apiRequest } from './client';

export interface SellerChannelRate {
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

export interface PendingCommissionsReport {
  orders: {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    sellerId: string;
    sellerName: string;
    channel: string;
    totalAmount: number;
    commissionAmount: number;
    createdAt: string;
  }[];
  totalSalesAmount: number;
  totalPendingCommission: number;
}

export interface ProfitabilityReport {
  periodStart: string;
  periodEnd: string;
  totalGrossRevenue: number;
  totalDirectCostsCMV: number;
  totalOperationalExpenses: number;
  totalSellerCommissions: number;
  netProfit: number;
  netMarginPercentage: number;
  breakdownByProduct: {
    productId: string;
    productName: string;
    category?: string;
    quantitySoldKg: number;
    quantitySoldUnits: number;
    totalRevenue: number;
    totalDirectCost: number;
    grossProfit: number;
    marginPercentage: number;
  }[];
  breakdownByVolume: {
    unitType: 'KG' | 'UNIDADES';
    totalVolume: number;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
  }[];
  breakdownByChannel: {
    channel: 'LOCAL' | 'WHATSAPP' | 'ONLINE_STORE' | 'INSTAGRAM';
    channelLabel: string;
    ordersCount: number;
    totalRevenue: number;
    gatewayCommissionsAmount: number;
    sellerCommissionsAmount: number;
    netRevenue: number;
  }[];
  breakdownBySeller: {
    sellerId: string;
    sellerName: string;
    role: string;
    totalOrders: number;
    totalSalesAmount: number;
    averageTicket: number;
    earnedCommissionsAmount: number;
    settledCommissionsAmount: number;
    pendingCommissionsAmount: number;
  }[];
  generatedAt: string;
}

export const getSellerCommissionRates = async (userId: string): Promise<SellerChannelRate[]> => {
  const res = await apiRequest<any>(`/finance/commissions/rates/${userId}`);
  return res.data || res;
};

export const updateSellerCommissionRate = async (userId: string, channel: string, percentage: number): Promise<any> => {
  const res = await apiRequest<any>(`/finance/commissions/rates/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ channel, percentage })
  });
  return res.data || res;
};

export const getPendingCommissions = async (userId?: string, startDate?: string, endDate?: string): Promise<PendingCommissionsReport> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await apiRequest<any>(`/finance/commissions/pending${queryStr}`);
  return res.data || res;
};

export const settleCommissions = async (data: {
  userId: string;
  userName: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod?: string;
  notes?: string;
}): Promise<CommissionSettlement> => {
  const res = await apiRequest<any>('/finance/commissions/settle', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const getCommissionSettlements = async (): Promise<CommissionSettlement[]> => {
  const res = await apiRequest<any>('/finance/commissions/settlements');
  return res.data || res;
};

export const getProfitabilityMonitor = async (startDate?: string, endDate?: string): Promise<ProfitabilityReport> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await apiRequest<any>(`/finance/profitability-monitor${queryStr}`);
  return res.data || res;
};
