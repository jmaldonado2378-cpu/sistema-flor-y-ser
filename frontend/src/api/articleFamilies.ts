import { apiRequest } from './client';

export const getArticleFamilies = async () => {
  const res = await apiRequest<any>('/article-families');
  return res.data || res;
};

export const getArticleFamiliesByScope = async (scope: string) => {
  const res = await apiRequest<any>(`/article-families/scope/${scope}`);
  return res.data || res;
};

export const createArticleFamily = async (data: any) => {
  const res = await apiRequest<any>('/article-families', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateArticleFamily = async (id: string, data: any) => {
  const res = await apiRequest<any>(`/article-families/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const deleteArticleFamily = async (id: string) => {
  const res = await apiRequest<any>(`/article-families/${id}`, {
    method: 'DELETE',
  });
  return res.data || res;
};
