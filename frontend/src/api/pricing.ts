import { apiRequest } from './client';

export interface ChannelMetrics {
  channelKey: 'mostrador' | 'whatsapp' | 'tiendaOnline';
  channelName: string;
  commissionPercentage: number;
  marginPercentage: number;
  suggestedPrice: number;
  finalPrice: number;
  profitAmount: number;
  realMarginPercentage: number;
}

export interface PricingStructure {
  id?: string;
  productId: string;
  productSku?: string;
  productName?: string;
  unitOfMeasure?: string;
  rawMaterialCost: number;
  packagingLabelCost: number;
  laborCost: number;
  totalDirectCost?: number;
  allocatedFixedCosts: number;
  taxPercentage: number;
  totalUnitCost?: number;
  channels: {
    mostrador: ChannelMetrics;
    whatsapp: ChannelMetrics;
    tiendaOnline: ChannelMetrics;
  };
  updatedAt?: string;
}

export const getPricingStructures = async (): Promise<PricingStructure[]> => {
  const res = await apiRequest<any>('/finance/pricing-structure');
  return res.data || res;
};

export const getPricingStructure = async (productId: string): Promise<PricingStructure> => {
  const res = await apiRequest<any>(`/finance/pricing-structure/${productId}`);
  return res.data || res;
};

export const savePricingStructure = async (data: any): Promise<PricingStructure> => {
  const res = await apiRequest<any>('/finance/pricing-structure', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const calculatePreview = async (data: any): Promise<PricingStructure> => {
  const res = await apiRequest<any>('/finance/pricing-structure/calculate-preview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const allocateFixedCosts = async (data: any): Promise<any> => {
  const res = await apiRequest<any>('/finance/pricing-structure/allocate-fixed-costs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const getPricingOverview = async (): Promise<any> => {
  const res = await apiRequest<any>('/finance/pricing-structure/overview');
  return res.data || res;
};
