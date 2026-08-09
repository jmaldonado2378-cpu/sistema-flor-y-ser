import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccountsPayableCalendar,
  registerSupplierPayment,
  getPaymentsByReceipt,
} from '../api/accountsPayable';

export const useAccountsPayableCalendar = () => {
  return useQuery({
    queryKey: ['accountsPayableCalendar'],
    queryFn: getAccountsPayableCalendar,
  });
};

export const useRegisterSupplierPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountsPayableCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['merchandise-receipts'] });
    },
  });
};

export const usePaymentsByReceipt = (receiptId: string) => {
  return useQuery({
    queryKey: ['paymentsByReceipt', receiptId],
    queryFn: () => getPaymentsByReceipt(receiptId),
    enabled: !!receiptId,
  });
};
