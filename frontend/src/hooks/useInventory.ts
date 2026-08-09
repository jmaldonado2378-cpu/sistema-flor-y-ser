import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  updateRawMaterialStock,
  getFinalProducts,
  createFinalProduct,
  updateFinalProduct,
  updateFinalProductStock,
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
