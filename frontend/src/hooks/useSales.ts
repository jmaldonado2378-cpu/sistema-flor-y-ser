import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, createOrder, getOrderById, OrderFilterDTO, CreateOrderDTO } from '../api/sales';

export function useSales(filters?: OrderFilterDTO) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
  });
}

export function useOrderById(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderDTO) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
