export interface DietaryProfile {
  id: string;
  code: string;
  name: string;
  description?: string;
  badgeColorHex: string;
  isCustom: boolean;
  isActive: boolean;
  specificNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDietaryProfileDTO {
  code: string;
  name: string;
  description?: string;
  badgeColorHex?: string;
}

export interface UpdateDietaryProfileDTO {
  name?: string;
  description?: string;
  badgeColorHex?: string;
  isActive?: boolean;
}

export interface AssignDietaryProfileDTO {
  customerId: string;
  dietaryProfileId: string;
  specificNotes?: string;
}
