import { apiRequest } from './client';

export interface Expense {
  id: string;
  expenseDate: string;
  date?: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod?: string;
  status?: string;
}

export interface ExpenseCategorySummary {
  category: string;
  categoryName: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
}

export interface ExpenseSummaryReport {
  totalExpenseAmount: number;
  totalCount: number;
  monthlyAverage: number;
  byCategory: ExpenseCategorySummary[];
}

export const getExpenses = async (): Promise<Expense[]> => {
  const res = await apiRequest<any>('/finance/expenses');
  return res.data || res;
};

export const getExpenseSummary = async (): Promise<ExpenseSummaryReport> => {
  const res = await apiRequest<any>('/finance/expenses/summary');
  return res.data || res;
};

export const registerExpense = async (data: any): Promise<any> => {
  const res = await apiRequest<any>('/finance/expenses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const updateExpense = async (id: string, data: any): Promise<any> => {
  const res = await apiRequest<any>(`/finance/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const deleteExpense = async (id: string): Promise<any> => {
  const res = await apiRequest<any>(`/finance/expenses/${id}`, {
    method: 'DELETE'
  });
  return res.data || res;
};
