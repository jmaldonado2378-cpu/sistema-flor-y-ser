export type UserRole = 'ADMIN' | 'SELLER';

export type ModuleKey =
  | 'dashboard'
  | 'customers'
  | 'stock'
  | 'article_families'
  | 'merchandise_receipt'
  | 'fractioning'
  | 'new_sale'
  | 'kanban_orders'
  | 'suppliers'
  | 'checking_accounts'
  | 'finance'
  | 'settings'
  | 'marketing'
  | 'users';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  allowedModules: ModuleKey[];
  avatarInitials: string;
  active: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
