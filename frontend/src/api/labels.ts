import { apiRequest } from './client';

export const printProductLabel = async (data: any) => {
  const res = await apiRequest<any>('/labels/product', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const printShippingLabel = async (data: any) => {
  const res = await apiRequest<any>('/labels/shipping', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const getFinalProducts = async () => {
  const res = await apiRequest<any>('/final-products');
  return res.data || res;
};
