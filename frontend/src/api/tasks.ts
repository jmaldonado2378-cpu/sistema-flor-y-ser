import { apiRequest } from './client';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: string;
  dueDate?: string;
  status: string;
}

export const getKanbanBoard = async () => {
  const res = await apiRequest<any>('/tasks/kanban/board');
  return res.data || res;
};

export const createTask = async (data: Partial<Task>) => {
  const res = await apiRequest<any>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateTask = async (id: string, data: Partial<Task>) => {
  const res = await apiRequest<any>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data || res;
};

export const updateTaskStatus = async (id: string, status: string) => {
  const res = await apiRequest<any>(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data || res;
};

export const deleteTask = async (id: string) => {
  const res = await apiRequest<any>(`/tasks/${id}`, {
    method: 'DELETE',
  });
  return res.data || res;
};
