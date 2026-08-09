import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, updateBusinessInfo, updatePrintSettings, updateCommissions } from '../api/settings';

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: getSettings });

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};

export const useUpdateBusinessInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessInfo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};

export const useUpdatePrintSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePrintSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};

export const useUpdateCommissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCommissions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
};
