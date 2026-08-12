import { Pool } from 'pg';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SELLER';
  allowedModules: string[];
  active: boolean;
}

export class AuthService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async login(email: string, passwordHash: string): Promise<{ user: UserDTO; token: string } | null> {
    // Para despliegue de prueba y soporte en memoria
    if (email === 'admin@floryser.com' || email === 'admin') {
      return {
        user: {
          id: 'usr-admin-1',
          name: 'Administrador General',
          email: 'admin@floryser.com',
          role: 'ADMIN',
          allowedModules: ['dashboard', 'customers', 'stock', 'article_families', 'merchandise_receipt', 'fractioning', 'new_sale', 'kanban_orders', 'suppliers', 'checking_accounts', 'finance', 'settings', 'marketing', 'users'],
          active: true
        },
        token: `jwt-admin-${Date.now()}`
      };
    }

    if (email === 'vendedor@floryser.com' || email === 'vendedor') {
      return {
        user: {
          id: 'usr-seller-1',
          name: 'María Clara Fernández',
          email: 'vendedor@floryser.com',
          role: 'SELLER',
          allowedModules: ['new_sale', 'kanban_orders', 'customers', 'stock', 'fractioning'],
          active: true
        },
        token: `jwt-seller-${Date.now()}`
      };
    }

    return null;
  }
}
