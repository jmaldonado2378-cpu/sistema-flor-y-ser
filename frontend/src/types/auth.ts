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
  | 'kanban_tasks'
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
  password?: string;
  role: UserRole;
  allowedModules: ModuleKey[];
  avatarInitials: string;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
