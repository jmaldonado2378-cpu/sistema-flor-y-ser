import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticleFamilies, getArticleFamiliesByScope, createArticleFamily, updateArticleFamily, deleteArticleFamily } from '../api/articleFamilies';

export const useArticleFamilies = () => useQuery({ queryKey: ['article-families'], queryFn: getArticleFamilies });

export const useArticleFamiliesByScope = (scope: string) => useQuery({ 
  queryKey: ['article-families', scope], 
  queryFn: () => getArticleFamiliesByScope(scope),
  enabled: !!scope 
});

export const useCreateArticleFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticleFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['article-families'] }),
  });
};

export const useUpdateArticleFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateArticleFamily(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['article-families'] }),
  });
};

export const useDeleteArticleFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['article-families'] }),
  });
};
