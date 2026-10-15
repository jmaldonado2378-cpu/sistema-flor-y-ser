import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStockMovements,
  createStockAdjustment,
  StockMovementFilters,
  StockAdjustmentPayload,
} from '../api/stockMovements';

export const useStockMovements = (filters: StockMovementFilters = {}) => {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => getStockMovements(filters),
  });
};

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) => createStockAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};
