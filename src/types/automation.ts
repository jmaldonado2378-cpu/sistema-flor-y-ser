export enum AutomationType {
  WELCOME = 'WELCOME',
  REPLENISHMENT = 'REPLENISHMENT',
  BIRTHDAY = 'BIRTHDAY',
  NEW_ARRIVALS = 'NEW_ARRIVALS'
}

export enum AutomationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH'
}

export interface AutomationLog {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  type: AutomationType;
  channel: AutomationChannel;
  messageContent: string;
  status: 'SENT' | 'FAILED' | 'SIMULATED';
  sentAt: string;
}

export interface SendWelcomeDTO {
  customerId: string;
  channel?: AutomationChannel;
  customDiscountCode?: string;
}

export interface ReplenishmentSuggestion {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  daysSinceLastPurchase: number;
  suggestedProducts: string[];
  recommendedChannel: AutomationChannel;
  messageTemplate: string;
}

export interface BirthdayGreetingResult {
  customerId: string;
  customerName: string;
  phoneWhatsapp: string;
  email?: string;
  birthDate: string;
  couponCode: string;
  message: string;
}

export interface BroadcastDietaryDTO {
  dietaryProfileCode: string;
  productName: string;
  customMessage: string;
  channel?: AutomationChannel;
}
