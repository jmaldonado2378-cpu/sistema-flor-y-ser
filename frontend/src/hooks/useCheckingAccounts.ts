import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as checkingAccountsApi from '../api/checkingAccounts';

export const useAllCheckingAccounts = () => {
  return useQuery({
    queryKey: ['allCheckingAccounts'],
    queryFn: () => checkingAccountsApi.getAllCheckingAccounts(),
  });
};

export const useCheckingAccountSummary = (customerId?: string) => {
  return useQuery({
    queryKey: ['checkingAccountSummary', customerId],
    queryFn: () => checkingAccountsApi.getCheckingAccountSummary(customerId!),
    enabled: !!customerId,
  });
};

export const useCheckingAccountStatement = (customerId?: string) => {
  return useQuery({
    queryKey: ['checkingAccountStatement', customerId],
    queryFn: () => checkingAccountsApi.getCheckingAccountStatement(customerId!),
    enabled: !!customerId,
  });
};

export const useRegisterCollection = (customerId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => checkingAccountsApi.registerCollection(customerId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCheckingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['checkingAccountSummary', customerId] });
      queryClient.invalidateQueries({ queryKey: ['checkingAccountStatement', customerId] });
    },
  });
};

export const useUpdateCreditLimit = (customerId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creditLimit: number) => checkingAccountsApi.updateCreditLimit(customerId!, creditLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCheckingAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['checkingAccountSummary', customerId] });
      queryClient.invalidateQueries({ queryKey: ['checkingAccountStatement', customerId] });
    },
  });
};
