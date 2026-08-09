import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, CreateSupplierDTO } from '../api/suppliers';

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers(),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSupplierDTO) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
