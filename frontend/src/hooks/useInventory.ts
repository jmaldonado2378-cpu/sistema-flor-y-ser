import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  updateRawMaterialStock,
  deleteRawMaterial,
  toggleRawMaterialStatus,
  getFinalProducts,
  createFinalProduct,
  updateFinalProduct,
  updateFinalProductStock,
  deleteFinalProduct,
  toggleFinalProductStatus,
} from '../api/inventory';

export const useRawMaterials = () => {
  return useQuery({
    queryKey: ['raw-materials'],
    queryFn: getRawMaterials,
  });
};

export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};

export const useUpdateRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRawMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};

export const useUpdateRawMaterialStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStock }: { id: string; newStock: number }) =>
      updateRawMaterialStock(id, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};

export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRawMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};

export const useToggleRawMaterialStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive?: boolean }) =>
      toggleRawMaterialStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
};

export const useFinalProducts = () => {
  return useQuery({
    queryKey: ['final-products'],
    queryFn: getFinalProducts,
  });
};

export const useCreateFinalProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinalProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};

export const useUpdateFinalProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateFinalProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};

export const useUpdateFinalProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStock }: { id: string; newStock: number }) =>
      updateFinalProductStock(id, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};

export const useDeleteFinalProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFinalProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};

export const useToggleFinalProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive?: boolean }) =>
      toggleFinalProductStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};
