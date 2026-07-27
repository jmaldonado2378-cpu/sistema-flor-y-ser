export enum AcquisitionChannel {
  LOCAL = 'LOCAL',
  WHATSAPP = 'WHATSAPP',
  ONLINE_STORE = 'ONLINE_STORE',
  INSTAGRAM = 'INSTAGRAM'
}

export enum CustomerSegment {
  OCASIONAL = 'Ocasional',
  FRECUENTE = 'Frecuente',
  VIP = 'VIP',
  MAYORISTA = 'Mayorista / Revendedor'
}

import { DietaryProfile } from './dietary';
export { DietaryProfile };

export interface DietaryProfileSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  badgeColorHex?: string;
  specificNotes?: string;
}

export interface CreateCustomerDTO {
  firstName: string;
  lastName: string;
  phoneWhatsapp: string;
  email?: string;
  address?: string;
  birthDate?: string; // YYYY-MM-DD
  preferredChannel?: AcquisitionChannel;
  dietaryProfileIds?: string[];
  dietaryNotes?: Record<string, string>;
  notes?: string;
}

export interface UpdateCustomerDTO {
  firstName?: string;
  lastName?: string;
  phoneWhatsapp?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  preferredChannel?: AcquisitionChannel;
  dietaryProfileIds?: string[];
  dietaryNotes?: Record<string, string>;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilterDTO {
  search?: string;
  channel?: AcquisitionChannel;
  dietaryProfileId?: string;
  isBirthdayMonth?: boolean;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerPurchaseStats {
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastPurchaseDate?: string;
  daysSinceLastPurchase?: number;
  purchaseFrequencyDays?: number;
}

export interface UnifiedCustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phoneWhatsapp: string;
  email?: string;
  address?: string;
  birthDate?: string;
  preferredChannel: AcquisitionChannel;
  segment: CustomerSegment;
  pointsBalance: number;
  equivalentDiscountAmount: number;
  isActive: boolean;
  notes?: string;
  dietaryProfiles: DietaryProfileSummary[];
  purchaseStats: CustomerPurchaseStats;
  createdAt: string;
  updatedAt: string;
}
