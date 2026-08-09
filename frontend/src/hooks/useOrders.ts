import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../api/orders';

export const useSalesKanbanBoard = () => {
  return useQuery({
    queryKey: ['salesKanbanBoard'],
    queryFn: () => ordersApi.getSalesKanbanBoard(),
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesKanbanBoard'] });
    },
  });
};
