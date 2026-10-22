import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getPackagingMaterials, 
  createPackagingMaterial, 
  updatePackagingMaterial, 
  updatePackagingStock,
  deletePackagingMaterial,
  togglePackagingStatus,
  getPackagingCategories,
  savePackagingCategory,
  deletePackagingCategory
} from '../api/packaging';

export const usePackagingCategories = () => {
  return useQuery({
    queryKey: ['packaging-categories'],
    queryFn: getPackagingCategories,
  });
};

export const useSavePackagingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePackagingCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-categories'] });
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};

export const useDeletePackagingCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePackagingCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-categories'] });
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};

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

export const useDeletePackagingMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePackagingMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};

export const useTogglePackagingStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive?: boolean }) => togglePackagingStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-materials'] });
    },
  });
};
