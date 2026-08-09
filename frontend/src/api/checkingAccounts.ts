import { apiRequest } from './client';

export interface CheckingAccountSummary {
  customerId: string;
  customerName: string;
  phoneWhatsapp?: string;
  email?: string;
  balance: number;
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  lastMovementDate?: string;
}

export interface CheckingAccountStatementItem {
  id: string;
  date?: string;
  createdAt?: string;
  type?: string;
  movementType?: string;
  tipoMovimiento?: string;
  description?: string;
  descripcion?: string;
  amount?: number;
  monto?: number;
  balance?: number;
  balanceAfter?: number;
  saldoPosterior?: number;
}

export interface CheckingAccountStatement {
  clienteId?: string;
  nombreCliente?: string;
  limiteCredito?: number;
  creditoDisponible?: number;
  saldoFinalDeudor?: number;
  movements?: CheckingAccountStatementItem[];
  movimientos?: CheckingAccountStatementItem[];
}

export const getAllCheckingAccounts = async (): Promise<CheckingAccountSummary[]> => {
  const res = await apiRequest<any>('/sales/checking-accounts');
  return res.data || res;
};

export const getCheckingAccountSummary = async (customerId: string): Promise<CheckingAccountSummary> => {
  const res = await apiRequest<any>(`/sales/customers/${customerId}/checking-account`);
  const data = res.data || res;
  return {
    ...data,
    balance: data.currentBalance !== undefined ? data.currentBalance : (data.balance || 0),
    currentBalance: data.currentBalance !== undefined ? data.currentBalance : (data.balance || 0),
  };
};

export const getCheckingAccountStatement = async (customerId: string): Promise<CheckingAccountStatementItem[]> => {
  const res = await apiRequest<any>(`/sales/customers/${customerId}/checking-account/statement`);
  const data = res.data || res;
  
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.movements)) return data.movements;
  if (Array.isArray(data.movimientos)) return data.movimientos;
  
  return [];
};

export const registerCollection = async (customerId: string, data: any): Promise<any> => {
  const res = await apiRequest<any>(`/sales/customers/${customerId}/checking-account/collections`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data || res;
};

export const updateCreditLimit = async (customerId: string, creditLimit: number): Promise<any> => {
  const res = await apiRequest<any>(`/sales/customers/${customerId}/checking-account/credit-limit`, {
    method: 'PATCH',
    body: JSON.stringify({ creditLimit })
  });
  return res.data || res;
};
