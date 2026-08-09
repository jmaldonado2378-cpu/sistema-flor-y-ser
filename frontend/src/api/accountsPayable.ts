import { apiRequest } from './client';

export interface AccountsPayableCalendarItem {
  receiptId?: string;
  id?: string;
  receiptNumber?: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  issueDate?: string;
  dueDate: string;
  totalAmount?: number;
  paidAmount?: number;
  pendingBalance?: number;
  amount?: number;
  daysToDueDate?: number;
  urgency?: string;
  status: string;
}

export interface AccountsPayableSummary {
  totalGlobalAccountsPayable: number;
  totalOverdueAmount: number;
  totalDueNext7DaysAmount: number;
  totalDueNext30DaysAmount: number;
  totalPendingReceiptsCount: number;
  totalOverdueReceiptsCount: number;
}

export interface AccountsPayableResponse {
  calendar: AccountsPayableCalendarItem[];
  summary: AccountsPayableSummary;
}

export const getAccountsPayableCalendar = async (): Promise<AccountsPayableResponse> => {
  const res = await apiRequest<any>('/accounts-payable/calendar');
  const data = res.data || res;

  const calendarItems: AccountsPayableCalendarItem[] = Array.isArray(data.calendar) 
    ? data.calendar 
    : (Array.isArray(data) ? data : []);

  const summaryData: AccountsPayableSummary = data.summary || {
    totalGlobalAccountsPayable: calendarItems.reduce((s, i) => s + (i.pendingBalance || i.totalAmount || i.amount || 0), 0),
    totalOverdueAmount: calendarItems.filter(i => i.status === 'OVERDUE' || i.urgency === 'VENCIDO').reduce((s, i) => s + (i.pendingBalance || i.totalAmount || 0), 0),
    totalDueNext7DaysAmount: 0,
    totalDueNext30DaysAmount: 0,
    totalPendingReceiptsCount: calendarItems.length,
    totalOverdueReceiptsCount: 0
  };

  return {
    calendar: calendarItems,
    summary: summaryData
  };
};

export const registerSupplierPayment = async (data: any): Promise<any> => {
  const res = await apiRequest<any>('/accounts-payable/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const getPaymentsByReceipt = async (receiptId: string): Promise<any[]> => {
  const res = await apiRequest<any>(`/accounts-payable/receipts/${receiptId}/payments`);
  return res.data || res;
};
