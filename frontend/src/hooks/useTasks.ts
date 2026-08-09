import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKanbanBoard, createTask, updateTask, updateTaskStatus, deleteTask } from '../api/tasks';

export const useKanbanBoard = () => useQuery({ queryKey: ['kanbanBoard'], queryFn: getKanbanBoard });

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] }),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['fractioning-history'] });
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['final-products'] });
      queryClient.invalidateQueries({ queryKey: ['fractioning-history'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] }),
  });
};
