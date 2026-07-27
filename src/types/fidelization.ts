export enum PointTransactionType {
  ACCUMULATION = 'ACCUMULATION',
  REDEMPTION = 'REDEMPTION',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRATION = 'EXPIRATION'
}

export interface PointsHistoryEntry {
  id: string;
  customerId: string;
  points: number;
  transactionType: PointTransactionType;
  referenceType?: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface AccumulatePointsDTO {
  customerId: string;
  amountSpent: number;
  referenceId?: string;
  description?: string;
}

export interface RedeemPointsDTO {
  customerId: string;
  pointsToRedeem: number;
  referenceId?: string;
  description?: string;
}

export interface AdjustPointsDTO {
  customerId: string;
  pointsDelta: number; // Puede ser positivo o negativo
  reason: string;
}

export interface PointsSummary {
  customerId: string;
  pointsBalance: number;
  equivalentDiscount: number;
  totalAccumulated: number;
  totalRedeemed: number;
}
