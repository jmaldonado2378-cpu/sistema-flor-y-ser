import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  previewFractioning,
  executeFractioning,
  getFractioningHistory,
} from '../api/fractioning';

export const useFractioningHistory = () => {
  return useQuery({
    queryKey: ['fractioning-history'],
    queryFn: getFractioningHistory,
  });
};

export const usePreviewFractioning = () => {
  return useMutation({
    mutationFn: previewFractioning,
  });
};

export const useExecuteFractioning = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: executeFractioning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fractioning-history'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
    },
  });
};
