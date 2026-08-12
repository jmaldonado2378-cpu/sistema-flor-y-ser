import { apiRequest } from './client';

export const getSettings = async () => {
  const res = await apiRequest<any>('/settings');
  return res.data || res;
};

export const updateSettings = async (data: any) => {
  const res = await apiRequest<any>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateBusinessInfo = async (data: any) => {
  const res = await apiRequest<any>('/settings/business-info', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updatePrintSettings = async (data: any) => {
  const res = await apiRequest<any>('/settings/print', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateCommissions = async (data: any) => {
  const res = await apiRequest<any>('/settings/commissions', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateHelpSettings = async (data: any) => {
  const res = await apiRequest<any>('/settings/help', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data || res;
};
