import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPricingStructures, getPricingStructure, savePricingStructure, calculatePreview, allocateFixedCosts, getPricingOverview } from '../api/pricing';

export const usePricingStructures = () => useQuery({ queryKey: ['pricingStructures'], queryFn: getPricingStructures });
export const usePricingStructure = (id: string) => useQuery({ queryKey: ['pricingStructure', id], queryFn: () => getPricingStructure(id), enabled: !!id });
export const usePricingOverview = () => useQuery({ queryKey: ['pricingOverview'], queryFn: getPricingOverview });

export const useSavePricingStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePricingStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingStructures'] });
      queryClient.invalidateQueries({ queryKey: ['pricingOverview'] });
    },
  });
};

export const useCalculatePreview = () => useMutation({ mutationFn: calculatePreview });
export const useAllocateFixedCosts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: allocateFixedCosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingStructures'] });
    },
  });
};
