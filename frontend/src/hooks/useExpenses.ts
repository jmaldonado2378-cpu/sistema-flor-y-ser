import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as expensesApi from '../api/expenses';

export const useExpensesList = () => {
  return useQuery({
    queryKey: ['expensesList'],
    queryFn: () => expensesApi.getExpenses(),
  });
};

export const useExpenseSummary = () => {
  return useQuery({
    queryKey: ['expenseSummary'],
    queryFn: () => expensesApi.getExpenseSummary(),
  });
};

export const useFinancialOverview = useExpenseSummary;

export const useRegisterExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => expensesApi.registerExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesList'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => expensesApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesList'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesList'] });
      queryClient.invalidateQueries({ queryKey: ['expenseSummary'] });
    },
  });
};
