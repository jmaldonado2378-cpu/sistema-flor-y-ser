import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerProfile, CustomerFilterDTO, CreateCustomerDTO } from '../api/customers';

export function useCustomers(filters?: CustomerFilterDTO) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => getCustomers(filters),
  });
}

export function useCustomerProfile(id: string) {
  return useQuery({
    queryKey: ['customers', id, 'profile'],
    queryFn: () => getCustomerProfile(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCustomerDTO) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomerDTO> }) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
