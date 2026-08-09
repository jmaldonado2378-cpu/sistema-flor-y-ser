import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMerchandiseReceipts,
  getMerchandiseReceipt,
  createMerchandiseReceipt,
  createRawMaterialReceipt,
} from '../api/receipts';

export const useMerchandiseReceipts = () => {
  return useQuery({
    queryKey: ['merchandise-receipts'],
    queryFn: getMerchandiseReceipts,
  });
};

export const useMerchandiseReceipt = (id: string) => {
  return useQuery({
    queryKey: ['merchandise-receipts', id],
    queryFn: () => getMerchandiseReceipt(id),
    enabled: !!id,
  });
};

export const useCreateMerchandiseReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMerchandiseReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayableCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};

export const useCreateRawMaterialReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterialReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayableCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};
