import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPackagingMaterials, createPackagingMaterial, updatePackagingMaterial, updatePackagingStock } from '../api/packaging';

export const usePackagingMaterials = () => {
  return useQuery({
    queryKey: ['packaging-materials'],
    queryFn: getPackagingMaterials,
  });
};

export const useCreatePackagingMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPackagingMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};

export const useUpdatePackagingMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePackagingMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};

export const useUpdatePackagingStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStock }: { id: string; newStock: number }) => updatePackagingStock(id, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};
