import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMerchandiseReceipts,
  getMerchandiseReceipt,
  createMerchandiseReceipt,
  createRawMaterialReceipt,
  updateMerchandiseReceipt,
  deleteMerchandiseReceipt,
  CreateReceiptDTO,
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
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
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
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};

export const useUpdateMerchandiseReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReceiptDTO> }) =>
      updateMerchandiseReceipt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayableCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};

export const useDeleteMerchandiseReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMerchandiseReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayableCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};

